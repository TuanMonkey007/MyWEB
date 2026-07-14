import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransactionBody } from "@/lib/api";

// FR-2: ghi khoản chi. BR-4: không chặn khi ví âm.
export async function POST(req: Request) {
  const parsed = parseTransactionBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const [category, wallet] = await Promise.all([
    prisma.category.findUnique({ where: { id: parsed.categoryId } }),
    prisma.wallet.findUnique({ where: { id: parsed.walletId } }),
  ]);
  if (!category || category.kind !== "EXPENSE")
    return jsonError("Danh mục chi không hợp lệ");
  if (!wallet) return jsonError("Ví không tồn tại");

  const expense = await prisma.expense.create({
    data: parsed,
    include: { category: true, wallet: true },
  });
  return NextResponse.json(expense, { status: 201 });
}
