import { execFileSync } from "node:child_process";
import fs from "node:fs";

/**
 * Fails if a tracked file contains something that looks like a credential, or if a real .env file is tracked.
 * Agents sometimes paste keys into code or docs; this catches it before it reaches a public repository.
 */
export const SECRET_PATTERNS: [string, RegExp][] = [
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/],
  ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ["Stripe secret key", /\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}\b/],
  ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{16,}\b/],
  ["Resend API key", /\bre_[A-Za-z0-9]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9]{32,}\b/],
  ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

export function findSecrets(text: string): string[] {
  return SECRET_PATTERNS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

export function scan(files: string[], read: (f: string) => string | null): string[] {
  const problems: string[] = [];
  for (const f of files) {
    if (/(^|\/)\.env($|\.)/.test(f) && !f.endsWith(".env.example")) problems.push(`${f}: a real .env file is tracked`);
    if (/\.(png|jpe?g|webp|gif|ico|mp4|webm|pdf|woff2?|ttf|lock)$/i.test(f) || f.endsWith("package-lock.json")) continue;
    const text = read(f);
    if (text === null || text.length > 2_000_000) continue;
    for (const name of findSecrets(text)) problems.push(`${f}: looks like a ${name}`);
  }
  return problems;
}

if (process.argv[1]?.endsWith("guard-secrets.ts")) {
  const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const problems = scan(files, (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return null; } });
  if (problems.length) { console.error("Secret guard FAILED:\n" + problems.map((p) => "  - " + p).join("\n") + "\nRemove it, rotate the credential, and never commit .env files."); process.exit(1); }
  console.log(`Secret guard passed: ${files.length} tracked files scanned.`);
}
