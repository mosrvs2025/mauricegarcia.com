import { CONTENT_DIR, loadProjects, loadSources } from "../lib/content/load";
import { runSync } from "../lib/sync/import";

/**
 * Scheduled / manual sync. Read-only against GitHub; writes only under content/.
 * Exit code 1 when any source failed, after saving what succeeded, so the Actions run turns red.
 */
async function main() {
  const summary = await runSync({
    contentDir: CONTENT_DIR, sources: loadSources(), projects: loadProjects(),
    token: process.env.SYNC_READ_TOKEN || process.env.GITHUB_TOKEN, log: (m) => console.log(m),
  });
  console.log(JSON.stringify({ promoted: summary.promoted, statusWritten: summary.statusWritten, sources: summary.results.map((r) => ({ id: r.sourceId, ok: r.ok, imported: r.imported, unchanged: r.unchanged, rejected: r.rejected.length, error: r.error })) }, null, 2));
  for (const r of summary.results) for (const why of r.rejected) console.log(`::warning::${r.sourceId}: ${why}`);
  const failed = summary.results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} source(s) failed. The published site is unchanged and keeps its last good content.\nRetry: re-run the "Sync project updates" workflow. If the error mentions a token, renew SYNC_READ_TOKEN.`);
    process.exit(1);
  }
}
main().catch((e) => { console.error(String(e?.message || e).replace(/(ghp|github_pat|ghs)_[A-Za-z0-9_]+/g, "[redacted]")); process.exit(1); });
