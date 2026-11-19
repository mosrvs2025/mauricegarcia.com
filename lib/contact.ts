export const contactEmail = "hello@mauricegarcia.com";

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 3000;
export const NAME_MAX = 80;

export type ContactInquiry = {
  message: string;
  /** Alias for message, kept for compatibility with existing email helpers. */
  body: string;
  email: string;
  name: string;
  companyFax: string;
};

/**
 * Validates and trims a contact submission.
 * Only `message` (10–3000 chars; also accepts legacy `body` key) and `email` are required.
 * `name` is optional (max 80 chars). No intent, budget, timeline, or service is required.
 */
export function parseInquiry(value: unknown): ContactInquiry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;

  const rawMessage = source.message !== undefined ? source.message : source.body;
  if (typeof rawMessage !== "string") return null;
  if (typeof source.email !== "string") return null;
  if (source.name !== undefined && typeof source.name !== "string") return null;
  if (source.companyFax !== undefined && typeof source.companyFax !== "string") return null;

  const message = rawMessage.trim();
  const email = source.email.trim();
  const name = (source.name ?? "").trim();
  const companyFax = (source.companyFax ?? "").trim();

  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) return null;
  if (!email || email.length > 254 || /[\r\n]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (name.length > NAME_MAX || /[\r\n]/.test(name)) return null;
  if (companyFax.length > 200) return null;

  return { message, body: message, email, name, companyFax };
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
