import { NextResponse } from "next/server";
import { Resend } from "resend";
import { serviceBySlug } from "@/lib/services";
import { allowSubmission, contactEmail, INTENT_LABELS, linkCount, parseInquiry, type Intent } from "@/lib/contact";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 20000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const inquiry = parseInquiry(value);
  if (!inquiry) return NextResponse.json({ error: "Please check your name, email, and message." }, { status: 400 });
  if (inquiry.companyFax) return NextResponse.json({ error: "Unable to submit this request." }, { status: 400 });
  if (linkCount(inquiry.body) > 3) return NextResponse.json({ error: "That message has several links in it. Please trim it to one or two, or email me directly." }, { status: 400 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allowSubmission(client)) return NextResponse.json({ error: "A few messages have come from this connection recently. Please wait a few minutes, or email me directly." }, { status: 429 });
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Email is temporarily unavailable. Please email Maurice directly." }, { status: 503 });
  const service = serviceBySlug(inquiry.service)?.name;
  const intent = inquiry.intent ? INTENT_LABELS[inquiry.intent as Intent] : undefined;
  const label = service || intent || "General inquiry";
  const text = [
    `Intent: ${intent || "Not selected"}`,
    `Service: ${service || "None"}`,
    `Project: ${inquiry.project ? `${inquiry.project} (https://mauricegarcia.com/projects/${inquiry.project})` : "None"}`,
    `Name: ${inquiry.name}`, `Email: ${inquiry.email}`,
    `Business: ${inquiry.business || "Not provided"}`, `Website: ${inquiry.website || "Not provided"}`,
    `Budget: ${inquiry.budget || "Not provided"}`, `Timeline: ${inquiry.timeline || "Not provided"}`,
    "", "Message:", inquiry.body,
  ].join("\n");
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.CONTACT_FROM_EMAIL?.trim() || "Maurice Garcia site <noreply@mauricegarcia.com>",
      to: contactEmail, replyTo: inquiry.email,
      subject: `Website inquiry: ${label} — ${inquiry.name}`, text,
    });
    if (error) return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
  }
}
