// File bằng chứng module mua hàng: PDF/ảnh/Office, lưu UPLOAD_DIR/files/{uuid}.{ext}
// Ảnh vẫn nén qua sharp như hóa đơn; file khác lưu nguyên bản.
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "png", "jpg", "jpeg", "webp", "gif",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "zip",
]);
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

function filesDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "files");
}

export type SavedFile = {
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
};

export async function saveAttachmentFile(file: File): Promise<SavedFile | { error: string }> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext))
    return { error: `Không hỗ trợ định dạng .${ext}` };
  if (file.size > MAX_FILE_SIZE) return { error: "File tối đa 25MB" };

  const dir = filesDir();
  await mkdir(dir, { recursive: true });

  let buffer = Buffer.from(await file.arrayBuffer());
  let outExt = ext;
  let mimeType = file.type || "application/octet-stream";

  if (IMAGE_EXTENSIONS.has(ext) && ext !== "gif") {
    // nén ảnh như hóa đơn: ≤1200px, JPEG
    buffer = await sharp(buffer)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    outExt = "jpg";
    mimeType = "image/jpeg";
  }

  const filePath = `${randomUUID()}.${outExt}`;
  await writeFile(path.join(dir, filePath), buffer);
  return { fileName: file.name, filePath, mimeType, size: buffer.length };
}

export async function deleteAttachmentFile(filePath: string | null | undefined) {
  if (!filePath) return;
  const safe = path.basename(filePath);
  try {
    await unlink(path.join(filesDir(), safe));
  } catch {
    // file đã mất — bỏ qua
  }
}

export function resolveAttachmentFile(filePath: string): string | null {
  const safe = path.basename(filePath);
  if (safe !== filePath || !/^[\w-]+\.\w+$/.test(safe)) return null;
  return path.join(filesDir(), safe);
}
