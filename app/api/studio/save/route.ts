import { studioRoute } from "@/lib/studio/api";
import { ITEM_TYPES, saveItem, setStatus, type ItemType } from "@/lib/studio/service";
import { StoreError } from "@/lib/studio/store";

/** Body: { type, doc, expectedSha? } saves; { type, id, to: "published"|"draft" } publishes or unpublishes. */
export const POST = studioRoute(async ({ store, body }) => {
  if (!ITEM_TYPES.includes(body.type)) throw new StoreError("unknown type");
  const type = body.type as ItemType;
  if (body.to) {
    if (body.to !== "published" && body.to !== "draft") throw new StoreError("invalid state");
    return setStatus(store, type, String(body.id), body.to);
  }
  return saveItem(store, { type, doc: body.doc, expectedSha: typeof body.expectedSha === "string" ? body.expectedSha : undefined });
});
