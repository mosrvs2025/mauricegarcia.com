import { NextResponse } from "next/server";
import { sameOrigin } from "./auth";
import { requireOwner, studioStore } from "./session";
import { StoreConflict, StoreError, type ContentStore } from "./store";
import { ValidationFailed } from "./service";

type Handler = (ctx: { req: Request; store: ContentStore; body: any }) => Promise<unknown>;

/** Every studio endpoint: owner session, same-origin, a configured store, JSON in/out, honest errors. */
export function studioRoute(handler: Handler, opts: { mutating: boolean } = { mutating: true }) {
  return async (req: Request) => {
    const who = await requireOwner();
    if (!who.ok) return NextResponse.json({ error: who.reason }, { status: who.configured ? 401 : 503 });
    if (opts.mutating && !sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const { store, reason } = studioStore();
    if (!store) return NextResponse.json({ error: `Saving isn't configured: ${reason}` }, { status: 503 });
    const raw = req.method === "GET" ? "" : await req.text();
    if (raw.length > 200_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
    let body: any = {};
    if (raw) { try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); } }
    try {
      return NextResponse.json({ ok: true, ...(await handler({ req, store, body }) as object) });
    } catch (e) {
      if (e instanceof ValidationFailed) return NextResponse.json({ error: "Not saved: fix these first.", issues: e.issues }, { status: 422 });
      if (e instanceof StoreConflict) return NextResponse.json({ error: e.message }, { status: 409 });
      if (e instanceof StoreError) return NextResponse.json({ error: e.message }, { status: 502 });
      return NextResponse.json({ error: "Something went wrong. Nothing was saved." }, { status: 500 });
    }
  };
}
