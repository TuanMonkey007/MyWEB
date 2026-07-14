// FR-5: ảnh hóa đơn — lưu file ra UPLOAD_DIR, DB chỉ giữ tên file (imagePath)
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

export function getUploadDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

const MAX_DIMENSION = 1200;
const TARGET_BYTES = 400 * 1024; // trần ~400KB theo FR-5

// Resize ≤1200px + nén JPEG, giảm chất lượng dần cho tới khi ≤400KB.
// Trả về tên file (UUID) để lưu vào imagePath.
export async function saveReceiptImage(input: Buffer): Promise<string> {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });

  const compress = (quality: number) =>
    sharp(input)
      .rotate() // theo EXIF orientation
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

  let quality = 80;
  let output = await compress(quality);
  while (output.length > TARGET_BYTES && quality > 40) {
    quality -= 10;
    output = await compress(quality);
  }

  const fileName = `${randomUUID()}.jpg`;
  await writeFile(path.join(dir, fileName), output);
  return fileName;
}

// Xóa file ảnh (bỏ qua nếu không tồn tại). Chỉ nhận tên file, chặn path traversal.
export async function deleteReceiptImage(imagePath: string | null | undefined) {
  if (!imagePath) return;
  const safe = path.basename(imagePath);
  try {
    await unlink(path.join(getUploadDir(), safe));
  } catch {
    // file đã mất — không sao
  }
}

// Đường dẫn tuyệt đối tới file ảnh, null nếu tên không hợp lệ
export function resolveReceiptImage(name: string): string | null {
  const safe = path.basename(name);
  if (safe !== name || !/^[\w-]+\.jpg$/.test(safe)) return null;
  return path.join(getUploadDir(), safe);
}
