import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import {
  contentPath,
  isInlineType,
  readContent,
  releaseContent,
} from "@/lib/drive";

type Params = { params: Promise<{ id: string }> };

// Tải/xem file — hỗ trợ Range (206) để tua video/audio, xem PDF, resume tải
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) return jsonError("Không tìm thấy file", 404);

  const download = new URL(req.url).searchParams.get("download") === "1";
  const disposition = download || !isInlineType(file.mimeType) ? "attachment" : "inline";
  const cd = `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`;

  let total: number;
  try {
    total = (await stat(contentPath(file.sha256))).size;
  } catch {
    return jsonError("File không còn trên ổ đĩa", 404);
  }

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? parseInt(m[2], 10) : total - 1;
      if (start > end || end >= total) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const body = await readContent(file.sha256, { start, end });
      return new NextResponse(body as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Type": file.mimeType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Disposition": cd,
        },
      });
    }
  }

  const body = await readContent(file.sha256);
  return new NextResponse(body as unknown as BodyInit, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Content-Disposition": cd,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.storedFile.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy file", 404);

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return jsonError("Tên file là bắt buộc");
    if (/[\\/]/.test(name)) return jsonError("Tên không được chứa / hoặc \\");
    data.name = name;
  }
  if (body.folderId !== undefined) {
    const folderId = body.folderId || null;
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) return jsonError("Thư mục đích không tồn tại");
    }
    data.folderId = folderId;
  }
  await prisma.storedFile.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.storedFile.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy file", 404);

  await prisma.storedFile.delete({ where: { id } });
  await releaseContent(existing.sha256); // xóa file vật lý nếu không còn ai trỏ tới
  return NextResponse.json({ ok: true });
}
