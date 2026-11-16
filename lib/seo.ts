/**
 * Search and AI crawlers that are explicitly welcome in robots.txt. Keep this list in step with the owner's intent:
 * adding a name here opens the public site to that crawler, removing one does not block it (the "*" group still allows it).
 */
export const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai",
  "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot",
] as const;

/** Paths no crawler should fetch: the owner studio and every API route. */
export const ROBOTS_DISALLOW = ["/studio", "/api/"];
