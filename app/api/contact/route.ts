import { contactEmails } from "@/lib/contact-emails";
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
  const { owner, visitor } = contactEmails(inquiry, label, service, intent);
  try {
    const resend = new Resend(key);
    const from = process.env.CONTACT_FROM_EMAIL?.trim() || "Maurice Garcia <noreply@mauricegarcia.com>";
    const { error } = await resend.emails.send({
      from,
      to: contactEmail, replyTo: inquiry.email,
      ...owner,
    });
    if (error) return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
    // Once the owner notification is accepted, never invite a duplicate submission
    // because the secondary confirmation failed.
    let confirmationSent = false;
    try {
      const confirmation = await resend.emails.send({ from, to: inquiry.email, replyTo: contactEmail, ...visitor });
      confirmationSent = !confirmation.error;
      if (!confirmationSent) console.error("Contact confirmation rejected by email provider");
    } catch {
      console.error("Contact confirmation failed");
    }
    return NextResponse.json({ ok: true, confirmationSent });
  } catch {
    return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
  }
}
