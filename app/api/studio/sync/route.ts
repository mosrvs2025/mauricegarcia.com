import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/studio/auth";
import { requireOwner } from "@/lib/studio/session";

/** "Sync now": asks GitHub to run the sync workflow. The token stays on the server and needs Actions: write. */
export async function POST(req: Request) {
  const who = await requireOwner();
  if (!who.ok) return NextResponse.json({ error: who.reason }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const token = process.env.STUDIO_GITHUB_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "STUDIO_GITHUB_TOKEN is not set, so the sync can't be started from here. Run the “Sync project updates” workflow from the GitHub Actions tab instead." }, { status: 503 });
  const repo = process.env.STUDIO_GITHUB_REPO || "mosrvs2025/mauricegarcia.com";
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/sync.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "mauricegarcia-studio", "Content-Type": "application/json" },
    body: JSON.stringify({ ref: process.env.STUDIO_GITHUB_BRANCH || "main" }),
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 204) return NextResponse.json({ ok: true, message: "Sync requested. It usually finishes within a minute or two." });
  if (res.status === 403 || res.status === 404) return NextResponse.json({ error: "GitHub refused. The studio token needs Actions: write on this repository, and the workflow must exist on the main branch." }, { status: 502 });
  return NextResponse.json({ error: `GitHub returned HTTP ${res.status}.` }, { status: 502 });
}
