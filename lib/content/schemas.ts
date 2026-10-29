import { z } from "zod";

/**
 * Canonical content schemas. Used by the build-time loader, the validation
 * script, the owner studio (before every commit) and the sync pipeline, so a
 * file that passes in one place passes everywhere.
 */

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, numbers and hyphens").max(80);
export const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "letters, numbers and . _ : -").max(120);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
export const dateTimeSchema = z.string().datetime({ offset: true });
/** A day or an exact instant: project event dates may only be known to the day. */
export const eventDateSchema = z.union([dateSchema, dateTimeSchema]);
export const httpsUrlSchema = z.string().url().max(500).refine((u) => u.startsWith("https://"), "must be an https:// URL");

/** draft: never public. proposed: shown only on non-production previews, awaiting owner approval. */
export const statusSchema = z.enum(["draft", "proposed", "published", "archived"]);
/** public: listed. unlisted: page exists, noindex, absent from lists/feeds/sitemap. private: never generated. */
export const visibilitySchema = z.enum(["public", "unlisted", "private"]);

export const provenanceSchema = z.object({
  origin: z.enum(["manual", "agent", "sync"]),
  sourceId: idSchema.optional(),
  eventId: idSchema.optional(),
  /** When the machine imported it. Not the event date, not the editorial date. */
  importedAt: dateTimeSchema.optional(),
  /** Set when the owner edits or approves; machines must never overwrite such entries. */
  editedByOwner: z.boolean().optional(),
  reviewedAt: dateTimeSchema.optional(),
});
export type Provenance = z.infer<typeof provenanceSchema>;

export const evidenceSchema = z.object({
  label: z.string().min(1).max(120),
  url: httpsUrlSchema,
  kind: z.enum(["demo", "source", "release", "pull-request", "article", "screenshot", "other"]).default("other"),
  verifiedAt: dateSchema.optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const projectStateSchema = z.enum([
  "prototype", "pilot", "playable-slice", "simulation", "in-use", "maintained", "archived",
]);
export type ProjectState = z.infer<typeof projectStateSchema>;

export const themeSchema = z.enum(["practical", "creative-tools", "games", "curiosity", "retail"]);
export type Theme = z.infer<typeof themeSchema>;

export const projectSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1).max(80),
  tagline: z.string().min(1).max(200),
  status: statusSchema,
  visibility: visibilitySchema,
  tier: z.enum(["featured", "archive"]),
  order: z.number().int().min(0).default(100),
  themes: z.array(themeSchema).min(1),
  state: projectStateSchema,
  /** Plain-language note that qualifies the state label. */
  stateNote: z.string().max(240).optional(),
  problem: z.string().min(1).max(900),
  audience: z.string().min(1).max(400),
  contribution: z.string().min(1).max(600),
  worksToday: z.array(z.string().min(1).max(300)).max(8),
  limitations: z.array(z.string().min(1).max(300)).max(8),
  links: z.object({
    demo: httpsUrlSchema.optional(),
    repo: httpsUrlSchema.optional(),
    other: z.array(z.object({ label: z.string().max(80), url: httpsUrlSchema })).max(4).default([]),
  }).default({ other: [] }),
  /** Public repo only. A private repo may back a project only through an approved public summary. */
  repoVisibility: z.enum(["public", "private", "none"]),
  upstream: z.object({ name: z.string(), url: httpsUrlSchema, license: z.string().optional(), note: z.string().max(300) }).optional(),
  /** 'yes' only where there is evidence (e.g. commit trailers); 'unknown' renders nothing. */
  ai: z.object({ assisted: z.enum(["yes", "no", "unknown"]), note: z.string().max(300).optional() }),
  /** Required when the code lives in a private repo: the owner approved this page text as a public summary. */
  privateSummaryApproved: z.boolean().default(false),
  media: z.array(z.object({
    src: z.string().regex(/^\/[A-Za-z0-9/_.-]+$/, "must be a /public path"),
    alt: z.string().min(1).max(300),
    caption: z.string().max(300).optional(),
    capturedAt: dateSchema.optional(),
  })).max(6).default([]),
  /** A short muted loop recorded from the live site. Plays on hover or when in view; never under reduced motion. */
  preview: z.object({
    webm: z.string().regex(/^\/[A-Za-z0-9/_.-]+\.webm$/, "must be a /public .webm path"),
    mp4: z.string().regex(/^\/[A-Za-z0-9/_.-]+\.mp4$/, "must be a /public .mp4 path"),
    poster: z.string().regex(/^\/[A-Za-z0-9/_.-]+$/, "must be a /public path"),
    capturedAt: dateSchema.optional(),
  }).optional(),
  dates: z.object({
    started: dateSchema.optional(),
    /** Last meaningful change, taken from the repository or stated by the owner. Never "now". */
    lastChange: dateSchema.optional(),
    lastChangeSource: z.string().max(120).optional(),
    reviewed: dateSchema,
  }),
  evidence: z.array(evidenceSchema).max(10).default([]),
  involve: z.object({
    headline: z.string().min(1).max(160),
    asks: z.array(z.string().min(1).max(240)).min(1).max(5),
    intent: z.enum(["hello", "collaborate", "paid-work", "coaching"]).default("hello"),
  }),
  /** Repositories feeding the sync allowlist for this project (see content/sources.json). */
  sourceId: idSchema.optional(),
  /** Slugs this project used to live at, for redirects. */
  formerSlugs: z.array(slugSchema).default([]),
}).superRefine((p, ctx) => {
  if (p.repoVisibility === "private" && p.links.repo) {
    ctx.addIssue({ code: "custom", path: ["links", "repo"], message: "a private repository must not be linked publicly" });
  }
  if (p.repoVisibility === "none" && p.links.repo) {
    ctx.addIssue({ code: "custom", path: ["links", "repo"], message: "repoVisibility is 'none' but a repo link is set" });
  }
  if (p.links.repo && p.repoVisibility !== "public") {
    ctx.addIssue({ code: "custom", path: ["repoVisibility"], message: "a linked repo must be public" });
  }
  if (p.repoVisibility === "private" && p.status !== "draft" && !p.privateSummaryApproved) {
    ctx.addIssue({ code: "custom", path: ["privateSummaryApproved"], message: "private-repo projects need an owner-approved public summary" });
  }
  if (p.status === "published" && p.evidence.length === 0) {
    ctx.addIssue({ code: "custom", path: ["evidence"], message: "published projects need at least one evidence link" });
  }
});
export type Project = z.infer<typeof projectSchema>;

