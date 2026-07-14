import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransactionBody } from "@/lib/api";

// FR-3: ghi khoản thu
export async function POST(req: Request) {
  const parsed = parseTransactionBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const [category, wallet] = await Promise.all([
    prisma.category.findUnique({ where: { id: parsed.categoryId } }),
    prisma.wallet.findUnique({ where: { id: parsed.walletId } }),
  ]);
  if (!category || category.kind !== "INCOME")
    return jsonError("Danh mục thu không hợp lệ");
  if (!wallet) return jsonError("Ví không tồn tại");

  const income = await prisma.income.create({
    data: parsed,
    include: { category: true, wallet: true },
  });
  return NextResponse.json(income, { status: 201 });
}
