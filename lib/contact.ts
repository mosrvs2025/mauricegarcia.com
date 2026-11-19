export const contactEmail = "hello@mauricegarcia.com";

/** The whole contract of the contact form: a message and a reply address are required, a name is optional. */
export const CONTACT_LIMITS = { messageMin: 10, messageMax: 3000, nameMax: 80, emailMax: 254 } as const;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Inquiry = { message: string; email: string; name: string; companyFax: string };

// Control characters other than tab and newline never belong in a message (or anywhere near an email header).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (v: string) => v.replace(/\r\n?/g, "\n").replace(CONTROL, "").trim();

/**
 * Validates and trims a submission on the server. Accepts `message` (or the older `body` key), `email`, an optional
 * `name` and the `companyFax` honeypot; anything else is ignored. Returns null when the submission is not acceptable.
 */
export function parseInquiry(value: unknown): Inquiry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  for (const key of ["message", "body", "email", "name", "companyFax"]) {
    if (source[key] !== undefined && typeof source[key] !== "string") return null;
  }
  const str = (key: string) => clean((source[key] as string | undefined) ?? "");
  const message = str("message") || str("body");
  const email = str("email");
  const name = str("name");
  const companyFax = str("companyFax");
  if (message.length < CONTACT_LIMITS.messageMin || message.length > CONTACT_LIMITS.messageMax) return null;
  if (email.length > CONTACT_LIMITS.emailMax || !EMAIL_PATTERN.test(email) || /[\n\t]/.test(email)) return null;
  if (name.length > CONTACT_LIMITS.nameMax || /[\n\t]/.test(name)) return null;
  if (companyFax.length > 200) return null;
  return { message, email, name, companyFax };
}

/** Bulk-link spam is the common abuse of an open contact form; a friendly note rarely has more than a couple of links. */
export const linkCount = (text: string) => (text.match(/https?:\/\/|www\./gi) || []).length;

const hits = new Map<string, number[]>();
/** Best-effort per-instance rate limit: 5 submissions per 10 minutes per client. */
export function allowSubmission(key: string, now = Date.now(), limit = 5, windowMs = 600_000): boolean {
  const recent = (hits.get(key) || []).filter((t) => t > now - windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return false; }
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
export const resetSubmissions = () => hits.clear();
