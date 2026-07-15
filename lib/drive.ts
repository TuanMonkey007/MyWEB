// Lưu trữ file tối ưu cho module Drive:
// - Content-addressed: file vật lý đặt tên theo SHA-256 nội dung
//   → 2 file trùng nội dung dùng chung 1 file trên đĩa (dedup)
// - Streaming: ghi/đọc theo luồng, không nạp cả file vào RAM
// - Thư mục băm 2 ký tự đầu của hash để tránh dồn quá nhiều file 1 chỗ
import { createHash } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, rename, stat, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { prisma } from "./prisma";

export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB/file

function driveDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "drive");
}

// Đường dẫn vật lý của một nội dung theo sha256 (băm thư mục)
export function contentPath(sha256: string): string {
  return path.join(driveDir(), sha256.slice(0, 2), sha256);
}

export type SavedContent = { sha256: string; size: number };

// Ghi luồng dữ liệu ra file tạm, vừa ghi vừa băm SHA-256, rồi:
// - nếu nội dung đã tồn tại (trùng) → xóa file tạm (dedup, không tốn thêm đĩa)
// - nếu chưa → chuyển file tạm vào vị trí content-addressed
export async function storeStream(
  webStream: ReadableStream<Uint8Array>
): Promise<SavedContent> {
  const dir = driveDir();
  await mkdir(dir, { recursive: true });

  const tmp = path.join(dir, `.tmp-${crypto.randomUUID()}`);
  const hash = createHash("sha256");
  let size = 0;

  const hashing = new Transform({
    transform(chunk, _enc, cb) {
      hash.update(chunk);
      size += chunk.length;
      cb(null, chunk);
    },
  });

  const nodeStream = Readable.fromWeb(webStream as Parameters<typeof Readable.fromWeb>[0]);
  try {
    await pipeline(nodeStream, hashing, createWriteStream(tmp));
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }

  const sha256 = hash.digest("hex");
  const dest = contentPath(sha256);

  const exists = await stat(dest).then(
    () => true,
    () => false
  );
  if (exists) {
    await unlink(tmp).catch(() => {}); // dedup: đã có nội dung này
  } else {
    await mkdir(path.dirname(dest), { recursive: true });
    await rename(tmp, dest);
  }
  return { sha256, size };
}

// Xóa nội dung vật lý CHỈ KHI không còn StoredFile nào trỏ tới (đếm tham chiếu)
export async function releaseContent(sha256: string) {
  const refs = await prisma.storedFile.count({ where: { sha256 } });
  if (refs === 0) await unlink(contentPath(sha256)).catch(() => {});
}

// Đọc file theo luồng cho tải xuống, hỗ trợ Range (tua video/audio, resume)
export async function readContent(sha256: string, range?: { start: number; end: number }) {
  const filePath = contentPath(sha256);
  const stream = createReadStream(filePath, range);
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}

// Mở inline (xem trực tiếp) vs tải về theo loại file
export function isInlineType(mime: string): boolean {
  return (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/pdf" ||
    mime.startsWith("text/")
  );
}

// Thống kê dung lượng: logic (tổng size mọi file) vs vật lý (mỗi sha tính 1 lần)
export async function getStorageStats() {
  const [agg, distinct] = await Promise.all([
    prisma.storedFile.aggregate({ _sum: { size: true }, _count: true }),
    prisma.storedFile.findMany({ distinct: ["sha256"], select: { sha256: true, size: true } }),
  ]);
  const logical = agg._sum.size ?? 0;
  const physical = distinct.reduce((s, f) => s + f.size, 0);
  return {
    fileCount: agg._count,
    logicalSize: logical,
    physicalSize: physical,
    savedByDedup: logical - physical,
  };
}

export { formatBytes } from "./drive-format";
