# Live playground

An anonymous, real-time overlay: other visitors' cursors and tap ripples, plus a weapons mode (blaster, bomb, laser, hammer) that blasts the page with canvas debris. The real DOM is never changed; everything is drawn on one fixed canvas.

## What visitors see
- A small dock (bottom-left; above "Let's talk" on phones): a random animal name and colour for this tab, how many others are on the page, a **Weapons** toggle and **Off**.
- Cursors and tap ripples of visitors on the same page. Others' blasts appear on your screen too.
- Weapons mode: pick a weapon, click or tap the page. A crater and scorch mark appear, chunks of an approximate snapshot of the page fly with physics, the page shakes a little, then about 10 seconds later the chunks fly home and the crater lifts.
- Keys while armed: `1`–`4` pick a weapon, `Esc` leaves weapons mode.

## Rules it follows
- **Off by default** for visitors with reduced motion or Data Saver; the choice is remembered in `localStorage` (`mg-play`). A visitor can switch it off at any time.
- The canvas has `pointer-events: none` unless weapons mode is on, so links, scrolling and keyboard navigation are untouched. In weapons mode touch scrolling still works (`touch-action: pan-x pan-y pinch-zoom`); a tap fires, a scroll does not.
- Nothing downloads until the page is idle and the playground is on. The realtime library is a separate lazy chunk (~17 kB gzip).
- Not shown on `/studio`, `/api` or the legacy/lab/game pages.
- Hidden for more than 20 s or idle for 2 min, a tab leaves the room (so idle tabs never hold a connection slot) and rejoins on activity.

## Privacy
- Identity is a random 8-character id per tab (`sessionStorage`), and the animal name and colour are derived from it on each client. No names, text, cookies, accounts or analytics ids are sent.
- Rooms are per page and named by a hash of the path, so readable (including unlisted) URLs never reach the provider.
- Messages: `c` cursor, `t` tap, `b` blast `{weapon, x, y, seed}`. `x` is a fraction of page width, `y` is pixels from the top of the page. Particle positions are never sent: every client simulates the blast from the shared seed.
- The realtime provider (Supabase) necessarily sees a visitor's IP address when the WebSocket connects. The site stores nothing.

## Abuse limits
Supabase broadcast has no server-side hook, so limits live in the clients and are enforced twice: by the sender and by every receiver.
- Send budgets (token bucket): cursors ≈12/s (delta-only, movements under ~2 px are skipped), taps 3/s, blasts 2.5/s, plus per-weapon cooldowns. Nothing is sent while alone in a room.
- Receive: every inbound message is validated (id format, finite numbers, `x` 0–1, `y` 0–60000, known weapon, integer seed) and rate-limited per sender; unknown fields are dropped; at most 40 cursors and 12 blasts are alive at once, and the debris count is capped (fewer on phones).
- Backstop: Supabase's own project limits (free plan: 200 concurrent connections, 100 messages/s, 2M messages/month). Past those, realtime degrades to "offline" and the playground still works solo.

## Setup (owner)
1. Create a free Supabase project. No tables, auth or policies are needed; Realtime broadcast and presence on public channels is enabled by default (Project settings → Realtime → leave "Allow public access" on).
2. In Vercel set `NEXT_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon/publishable key). These are public by design. **Never** use the `service_role` key here.
3. Redeploy (these are inlined at build time). Without them the playground runs solo.
4. Kill switch: set `NEXT_PUBLIC_PLAYGROUND=off` and redeploy to remove it entirely.

## Local testing without Supabase
Any server that speaks the Phoenix v2 channel protocol works. `memoryHub()` in `lib/play/transport.ts` is used by the tests; for browsers, point `NEXT_PUBLIC_SUPABASE_URL` at `http://localhost:<port>` (plain `http` is accepted for localhost only).

## Code map
`lib/play/` identity, limiter, protocol (wire format + validation), session (rooms, limits), transport (Supabase + in-memory), weapons (deterministic shards and physics), snapshot (DOM → canvas approximation), stage (canvas engine). `components/play/Playground.tsx` is the dock. `app/play.css` styles. `tests/play.test.ts` covers all of it except pixels.

## Follow-ups (not built)
Meteor showers everyone shoots down, tiny animal repair crews that rebuild damage, and a secret boss after enough collective destruction. These need a shared counter or a server-side authority; with broadcast-only transport they would be client-side approximations. Server-side rate limiting (PartyServer on Cloudflare Workers) is the upgrade path if abuse ever shows up.
