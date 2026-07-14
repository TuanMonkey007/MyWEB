import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { brandingDir, getSettings } from "@/lib/settings";

const MIME: Record<string, string> = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Phục vụ favicon đã upload — route PUBLIC (cần cho landing/login trước đăng nhập)
export async function GET() {
  const { faviconPath } = await getSettings();
  if (!faviconPath) return new NextResponse("Not found", { status: 404 });

  const safe = path.basename(faviconPath);
  try {
    const data = await readFile(path.join(brandingDir(), safe));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[path.extname(safe)] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
