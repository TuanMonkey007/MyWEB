import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { deleteAttachmentFile } from "@/lib/files";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.proposal.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy đợt đề xuất", 404);

  const body = await req.json();
  const proposedAt = new Date(String(body.proposedAt ?? ""));
  if (isNaN(proposedAt.getTime())) return jsonError("Ngày không hợp lệ");

  const number = Math.round(Number(body.number));
  if (!Number.isFinite(number) || number <= 0) return jsonError("Số đợt không hợp lệ");
  const dup = await prisma.proposal.findUnique({
    where: {
      budgetYearId_number: { budgetYearId: existing.budgetYearId, number },
    },
  });
  if (dup && dup.id !== id) return jsonError(`Đợt số ${number} đã tồn tại`, 409);

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      number,
      proposedAt,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(proposal);
}

// Xóa đợt: dọn file đính kèm của phiếu và của mọi hạng mục (DB cascade)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.proposal.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy đợt đề xuất", 404);

  const attachments = await prisma.attachment.findMany({
    where: { OR: [{ proposalId: id }, { item: { proposalId: id } }] },
  });
  await prisma.proposal.delete({ where: { id } });
  for (const a of attachments) await deleteAttachmentFile(a.filePath);
  return NextResponse.json({ ok: true });
}
