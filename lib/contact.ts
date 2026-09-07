export const contactEmail = "hello@mauricegarcia.com";
export function parseInquiry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const limits: Record<string, number> = { name: 100, email: 254, service: 100, body: 5000, business: 200, website: 500, budget: 100, timeline: 100, companyFax: 200 };
  const fields: Record<string, string> = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (source[key] !== undefined && typeof source[key] !== "string") return null;
    fields[key] = (source[key] as string | undefined)?.trim() || "";
    if (fields[key].length > limit) return null;
  }
  if (!fields.name || !fields.body || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || /[\r\n]/.test(fields.name)) return null;
  return fields;
}

