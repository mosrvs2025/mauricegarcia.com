import { NextResponse } from "next/server";
import { productBySlug } from "@/lib/products";
import { site } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Email hello@mauricegarcia.com." },
      { status: 503 },
    );
  }
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  const product = productBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
    customer_email: undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: product.priceCents,
          product_data: {
            name: product.title,
            description: product.blurb,
          },
        },
      },
    ],
    metadata: { slug: product.slug, file: product.file },
  });
  if (!session.url) {
    return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
