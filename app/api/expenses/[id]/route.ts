import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransactionBody } from "@/lib/api";
import { deleteReceiptImage } from "@/lib/upload";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy khoản chi", 404);

  const parsed = parseTransactionBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const category = await prisma.category.findUnique({
    where: { id: parsed.categoryId },
  });
  if (!category || category.kind !== "EXPENSE")
    return jsonError("Danh mục chi không hợp lệ");

  const expense = await prisma.expense.update({
    where: { id },
    data: parsed,
    include: { category: true, wallet: true },
  });

  // ảnh cũ bị thay/gỡ thì xóa file
  if (existing.imagePath && existing.imagePath !== parsed.imagePath)
    await deleteReceiptImage(existing.imagePath);

  return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy khoản chi", 404);

  await prisma.expense.delete({ where: { id } });
  await deleteReceiptImage(existing.imagePath);
  return NextResponse.json({ ok: true });
}
