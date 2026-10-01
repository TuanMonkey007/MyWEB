import { NextResponse } from "next/server";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { jsonError } from "@/lib/api";
import { brandingDir, getSettings, setSetting } from "@/lib/settings";

const ALLOWED = new Set([".ico", ".png", ".svg", ".jpg", ".jpeg", ".webp"]);

const MIME: Record<string, string> = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Upload favicon/icon platform
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext))
    return jsonError("Favicon nhận: .ico, .png, .svg, .jpg, .webp");
  if (file.size > 1024 * 1024) return jsonError("Favicon tối đa 1MB");

  const dir = brandingDir();
  await mkdir(dir, { recursive: true });
  // dọn favicon cũ
  for (const f of await readdir(dir).catch(() => [])) {
    if (f.startsWith("favicon-") || f.startsWith("favicon.")) {
      await unlink(path.join(dir, f)).catch(() => {});
    }
  }

  // Đặt tên kèm timestamp để tránh bị trình duyệt cache vĩnh viễn
  const timestamp = Date.now();
  const fileName = `favicon-${timestamp}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  // Lưu cả Base64 vào database để chạy mượt mà ngay cả trên serverless (Vercel)
  const base64 = buffer.toString("base64");
  const mimeType = MIME[ext] || file.type || "image/x-icon";

  await setSetting("faviconPath", fileName);
  await setSetting("faviconData", base64);
  await setSetting("faviconMime", mimeType);

  return NextResponse.json({ ok: true, faviconPath: fileName }, { status: 201 });
}

export async function DELETE() {
  const { faviconPath } = await getSettings();
  if (faviconPath)
    await unlink(path.join(brandingDir(), path.basename(faviconPath))).catch(() => {});

  await setSetting("faviconPath", null);
  await setSetting("faviconData", null);
  await setSetting("faviconMime", null);

  return NextResponse.json({ ok: true });
}
