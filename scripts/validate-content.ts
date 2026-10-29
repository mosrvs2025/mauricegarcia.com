import { ContentError, validateAll } from "../lib/content/load";

try {
  const problems = validateAll();
  if (problems.length) {
    console.error("Content validation failed:\n" + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("Content validation passed.");
} catch (e) {
  if (e instanceof ContentError) { console.error(e.message); process.exit(1); }
  throw e;
}
