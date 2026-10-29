export const contactEmail = "hello@mauricegarcia.com";

export const INTENTS = ["hello", "collaborate", "paid-work", "partner", "coaching", "hire"] as const;
export type Intent = (typeof INTENTS)[number];
export const INTENT_LABELS: Record<Intent, string> = { hello: "Saying hello", collaborate: "Collaboration", "paid-work": "Build something", partner: "Licensing, partnership or investment", coaching: "Learning with me", hire: "Hiring or a role" };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseInquiry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const limits: Record<string, number> = { name: 100, email: 254, service: 100, body: 5000, business: 200, website: 500, budget: 100, timeline: 100, companyFax: 200, intent: 20, project: 80 };
  const fields: Record<string, string> = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (source[key] !== undefined && typeof source[key] !== "string") return null;
    fields[key] = (source[key] as string | undefined)?.trim() || "";
    if (fields[key].length > limit) return null;
  }
  if (!fields.name || !fields.body || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || /[\r\n]/.test(fields.name)) return null;
  if (fields.intent && !(INTENTS as readonly string[]).includes(fields.intent)) return null;
  if (fields.project && !SLUG.test(fields.project)) return null;
  return fields;
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
