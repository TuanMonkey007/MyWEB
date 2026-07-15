import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { MAX_FILE_SIZE, releaseContent, storeStream } from "@/lib/drive";

// Upload streaming: client gửi raw body (chính là File), metadata ở query.
// Băm SHA-256 khi ghi để chống trùng lặp (dedup) — không nạp cả file vào RAM.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").trim();
  if (!name) return jsonError("Thiếu tên file");
  const folderId = url.searchParams.get("folderId") || null;
  const mimeType = req.headers.get("content-type") || "application/octet-stream";

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_SIZE)
    return jsonError("File vượt giới hạn 2GB", 413);

  if (folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return jsonError("Thư mục không tồn tại");
  }
  if (!req.body) return jsonError("Không có dữ liệu file");

  let saved;
  try {
    saved = await storeStream(req.body);
  } catch {
    return jsonError("Lỗi khi ghi file lên đĩa", 500);
  }
  if (saved.size > MAX_FILE_SIZE) {
    await releaseContent(saved.sha256);
    return jsonError("File vượt giới hạn 2GB", 413);
  }
  if (saved.size === 0) {
    await releaseContent(saved.sha256);
    return jsonError("File rỗng", 400);
  }

  const file = await prisma.storedFile.create({
    data: {
      name,
      folderId,
      size: saved.size,
      mimeType,
      sha256: saved.sha256,
    },
  });
  return NextResponse.json(file, { status: 201 });
}
