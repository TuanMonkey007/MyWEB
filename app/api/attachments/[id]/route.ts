import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { deleteAttachmentFile, resolveAttachmentFile } from "@/lib/files";

type Params = { params: Promise<{ id: string }> };

const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]);

// Tải/xem file bằng chứng — PDF và ảnh mở inline, còn lại tải về với tên gốc
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return jsonError("Không tìm thấy file", 404);

  const filePath = resolveAttachmentFile(attachment.filePath);
  if (!filePath) return jsonError("Đường dẫn file không hợp lệ", 404);

  try {
    const data = await readFile(filePath);
    const disposition = INLINE_TYPES.has(attachment.mimeType) ? "inline" : "attachment";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return jsonError("File không còn trên ổ đĩa", 404);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return jsonError("Không tìm thấy file", 404);

  await prisma.attachment.delete({ where: { id } });
  await deleteAttachmentFile(attachment.filePath);
  return NextResponse.json({ ok: true });
}
