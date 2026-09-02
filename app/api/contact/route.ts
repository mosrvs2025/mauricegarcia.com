import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { serviceBySlug } from "@/lib/services";

type Body = { name?: string; email?: string; service?: string; body?: string };

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

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (resendKey && to) {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: "Maurice Garcia site <noreply@mauricegarcia.com>",
      to,
      replyTo: email,
      subject: `Site inquiry: ${record.service} — ${name}`,
      text: `${body}\n\n— ${name} <${email}>`,
    });
    if (error) {
      return NextResponse.json({ error: "Email failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, via: "resend" });
  }

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
  return NextResponse.json({ ok: true, via: "inbox" });
}
