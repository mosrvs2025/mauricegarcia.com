import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { readConfig } from "../lib/play/config";
import { ANIMALS, ADJECTIVES, ID_PATTERN, identityFromId, idFromBytes, roomFor } from "../lib/play/identity";
import { cursorInterval, KeyedLimiter, TokenBucket } from "../lib/play/limiter";
import { crewSize, spawnCrew, stepCrew } from "../lib/play/crew";
import { encode, MAX_PAYLOAD_BYTES, MAX_Y, parseInbound, withinBudget } from "../lib/play/protocol";
import { PlaySession, type SessionHooks } from "../lib/play/session";
import { memoryHub } from "../lib/play/transport";
import { assignSources, beginHeal, healShard, HEAL_AT_MS, HEAL_MS, insideHole, makeHole, mulberry32, planShards, stepShard, WEAPONS } from "../lib/play/weapons";

const read = (f: string) => fs.readFileSync(f, "utf8");

test("identity: anonymous, deterministic from a random id, no free text on the wire", () => {
  const id = idFromBytes([1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(id, ID_PATTERN);
  const a = identityFromId(id), b = identityFromId(id);
  assert.deepEqual(a, b);
  assert.ok(ADJECTIVES.includes(a.adjective as never) && ANIMALS.some((x) => x.name === a.animal));
  assert.match(a.color, /^hsl\(\d{1,3} 88% 64%\)$/);
  const rnd = mulberry32(99);
  const names = new Set(Array.from({ length: 200 }, () => identityFromId(idFromBytes(Array.from({ length: 8 }, () => Math.floor(rnd() * 256)))).name));
  assert.ok(names.size > 120, "names should vary");
});

test("rooms: the path is hashed, so readable URLs never reach the realtime provider", () => {
  const r = roomFor("/projects/some-unlisted-slug/");
  assert.doesNotMatch(r, /projects|slug|unlisted/);
  assert.equal(r, roomFor("/projects/some-unlisted-slug"));
  assert.equal(r, roomFor("/Projects/Some-Unlisted-Slug?x=1#top"));
  assert.notEqual(r, roomFor("/about"));
  assert.match(r, /^mg1-[a-z0-9]+$/);
});

test("token bucket: bursts, refills over time, never exceeds burst", () => {
  const b = new TokenBucket(2, 3, 0);
  assert.deepEqual([b.take(0), b.take(0), b.take(0), b.take(0)], [true, true, true, false]);
  assert.equal(b.take(400), false); assert.equal(b.take(500), true);
  assert.deepEqual([b.take(60000), b.take(60000), b.take(60000), b.take(60000)], [true, true, true, false]);
});

test("keyed limiter: one noisy sender cannot starve another, and the map stays bounded", () => {
  const l = new KeyedLimiter(1, 1, 5);
  assert.equal(l.take("a", 0), true); assert.equal(l.take("a", 0), false); assert.equal(l.take("b", 0), true);
  for (let i = 0; i < 50; i++) l.take("flood" + i, 0);
  assert.ok((l as unknown as { buckets: Map<string, unknown> }).buckets.size <= 5);
});

test("protocol: inbound messages are validated, clamped and stripped", () => {
  const ok = parseInbound("b", { i: "abcd1234", x: 0.5, y: 900, w: "bomb", s: 12345, extra: "<script>" });
  assert.deepEqual(ok, { k: "b", id: "abcd1234", x: 0.5, y: 900, w: "bomb", s: 12345 });
  assert.deepEqual(parseInbound("c", { i: "abcd1234", x: 1.04, y: 10 }), { k: "c", id: "abcd1234", x: 1, y: 10 });
  const bad: [unknown, unknown][] = [
    ["x", { i: "abcd1234", x: 0.5, y: 1 }], ["c", null], ["c", "str"], ["c", { i: "short", x: 0.5, y: 1 }], ["c", { i: "ABCD1234", x: 0.5, y: 1 }],
    ["c", { i: "abcd1234", x: NaN, y: 1 }], ["c", { i: "abcd1234", x: "0.5", y: 1 }], ["c", { i: "abcd1234", x: 2, y: 1 }], ["c", { i: "abcd1234", x: 0.5, y: -1 }],
    ["c", { i: "abcd1234", x: 0.5, y: MAX_Y + 1 }], ["b", { i: "abcd1234", x: 0.5, y: 1, w: "nuke", s: 1 }], ["b", { i: "abcd1234", x: 0.5, y: 1, w: "bomb", s: 1.5 }],
    ["b", { i: "abcd1234", x: 0.5, y: 1, w: "bomb", s: -1 }], ["b", { i: "abcd1234", x: 0.5, y: 1, w: "bomb" }],
  ];
  for (const [e, p] of bad) assert.equal(parseInbound(e, p), null, JSON.stringify([e, p]));
  // size and shape budget: about 1 KB, primitives only
  assert.equal(MAX_PAYLOAD_BYTES, 1024);
  assert.equal(parseInbound("c", { i: "abcd1234", x: 0.5, y: 1, pad: "x".repeat(2000) }), null, "oversized payload");
  assert.equal(parseInbound("c", { i: "abcd1234", x: 0.5, y: 1, nested: { a: 1 } }), null, "nested object");
  assert.equal(parseInbound("c", { i: "abcd1234", x: 0.5, y: 1, arr: [1] }), null, "array value");
  assert.equal(parseInbound("c", Object.fromEntries(Array.from({ length: 30 }, (_, i) => ["k" + i, 1]))), null, "too many keys");
  assert.equal(parseInbound("c", [1, 2, 3]), null, "array payload");
  assert.equal(withinBudget({ a: "x".repeat(1000) }), true);
  assert.equal(withinBudget({ a: "x".repeat(1100) }), false);
  const wire = JSON.stringify(encode({ k: "b", id: "abcd1234", x: 0.123456789, y: 100.7, w: "laser", s: 9 }));
  assert.ok(wire.length < 80, "payloads stay tiny");
  assert.doesNotMatch(wire, /particle|shard|name/);
});

function pair(now: () => number = () => 0) {
  const hub = memoryHub(); const log: string[] = [];
  const hooks = (tag: string): SessionHooks => ({
    onCursor: (w, x, y) => log.push(`${tag}:c:${w.id}:${x}:${y}`), onTap: (w, x, y) => log.push(`${tag}:t:${w.id}:${x}:${y}`),
    onBlast: (w, wp, x, y, s) => log.push(`${tag}:b:${w.id}:${wp}:${x}:${y}:${s}`), onPeers: () => {}, onStatus: () => {},
  });
  const a = new PlaySession(hub, "aaaaaaaa", hooks("A"), now), b = new PlaySession(hub, "bbbbbbbb", hooks("B"), now);
  return { hub, log, a, b };
}

test("session: nothing is sent when alone, then cursors, taps and blasts reach the other visitor only", () => {
  const { log, a, b } = pair();
  a.join("/");
  assert.equal(a.cursor(0.5, 100), false, "empty room: no traffic");
  b.join("/");
  assert.equal(a.peerCount, 2);
  assert.equal(a.cursor(0.5, 100), true); assert.equal(a.tap(0.2, 50), true); assert.equal(a.blast("hammer", 0.3, 400, 77), true);
  assert.deepEqual(log, ["B:c:aaaaaaaa:0.5:100", "B:t:aaaaaaaa:0.2:50", "B:b:aaaaaaaa:hammer:0.3:400:77"]);
});

test("session: different pages are different rooms, and leaving updates the count", () => {
  const { log, a, b } = pair();
  a.join("/"); b.join("/about");
  assert.equal(a.peerCount, 1); assert.equal(a.tap(0.1, 1), false); assert.deepEqual(log, []);
  b.join("/"); assert.equal(a.peerCount, 2);
  b.leave(); assert.equal(a.peerCount, 1);
});

test("session: cursors go out at about 4 Hz, delta-only, and slow down as the room fills", () => {
  let t = 0; const { a, b } = pair(() => t);
  a.join("/"); b.join("/");
  assert.equal(cursorInterval(2), 250);
  assert.equal(a.cursor(0.5, 100), true);
  t += 300; assert.equal(a.cursor(0.50001, 101), false, "tiny movement is dropped");
  t += 100; assert.equal(a.cursor(0.1, 400), true);
  t += 100; assert.equal(a.cursor(0.2, 500), false, "faster than 250 ms is dropped");
  let sent = 0; for (t = 10000; t < 11000; t += 10) if (a.cursor(0.1 + (t % 97) / 200, 100 + (t % 89) * 9)) sent++;
  assert.ok(sent >= 3 && sent <= 4, `about 4 per second (${sent})`);
  let blasts = 0; t += 5000; for (let i = 0; i < 20; i++) if (a.blast("bomb", 0.5, 10, i)) blasts++;
  assert.equal(blasts, 3);
});

test("cursor rate falls with population and stops in a crowd; blasts still work", () => {
  assert.deepEqual([1, 4, 5, 10, 11, 25, 26, 60, 61, 500].map(cursorInterval), [250, 250, 400, 400, 800, 800, 1500, 1500, null, null]);
  let t = 0; const hub = memoryHub();
  const a = new PlaySession(hub, "aaaaaaaa", { onCursor() {}, onTap() {}, onBlast() {}, onPeers() {}, onStatus() {} }, () => t);
  a.join("/");
  const others = Array.from({ length: 70 }, (_, i) => hub.join(roomFor("/"), "p" + String(i).padStart(7, "0"), { onMessage() {}, onPresence() {}, onStatus() {} }));
  assert.equal(a.peerCount, 71); assert.equal(a.cursorEvery, null);
  t = 1000; assert.equal(a.cursor(0.5, 10), false, "crowded: cursors off");
  assert.equal(a.blast("blaster", 0.5, 10, 1), true, "but blasts still go out");
  for (const o of others) o.leave();
  assert.equal(a.cursorEvery, 250);
});

test("session: suspended (background) tabs neither send nor process anything", () => {
  let t = 0; const hub = memoryHub(); const got: string[] = [];
  const a = new PlaySession(hub, "aaaaaaaa", { onCursor() {}, onTap() {}, onBlast() {}, onPeers() {}, onStatus() {} }, () => t);
  const b = new PlaySession(hub, "bbbbbbbb", { onCursor: () => got.push("c"), onTap: () => got.push("t"), onBlast: () => got.push("b"), onPeers() {}, onStatus() {} }, () => t);
  a.join("/"); b.join("/");
  b.suspend(true); t += 1000;
  a.tap(0.1, 5); a.blast("hammer", 0.1, 5, 3); assert.deepEqual(got, [], "receiver drops while suspended");
  a.suspend(true); assert.equal(a.tap(0.1, 5), false, "sender is silent while suspended");
  a.suspend(false); b.suspend(false); t += 1000; a.tap(0.1, 5); assert.deepEqual(got, ["t"]);
});

test("session: reconnecting starts from a clean slate (peers reset, limits reset, cursor delta reset)", () => {
  let t = 0; const hub = memoryHub(); const statuses: string[] = [];
  const a = new PlaySession(hub, "aaaaaaaa", { onCursor() {}, onTap() {}, onBlast() {}, onPeers() {}, onStatus: (s) => statuses.push(s) }, () => t);
  const b = new PlaySession(hub, "bbbbbbbb", { onCursor() {}, onTap() {}, onBlast() {}, onPeers() {}, onStatus() {} }, () => t);
  a.join("/"); b.join("/");
  for (let i = 0; i < 6; i++) a.tap(0.1, 5); // spend the burst
  assert.equal(a.tap(0.1, 5), false);
  // simulate a provider outage and recovery through the transport hooks
  const room = hub.rooms.get(roomFor("/"))!; const ev = room.get("aaaaaaaa")!;
  ev.onStatus("offline"); assert.equal(a.peerCount, 1); assert.equal(a.listening, false);
  ev.onStatus("online"); ev.onPresence(["aaaaaaaa", "bbbbbbbb"]);
  assert.equal(a.tap(0.1, 5), true, "fresh budget after reconnecting");
  assert.deepEqual(statuses.slice(-2), ["offline", "online"]);
  ev.onStatus("failed"); assert.equal(a.listening, false, "gave up: local effects only, nothing sent");
});

test("session: a flooding or malformed sender is ignored by receivers, and own echoes are dropped", () => {
  let t = 0; const hub = memoryHub(); const got: string[] = [];
  const b = new PlaySession(hub, "bbbbbbbb", { onCursor: () => got.push("c"), onTap: () => {}, onBlast: (_w, w) => got.push(w), onPeers: () => {}, onStatus: () => {} }, () => t);
  b.join("/");
  const evil = hub.join(roomFor("/"), "eeeeeeee", { onMessage: () => {}, onPresence: () => {}, onStatus: () => {} });
  for (let i = 0; i < 50; i++) evil.send("b", { i: "eeeeeeee", x: 0.5, y: 10, w: "bomb", s: i });
  evil.send("b", { i: "eeeeeeee", x: 9, y: 10, w: "bomb", s: 1 }); evil.send("b", { i: "eeeeeeee", x: 0.5, y: 10, w: "<img>", s: 1 }); evil.send("zz", {});
  evil.send("c", { i: "bbbbbbbb", x: 0.5, y: 1 }); // spoofing the receiver's own id
  assert.equal(got.filter((x) => x === "bomb").length, 4, "burst of 4 then dropped");
  evil.send("b", { i: "eeeeeeee", x: 0.5, y: 10, w: "bomb", s: 1, pad: "z".repeat(5000) });
  assert.equal(got.filter((x) => x === "bomb").length, 4, "oversized payload never reaches the stage");
  assert.equal(got.filter((x) => x === "c").length, 0);
});

test("event storm: rotating fake sender ids cannot beat the total budget", () => {
  let t = 0; const hub = memoryHub(); let blasts = 0, cursors = 0;
  const b = new PlaySession(hub, "bbbbbbbb", { onCursor: () => cursors++, onTap() {}, onBlast: () => blasts++, onPeers() {}, onStatus() {} }, () => t);
  b.join("/");
  const evil = hub.join(roomFor("/"), "eeeeeeee", { onMessage() {}, onPresence() {}, onStatus() {} });
  for (let i = 0; i < 2000; i++) {
    const id = "f" + i.toString(36).padStart(7, "0");
    evil.send("b", { i: id, x: 0.5, y: 10, w: "bomb", s: i }); evil.send("c", { i: id, x: 0.5, y: 10 });
  }
  assert.ok(blasts <= 6, `blasts capped at the burst (${blasts})`);
  assert.ok(cursors <= 60, `cursors capped (${cursors})`);
  t += 1000; for (let i = 0; i < 100; i++) evil.send("b", { i: "g" + i.toString(36).padStart(7, "0"), x: 0.5, y: 10, w: "bomb", s: i });
  assert.ok(blasts <= 6 + 8 + 1, `sustained rate capped (${blasts})`);
});

test("weapons: the same seed gives the same blast on every client; physics settles; healing is exact and staggered", () => {
  for (const spec of Object.values(WEAPONS)) {
    const h1 = makeHole(spec, 500, 500, 42), h2 = makeHole(spec, 500, 500, 42);
    assert.deepEqual(h1, h2);
    const p1 = planShards(spec, h1, 42, 600), p2 = planShards(spec, h2, 42, 600);
    assert.ok(p1.shards.length > 20 && p1.shards.length <= 600 * 1.2, `${spec.id} shard count ${p1.shards.length}`);
    assert.deepEqual(p1.shards, p2.shards);
    assert.ok(p1.shards.every((s) => insideHole(h1, s.ox, s.oy)));
    assert.ok(p1.shards.every((s) => s.sx >= 0 && s.sy >= 0 && s.sx + s.size <= p1.b.width + 1 && s.sy + s.size <= p1.b.height + 1), "chunks stay inside the bounds");
    // a capture of only the on-screen half: chunks outside it become procedural, the rest keep their source
    const half = { left: p1.b.left, top: p1.b.top, width: p1.b.width, height: p1.b.height / 2 };
    const probe = planShards(spec, h1, 42, 600).shards; assignSources(probe, half);
    assert.ok(probe.every((s) => (s.oy - s.size / 2 >= half.top + half.height - 0.5 ? s.proc : true)), "off-capture chunks are procedural");
    assert.ok(probe.some((s) => !s.proc) && probe.some((s) => s.proc) || spec.id === "laser", "mixed sources for a partial capture");
    const none = planShards(spec, h1, 42, 600).shards; assignSources(none, null);
    assert.ok(none.every((s) => s.proc && s.ci >= 0 && s.ci <= 3), "no capture: everything is procedural");
    const small = planShards(spec, h1, 42, 40);
    assert.ok(small.shards.length <= 48, "budget is respected by growing the chunks");
    // physics: everything lands on the floor within a few seconds
    const floor = 900;
    for (let i = 0; i < 400; i++) for (const s of p1.shards) stepShard(s, 1 / 60, floor);
    assert.ok(p1.shards.every((s) => s.rest && s.y <= floor), `${spec.id} debris settles`);
    // healing: everything ends exactly home; nearer chunks start earlier
    for (const s of p1.shards) beginHeal(s);
    for (const s of p1.shards) assert.equal(healShard(s, 1), true);
    assert.ok(p1.shards.every((s) => Math.abs(s.x - s.ox) < 1e-6 && Math.abs(s.y - s.oy) < 1e-6 && Math.abs(Math.sin(s.rot)) < 1e-6));
    const sorted = [...p1.shards].sort((a, b) => a.delay - b.delay);
    assert.ok(sorted[0].delay < sorted[sorted.length - 1].delay);
  }
  assert.ok(HEAL_AT_MS + HEAL_MS >= 9500 && HEAL_AT_MS + HEAL_MS <= 11000, "the page heals after about ten seconds");
  const r = mulberry32(7), r2 = mulberry32(7); assert.equal(r(), r2());
});

test("repair crews: only touch settled debris, carry chunks home, and stand down for the heal", () => {
  const spec = WEAPONS.bomb; const hole = makeHole(spec, 600, 500, 5); const { shards } = planShards(spec, hole, 5, 300);
  assert.equal(crewSize(10, false), 0); assert.equal(crewSize(300, true), 0, "no crews with reduced motion"); assert.ok(crewSize(300, false) >= 1 && crewSize(300, false) <= 3);
  const crew = spawnCrew(hole, 5, 2, ["🦦", "🦔"]);
  assert.deepEqual(crew.map((c) => c.emoji), spawnCrew(hole, 5, 2, ["🦦", "🦔"]).map((c) => c.emoji), "deterministic");
  for (let i = 0; i < 20; i++) for (const c of crew) stepCrew(c, shards, 1 / 60, false);
  assert.ok(shards.every((s) => !s.carried && !s.placed), "nothing is touched while debris is still flying");
  for (let i = 0; i < 400; i++) for (const s of shards) stepShard(s, 1 / 60, 900);
  for (let i = 0; i < 60 * 8; i++) for (const c of crew) stepCrew(c, shards, 1 / 60, false);
  const placed = shards.filter((s) => s.placed);
  assert.ok(placed.length >= 2, `crews rebuilt some chunks (${placed.length})`);
  assert.ok(placed.every((s) => s.x === s.ox && s.y === s.oy && s.rot === 0));
  const carrying = shards.filter((s) => s.carried).length;
  for (const c of crew) stepCrew(c, shards, 1 / 60, true);
  assert.ok(shards.every((s) => !s.carried) || carrying === 0, "chunks are dropped when the crew leaves");
  assert.ok(crew.every((c) => c.state === "leave"));
  for (const s of shards) beginHeal(s); for (const s of shards) healShard(s, 1);
  assert.ok(shards.every((s) => Math.abs(s.x - s.ox) < 1e-6 && Math.abs(s.y - s.oy) < 1e-6), "heal still ends exactly home with placed chunks");
});

test("config: realtime is optional, the key is public-only, and there is a kill switch", () => {
  assert.deepEqual(readConfig({}), { enabled: true, realtime: null });
  assert.deepEqual(readConfig({ off: " OFF " }), { enabled: false, realtime: null });
  assert.equal(readConfig({ url: "https://abc.supabase.co/", key: "k".repeat(30) }).realtime?.url, "https://abc.supabase.co");
  assert.equal(readConfig({ url: "http://evil.example", key: "k".repeat(30) }).realtime, null, "plain http only for localhost");
  assert.equal(readConfig({ url: "http://localhost:4455", key: "k".repeat(30) }).realtime?.url, "http://localhost:4455");
  assert.equal(readConfig({ url: "https://abc.supabase.co", key: "short" }).realtime, null);
});

test("accessibility and safety wiring: overlay is inert unless armed, decorative, and has an off switch", () => {
  const css = read("app/play.css"), ui = read("components/play/Playground.tsx"), layout = read("app/layout.tsx");
  assert.match(css, /\.play-canvas \{[^}]*pointer-events:none/);
  assert.match(css, /\.play-canvas\.is-armed \{[^}]*pointer-events:auto/);
  assert.match(css, /touch-action:pan-x pan-y pinch-zoom/, "touch scrolling stays available in weapons mode");
  assert.match(css, /@media \(pointer:coarse\)[^}]*min-height:44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(ui, /aria-hidden="true" data-play/);
  assert.match(ui, /aria-pressed=\{armed\}/);
  assert.match(ui, /aria-label="Exit the playground and disconnect"/);
  assert.match(ui, /e\.key === "Escape"/);
  assert.match(ui, /prefers-reduced-motion: reduce/);
  assert.match(ui, /saveData/);
  assert.match(layout, /<Playground \/>/);
  // opt-in: nothing starts until the visitor has entered, and the card carries the privacy notice
  assert.match(ui, /const active = ready && entered && /);
  assert.match(ui, /Enter the Playground/);
  assert.match(ui, /sees your IP address/);
  assert.match(ui, /Anonymous: a random animal name, no accounts, nothing stored/);
  assert.doesNotMatch(ui, /localStorage\.setItem\(IN_KEY/, "entering is per tab session, not remembered across visits");
  assert.match(css, /\.play-enter/);
  // no personal data and no free text: the stage and session never read names, emails or storage keys other than their own
  for (const f of ["lib/play/session.ts", "lib/play/protocol.ts", "lib/play/transport.ts"]) assert.doesNotMatch(read(f), /navigator\.userAgent|localStorage|document\.cookie|location\.href/);
  // the stage only reads the page: no writes to the DOM tree other than its own animations
  assert.doesNotMatch(read("lib/play/stage.ts") + read("lib/play/snapshot.ts"), /innerHTML|appendChild|\.remove\(\)|setAttribute|classList|\.style\./);
});
