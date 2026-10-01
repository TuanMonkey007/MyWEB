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

// Route đón các request tự động của trình duyệt tới /favicon.ico
export async function GET() {
  const { faviconPath } = await getSettings().catch(() => ({ faviconPath: null }));

  if (faviconPath) {
    const safe = path.basename(faviconPath);
    const ext = path.extname(safe).toLowerCase();
    const mime = MIME[ext] || "image/x-icon";

    // 1. Đọc từ thư mục uploads/branding trên đĩa (khi chạy VPS / Localhost)
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
        // bỏ qua nếu lỗi DB
      }
    }
  }

  // 3. Fallback: Icon cam tối giản của MyWEB nếu chưa cài đặt favicon
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="#F25C2B"/>
    <text x="16" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">M</text>
  </svg>`;

  return new NextResponse(fallbackSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
