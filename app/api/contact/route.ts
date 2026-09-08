import { NextResponse } from "next/server";
import { Resend } from "resend";
import { serviceBySlug } from "@/lib/services";
import { contactEmail, parseInquiry } from "@/lib/contact";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 20000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const inquiry = parseInquiry(value);
  if (!inquiry) return NextResponse.json({ error: "Please check your name, email, and project details." }, { status: 400 });
  if (inquiry.companyFax) return NextResponse.json({ error: "Unable to submit this request." }, { status: 400 });
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Email is temporarily unavailable. Please email Maurice directly." }, { status: 503 });
  const service = serviceBySlug(inquiry.service)?.name || "General inquiry";
  const text = [`Service: ${service}`, `Name: ${inquiry.name}`, `Email: ${inquiry.email}`, `Business: ${inquiry.business || "Not provided"}`, `Website: ${inquiry.website || "Not provided"}`, `Budget: ${inquiry.budget || "Not sure yet"}`, `Timeline: ${inquiry.timeline || "Flexible"}`, "", "Project brief:", inquiry.body].join("\n");
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.CONTACT_FROM_EMAIL?.trim() || "Maurice Garcia site <noreply@mauricegarcia.com>",
      to: contactEmail, replyTo: inquiry.email,
      subject: `Website inquiry: ${service} — ${inquiry.name}`, text,
    });
    if (error) return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Email could not be sent. Please try again or email Maurice directly." }, { status: 502 });
  }
}
