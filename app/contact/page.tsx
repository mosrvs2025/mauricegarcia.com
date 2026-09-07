import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { serviceBySlug } from "@/lib/services";

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan a website, redesign, or custom application with Maurice Garcia.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const known = serviceBySlug(service);
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-16">
      <header>
        <p className="stamp">Contact</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Plan your website.</h1>
        <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
          {known
            ? `You selected ${known.name} (${known.price}). Change it below if that is wrong.`
            : "A few details are enough to get started. I will review your brief and follow up with next steps."}
        </p>
      </header>
      <ContactForm initialService={known?.slug} />
    </div>
  );
}

