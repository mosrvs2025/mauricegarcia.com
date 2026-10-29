import { studioRoute } from "@/lib/studio/api";
import { ITEM_TYPES, restoreVersion, type ItemType } from "@/lib/studio/service";
import { StoreError } from "@/lib/studio/store";

export const POST = studioRoute(async ({ store, body }) => {
  if (!ITEM_TYPES.includes(body.type)) throw new StoreError("unknown type");
  return restoreVersion(store, body.type as ItemType, String(body.path), String(body.ref));
});
