import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransferBody } from "@/lib/api";
import { deleteReceiptImage } from "@/lib/upload";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.transfer.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy chuyển khoản", 404);

  const parsed = parseTransferBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const transfer = await prisma.transfer.update({
    where: { id },
    data: parsed,
    include: { fromWallet: true, toWallet: true },
  });

  if (existing.imagePath && existing.imagePath !== parsed.imagePath)
    await deleteReceiptImage(existing.imagePath);

  return NextResponse.json(transfer);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.transfer.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy chuyển khoản", 404);

  await prisma.transfer.delete({ where: { id } });
  await deleteReceiptImage(existing.imagePath);
  return NextResponse.json({ ok: true });
}
