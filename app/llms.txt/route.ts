import { llmsResponse, llmsTxt } from "@/lib/llms";

export const dynamic = "force-static";

export const GET = () => llmsResponse(llmsTxt());