export const updateKindSchema = z.enum(["progress", "demo", "lesson", "release", "call-for-help", "note"]);
export type UpdateKind = z.infer<typeof updateKindSchema>;

/** Generated prose carries this marker until a person rewrites it; the schema refuses to publish it. */
export const NEEDS_REVIEW = "[Needs review]";

export const updateSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  /** Why a visitor should care, in one or two sentences. */
  whyCare: z.string().max(400).optional(),
  /** Honest limits: what is not finished or not verified. */
  limitations: z.string().max(400).optional(),
  body: z.string().max(4000).optional(),
  kind: updateKindSchema,
  projectId: idSchema.optional(),
  status: statusSchema,
  visibility: visibilitySchema,
  /** When the underlying event happened. */
  eventAt: eventDateSchema,
  /** Editorial date: when the owner (or the publication rule) made it public. */
  publishedAt: dateTimeSchema.optional(),
  tags: z.array(slugSchema).max(8).default([]),
  evidence: z.array(evidenceSchema).max(5).default([]),
  provenance: provenanceSchema,
}).superRefine((u, ctx) => {
  if (u.status === "published" && !u.publishedAt) ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "published updates need publishedAt" });
  if (u.status === "published" && [u.title, u.summary, u.whyCare, u.limitations, u.body].some((t) => t?.includes(NEEDS_REVIEW))) {
    ctx.addIssue({ code: "custom", path: ["summary"], message: `remove the ${NEEDS_REVIEW} marker before publishing` });
  }
});
export type Update = z.infer<typeof updateSchema>;

export const postFrontmatterSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(300),
  status: statusSchema,
  visibility: visibilitySchema,
  kind: z.enum(["essay", "tutorial", "reflection"]),
  publishedAt: dateTimeSchema.optional(),
  updatedAt: dateTimeSchema.optional(),
  tags: z.array(slugSchema).max(8).default([]),
  projectIds: z.array(idSchema).default([]),
  provenance: provenanceSchema.default({ origin: "manual" }),
}).superRefine((p, ctx) => {
  if (p.status === "published" && !p.publishedAt) ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "published posts need publishedAt" });
});
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
export type Post = PostFrontmatter & { body: string; readingMinutes: number };

