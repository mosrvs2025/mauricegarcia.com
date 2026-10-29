import { Marked, type Tokens } from "marked";

/**
 * Plain Markdown only, rendered to a string. There is no MDX and no component
 * execution: content (including anything an agent or a contributor wrote) is
 * data. Raw HTML is escaped and URLs are restricted, so the output is safe to
 * inject.
 */
const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const md = new Marked({ gfm: true, breaks: false });
md.use({
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) { return escapeHtml(text); },
    link({ href, title, tokens }: Tokens.Link) {
      const inner = this.parser.parseInline(tokens);
      if (!SAFE_URL.test(href)) return inner;
      const external = /^https?:/i.test(href);
      const rel = external ? ' rel="noopener noreferrer"' : "";
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(href)}"${t}${rel}>${inner}</a>`;
    },
    image({ href, text, title }: Tokens.Image) {
      if (!/^(https:\/\/|\/(?!\/))/i.test(href)) return escapeHtml(text);
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${t} loading="lazy" decoding="async">`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return md.parse(source, { async: false }) as string;
}

export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Plain-text excerpt for search indexes and feeds. */
export function plainText(source: string): string {
  return source.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`~[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
}
