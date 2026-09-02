import { createHmac, timingSafeEqual } from "crypto";
import { productBySlug } from "./products";

function secret() {
  return (
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-download-secret-not-for-production"
  );
}

export function signDownload(slug: string, ttlSeconds = 60 * 60 * 24 * 7) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${slug}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ slug, exp, sig })).toString("base64url");
}

export function verifyDownload(token: string) {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      slug?: string;
      exp?: number;
      sig?: string;
    };
    if (!parsed.slug || !parsed.exp || !parsed.sig) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!productBySlug(parsed.slug)) return null;
    const payload = `${parsed.slug}.${parsed.exp}`;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    const a = Buffer.from(parsed.sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return productBySlug(parsed.slug)!;
  } catch {
    return null;
  }
}
