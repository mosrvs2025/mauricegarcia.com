import { NextResponse } from "next/server";
import { renderMarkdown } from "@/lib/content/markdown";
import { requireOwner } from "@/lib/studio/session";

/** Renders Markdown with the exact sanitising renderer the public pages use. */
export async function POST(req: Request) {
  const who = await requireOwner();
  if (!who.ok) return NextResponse.json({ error: who.reason }, { status: 401 });
  const { body } = await req.json().catch(() => ({ body: "" }));
  return NextResponse.json({ html: renderMarkdown(String(body ?? "").slice(0, 60000)) });
}
