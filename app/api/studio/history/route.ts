import { studioRoute } from "@/lib/studio/api";
import { historyOf } from "@/lib/studio/service";

export const POST = studioRoute(async ({ store, body }) => ({ history: await historyOf(store, String(body.path)) }), { mutating: false });
