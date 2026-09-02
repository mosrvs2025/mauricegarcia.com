"use client";

import { useState } from "react";

type Props = {
  slug: string;
  title: string;
  stripeReady: boolean;
};

export function ShopBuyButton({ slug, title, stripeReady }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mailto = `mailto:hello@mauricegarcia.com?subject=${encodeURIComponent(
    `PDF order: ${title}`,
  )}&body=${encodeURIComponent(
    `I would like to buy “${title}” (${slug}). Please send a payment link or invoice.`,
  )}`;

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout is unavailable. Email instead.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Use the email fallback.");
    } finally {
      setPending(false);
    }
  }

  if (!stripeReady) {
    return (
      <a
        href={mailto}
        className="btn btn-fill"
      >
        Email to buy
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={checkout}
        disabled={pending}
        className="btn btn-fill disabled:opacity-60"
      >
        {pending ? "Opening checkout…" : "Buy with Stripe"}
      </button>
      {error ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          {error}{" "}
          <a href={mailto} className="underline">
            Email hello@mauricegarcia.com
          </a>
        </p>
      ) : (
        <p className="text-xs text-[var(--color-ink-soft)]">
          Or{" "}
          <a href={mailto} className="underline">
            email to buy
          </a>
        </p>
      )}
    </div>
  );
}