export const nowSchema = z.object({
  id: z.literal("now"),
  status: statusSchema,
  visibility: visibilitySchema,
  /** The short editable statement shown on the home page. */
  focus: z.string().min(1).max(400),
  building: z.array(z.object({ text: z.string().max(240), projectId: idSchema.optional() })).max(6),
  exploring: z.array(z.string().max(240)).max(6),
  welcome: z.array(z.object({ text: z.string().max(240), intent: z.enum(["hello", "collaborate", "paid-work", "coaching"]) })).max(6),
  /** Date the owner actually reviewed this page. Git activity never changes it. */
  reviewedAt: dateSchema,
  reviewedBy: z.enum(["owner", "pending"]),
});
export type Now = z.infer<typeof nowSchema>;

/** The agent handoff contract. Same shape in a source repo (.website/updates/) and in content/candidates/. */
export const candidateSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: idSchema,
  eventId: idSchema,
  eventAt: dateTimeSchema,
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(400),
  changed: z.string().min(1).max(400),
  whyCare: z.string().min(1).max(300),
  status: z.enum(["shipped", "in-progress", "prototype", "experiment", "paused"]),
  limitations: z.string().max(300).optional(),
  evidenceUrl: httpsUrlSchema.optional(),
  /** 'publish' is a request, honoured only under the publication rule in lib/sync/rule.ts. */
  state: z.enum(["draft", "publish"]),
  /** The author asserts nothing private (names, files, logs, customers, conversations) is in the text. */
  publicSafe: z.boolean(),
  completion: z.object({
    kind: z.enum(["release", "merged-pull-request", "deployment", "none"]),
    verified: z.boolean().default(false),
  }).default({ kind: "none", verified: false }),
  provenance: z.object({
    origin: z.enum(["agent", "sync"]),
    agent: z.string().max(80).optional(),
    importedAt: dateTimeSchema.optional(),
    contentHash: z.string().max(64).optional(),
  }).default({ origin: "agent" }),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const sourceSchema = z.object({
  id: idSchema,
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  projectId: idSchema,
  visibility: z.enum(["public", "private"]),
  /** Several repositories have a non-main default branch; this is configuration, not assumed. */
  branch: z.string().min(1).max(100),
  enabled: z.boolean(),
  include: z.object({
    releases: z.boolean().default(false),
    mergedPullRequests: z.boolean().default(false),
    websiteUpdateFiles: z.boolean().default(true),
    commitDigest: z.boolean().default(false),
  }),
  /** Opt-in. Only release notes carrying the public-safe marker may skip review. */
  autoPublish: z.boolean().default(false),
  batchWindowHours: z.number().int().min(24).max(24 * 31).default(168),
  /** Required before any prose derived from a private source is shown. Written by the owner. */
  approvedPublicSummary: z.string().max(400).optional(),
}).superRefine((s, ctx) => {
  if (s.visibility === "private") {
    if (s.include.releases || s.include.mergedPullRequests || s.include.commitDigest) {
      ctx.addIssue({ code: "custom", path: ["include"], message: "private sources may only import explicit website-update files" });
    }
    if (s.autoPublish) ctx.addIssue({ code: "custom", path: ["autoPublish"], message: "private sources can never auto-publish" });
    if (s.enabled && !s.approvedPublicSummary) ctx.addIssue({ code: "custom", path: ["approvedPublicSummary"], message: "enabled private sources need an owner-approved public summary" });
  }
});
export type Source = z.infer<typeof sourceSchema>;

export const sourcesFileSchema = z.object({
  version: z.literal(1),
  /** Anything not listed here is excluded by default. */
  sources: z.array(sourceSchema),
});

export const syncStatusSchema = z.object({
  lastAttemptAt: dateTimeSchema.nullable(),
  lastSuccessAt: dateTimeSchema.nullable(),
  sources: z.record(z.string(), z.object({
    lastAttemptAt: dateTimeSchema,
    lastSuccessAt: dateTimeSchema.nullable(),
    lastError: z.string().max(500).nullable(),
    imported: z.number().int().min(0),
    unchanged: z.number().int().min(0),
  })),
});
export type SyncStatus = z.infer<typeof syncStatusSchema>;
