import fs from "node:fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { candidateSchema } from "../lib/content/schemas";

/** The agent handoff contract as JSON Schema, generated from the same zod schema the sync validates against. */
const schema = zodToJsonSchema(candidateSchema, { name: "WebsiteUpdate", $refStrategy: "none" });
fs.writeFileSync("docs/website-update.schema.json", JSON.stringify(schema, null, 2) + "\n");
console.log("wrote docs/website-update.schema.json");
