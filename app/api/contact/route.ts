import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { serviceBySlug } from "@/lib/services";

type Body = { name?: string; email?: string; service?: string; body?: string };

async function saveLocally(record: Record<string, string>) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "inbox.json");
  let inbox: unknown[] = [];
  try {
    inbox = JSON.parse(await readFile(file, "utf8")) as unknown[];
  } catch {
    inbox = [];
  }
  inbox.push(record);
  await writeFile(file, JSON.stringify(inbox, null, 2));
}

export async function POST(req: Request) {
  const json = (await req.json().catch(() => ({}))) as Body;
  const name = (json.name || "").trim();
  const email = (json.email || "").trim();
  const service = (json.service || "").trim();
  const body = (json.body || "").trim();
  if (!name || !email || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const known = serviceBySlug(service);
  const record = {
    at: new Date().toISOString(),
    name,
    email,
    service: known?.slug || service || "general",
    body,
  };

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim() ||
    "Maurice Garcia site <noreply@mauricegarcia.com>";

  if (!resendKey || !to) {
    if (process.env.NODE_ENV === "development") {
      await saveLocally(record);
      return NextResponse.json({ ok: true, via: "inbox" });
    }
    console.error("[contact] Missing RESEND_API_KEY or CONTACT_TO_EMAIL");
    return NextResponse.json(
      { error: "Contact email is not configured" },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Site inquiry: ${record.service} — ${name}`,
      text: `${body}\n\n— ${name} <${email}>`,
    });
    if (error) {
      console.error("[contact] Resend rejected the message", error);
      return NextResponse.json({ error: "Email failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, via: "resend" });
  } catch (error) {
    console.error("[contact] Resend request failed", error);
    return NextResponse.json({ error: "Email failed" }, { status: 502 });
  }
}

