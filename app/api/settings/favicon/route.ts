import { NextResponse } from "next/server";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { jsonError } from "@/lib/api";
import { brandingDir, getSettings, setSetting } from "@/lib/settings";

const ALLOWED = new Set([".ico", ".png", ".svg", ".jpg", ".jpeg", ".webp"]);

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
  // dọn favicon cũ (có thể khác đuôi)
  for (const f of await readdir(dir).catch(() => [])) {
    if (f.startsWith("favicon.")) await unlink(path.join(dir, f)).catch(() => {});
  }

  const fileName = `favicon${ext}`;
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
  await setSetting("faviconPath", fileName);
  return NextResponse.json({ ok: true, faviconPath: fileName }, { status: 201 });
}

export async function DELETE() {
  const { faviconPath } = await getSettings();
  if (faviconPath)
    await unlink(path.join(brandingDir(), path.basename(faviconPath))).catch(() => {});
  await setSetting("faviconPath", null);
  return NextResponse.json({ ok: true });
}
