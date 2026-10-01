import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { brandingDir, getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const { faviconPath } = await getSettings().catch(() => ({ faviconPath: null }));
  if (!faviconPath) return new NextResponse("Not found", { status: 404 });

  const safe = path.basename(faviconPath);
  const ext = path.extname(safe).toLowerCase();
  const mime = MIME[ext] ?? "image/x-icon";

  // 1. Thử đọc từ thư mục uploads/branding trên đĩa
  try {
    const data = await readFile(path.join(brandingDir(), safe));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    // 2. Dự phòng: Đọc trực tiếp từ DB (base64) khi chạy trên Vercel / serverless không giữ file đĩa
    try {
      const [dataRow, mimeRow] = await Promise.all([
        prisma.appSetting.findUnique({ where: { key: "faviconData" } }),
        prisma.appSetting.findUnique({ where: { key: "faviconMime" } }),
      ]);
      if (dataRow?.value) {
        const buf = Buffer.from(dataRow.value, "base64");
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": mimeRow?.value || mime,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch {
      // bỏ qua
    }
    return new NextResponse("Not found", { status: 404 });
  }
}
