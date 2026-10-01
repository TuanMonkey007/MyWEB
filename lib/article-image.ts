// Ảnh bìa bài viết — lưu trong UPLOAD_DIR/articles hoặc public/articles.
//
// Khác ảnh hóa đơn (lib/upload.ts): ảnh bìa hiển thị to ở trang chủ kiểu báo
// nên giữ độ phân giải cao hơn và trần dung lượng rộng hơn.
import { mkdir, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const MAX_WIDTH = 1600;
const TARGET_BYTES = 500 * 1024;

export function articleImageDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "articles");
}

/** Chỉ nhận tên file an toàn — chặn ../ và đường dẫn lạ. Kiểm tra cả uploads/ và public/articles/ */
export function articleImagePath(name: string): string | null {
  const safe = path.basename(name);
  if (safe !== name || !/^[\w.-]+\.(jpg|jpeg|webp|png)$/i.test(safe)) return null;

  // 1. Kiểm tra uploads/articles
  const p1 = path.join(articleImageDir(), safe);
  if (existsSync(p1)) return p1;

  // 2. Kiểm tra public/articles
  const p2 = path.resolve(process.cwd(), "public", "articles", safe);
  if (existsSync(p2)) return p2;

  return p1;
}

export async function saveArticleImage(input: Buffer): Promise<string> {
  const dir = articleImageDir();
  await mkdir(dir, { recursive: true });

  const nen = (quality: number) =>
    sharp(input)
      .rotate() // xoay theo EXIF, tránh ảnh điện thoại bị nằm ngang
      .resize(MAX_WIDTH, null, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

  let quality = 82;
  let out = await nen(quality);
  while (out.length > TARGET_BYTES && quality > 45) {
    quality -= 8;
    out = await nen(quality);
  }

  const fileName = `${randomUUID()}.jpg`;
  await writeFile(path.join(dir, fileName), out);
  return fileName;
}

export async function deleteArticleImage(name: string | null) {
  if (!name) return;
  const p = articleImagePath(name);
  if (p) await unlink(p).catch(() => {});
}
