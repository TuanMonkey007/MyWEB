import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { deleteAttachmentFile } from "@/lib/files";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetYear.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy năm ngân sách", 404);

  const body = await req.json();
  const year = Math.round(Number(body.year));
  if (!Number.isFinite(year) || year < 2000 || year > 2100)
    return jsonError("Năm không hợp lệ");
  const dup = await prisma.budgetYear.findUnique({ where: { year } });
  if (dup && dup.id !== id) return jsonError(`Năm ${year} đã tồn tại`, 409);

  const updated = await prisma.budgetYear.update({
    where: { id },
    data: {
      year,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(updated);
}

// Xóa cả năm: dọn file đính kèm của mọi phiếu/hạng mục thuộc năm trước khi cascade
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetYear.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy năm ngân sách", 404);

  const attachments = await prisma.attachment.findMany({
    where: {
      OR: [
        { proposal: { budgetYearId: id } },
        { item: { proposal: { budgetYearId: id } } },
      ],
    },
  });
  await prisma.budgetYear.delete({ where: { id } });
  for (const a of attachments) await deleteAttachmentFile(a.filePath);
  return NextResponse.json({ ok: true });
}
