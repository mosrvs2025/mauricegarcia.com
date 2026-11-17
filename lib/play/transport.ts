import type { PlayConfig } from "./config";

/** failed: gave up after repeated errors, the playground carries on with local effects only. */
export type LinkStatus = "connecting" | "online" | "offline" | "failed";
export type RoomEvents = {
  onMessage(event: string, payload: unknown): void;
  /** The ids currently present in the room, including this client. */
  onPresence(ids: string[]): void;
  onStatus(status: LinkStatus): void;
};
export type RoomHandle = { send(event: string, payload: Record<string, unknown>): void; leave(): void };
export type Transport = { join(room: string, id: string, events: RoomEvents): RoomHandle };

/** After this many failed joins in a row we stop retrying, so a wrong key can never hammer the provider. */
const MAX_FAILURES = 3;

/**
 * Supabase Realtime, broadcast and presence only (no database, no auth, no tables). The library is imported on
 * demand, so visitors who never enable the playground never download it.
 */
export function supabaseTransport(config: PlayConfig): Transport {
  type Client = import("@supabase/realtime-js").RealtimeClient;
  let clientPromise: Promise<Client> | null = null;
  const getClient = () => (clientPromise ??= import("@supabase/realtime-js").then(({ RealtimeClient }) =>
    new RealtimeClient(`${config.url}/realtime/v1`, { params: { apikey: config.key, eventsPerSecond: 10 }, heartbeatIntervalMs: 25000 })));

  return {
    join(room, id, events) {
      let closed = false; let failures = 0;
      let channel: import("@supabase/realtime-js").RealtimeChannel | null = null;
      let client: Client | null = null;
      events.onStatus("connecting");
      getClient().then((c) => {
        if (closed) return;
        client = c;
        const ch = c.channel(room, { config: { broadcast: { self: false, ack: false }, presence: { key: id, enabled: true } } });
        channel = ch;
        ch.on("broadcast", { event: "*" }, (m: { event: string; payload: unknown }) => events.onMessage(m.event, m.payload))
          .on("presence", { event: "sync" }, () => events.onPresence(Object.keys(ch.presenceState())))
          .subscribe((status: string) => {
            if (closed) return;
            if (status === "SUBSCRIBED") { failures = 0; events.onStatus("online"); void ch.track({ v: 1 }); }
            else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              if (++failures >= MAX_FAILURES) { closed = true; void c.removeChannel(ch); events.onStatus("failed"); }
              else events.onStatus("offline");
            } else if (status === "CLOSED") events.onStatus("offline");
          });
      }).catch(() => { if (!closed) { closed = true; events.onStatus("failed"); } });
      return {
        send(event, payload) { if (!closed && channel) void channel.send({ type: "broadcast", event, payload }); },
        leave() {
          if (closed && !channel) return;
          closed = true;
          const ch = channel; const c = client; channel = null;
          if (ch && c) void c.removeChannel(ch).then(() => { if (c.getChannels().length === 0) void c.disconnect(); }).catch(() => {});
        },
      };
    },
  };
}

/** In-memory transport for tests and the solo fallback: sessions in the same process hear each other. */
export function memoryHub(): Transport & { rooms: Map<string, Map<string, RoomEvents>> } {
  const rooms = new Map<string, Map<string, RoomEvents>>();
  const announce = (members: Map<string, RoomEvents>) => { const ids = [...members.keys()]; for (const m of members.values()) m.onPresence(ids); };
  return {
    rooms,
    join(room, id, events) {
      const members = rooms.get(room) ?? new Map<string, RoomEvents>();
      rooms.set(room, members); members.set(id, events);
      events.onStatus("online"); announce(members);
      return {
        send(event, payload) { for (const [other, ev] of members) if (other !== id) ev.onMessage(event, JSON.parse(JSON.stringify(payload))); },
        leave() { members.delete(id); announce(members); if (!members.size) rooms.delete(room); },
      };
    },
  };
}
