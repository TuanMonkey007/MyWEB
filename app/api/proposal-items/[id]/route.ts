import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseItemBody } from "@/lib/api";
import { deleteAttachmentFile } from "@/lib/files";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.proposalItem.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy hạng mục", 404);

  const parsed = parseItemBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const fund = await prisma.budgetFund.findUnique({ where: { id: parsed.fundId } });
  if (!fund) return jsonError("Quỹ không tồn tại");

  const item = await prisma.proposalItem.update({
    where: { id },
    data: parsed,
    include: { fund: true, attachments: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.proposalItem.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!existing) return jsonError("Không tìm thấy hạng mục", 404);

  await prisma.proposalItem.delete({ where: { id } });
  for (const a of existing.attachments) await deleteAttachmentFile(a.filePath);
  return NextResponse.json({ ok: true });
}
