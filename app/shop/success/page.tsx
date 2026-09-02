import type { Metadata } from "next";
import Link from "next/link";
import { signDownload } from "@/lib/download-token";
import { productBySlug } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Download",
  robots: { index: false, follow: false },
};

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const stripe = getStripe();

  if (!session_id || !stripe) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-5 py-16">
        <h1 className="display text-4xl">Payment not verified</h1>
        <p className="text-[var(--color-ink-soft)]">
          If you already paid, email hello@mauricegarcia.com with your receipt and I
          will send the PDF.
        </p>
        <Link href="/shop" className="underline">
          Back to shop
        </Link>
      </div>
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const slug = session.metadata?.slug;
    const paid = session.payment_status === "paid";
    const product = productBySlug(slug);
    if (!paid || !product) {
      throw new Error("unpaid");
    }
    const token = signDownload(product.slug);
    return (
      <div className="mx-auto max-w-xl space-y-4 px-5 py-16">
        <p className="stamp">Paid</p>
        <h1 className="display text-4xl">{product.title}</h1>
        <p className="text-[var(--color-ink-soft)]">
          Your download link is signed and expires in seven days.
        </p>
        <a
          href={`/api/download?token=${token}`}
          className="btn btn-fill"
        >
          Download PDF
        </a>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-5 py-16">
        <h1 className="display text-4xl">Could not unlock the file</h1>
        <p className="text-[var(--color-ink-soft)]">
          Write to hello@mauricegarcia.com with the email you used at checkout.
        </p>
      </div>
    );
  }
}
