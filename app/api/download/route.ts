import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { verifyDownload } from "@/lib/download-token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const product = verifyDownload(token);
  if (!product) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }
  const filePath = path.join(process.cwd(), "public", "products", product.file);
  try {
    const buf = await readFile(filePath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${product.file}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
