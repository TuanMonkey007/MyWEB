import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransactionBody } from "@/lib/api";
import { deleteReceiptImage } from "@/lib/upload";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy khoản thu", 404);

  const parsed = parseTransactionBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const category = await prisma.category.findUnique({
    where: { id: parsed.categoryId },
  });
  if (!category || category.kind !== "INCOME")
    return jsonError("Danh mục thu không hợp lệ");

  const income = await prisma.income.update({
    where: { id },
    data: parsed,
    include: { category: true, wallet: true },
  });

  if (existing.imagePath && existing.imagePath !== parsed.imagePath)
    await deleteReceiptImage(existing.imagePath);

  return NextResponse.json(income);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy khoản thu", 404);

  await prisma.income.delete({ where: { id } });
  await deleteReceiptImage(existing.imagePath);
  return NextResponse.json({ ok: true });
}
