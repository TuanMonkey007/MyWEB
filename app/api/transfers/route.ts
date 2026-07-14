import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTransferBody } from "@/lib/api";

// FR-4 + BR-6. Transfer không phải thu/chi thật (BR-5) — tách bảng riêng,
// không tính vào báo cáo thu/chi và không đổi tổng tài sản.
export async function POST(req: Request) {
  const parsed = parseTransferBody(await req.json());
  if ("error" in parsed) return jsonError(parsed.error);

  const [from, to] = await Promise.all([
    prisma.wallet.findUnique({ where: { id: parsed.fromWalletId } }),
    prisma.wallet.findUnique({ where: { id: parsed.toWalletId } }),
  ]);
  if (!from || !to) return jsonError("Ví không tồn tại");

  const transfer = await prisma.transfer.create({
    data: parsed,
    include: { fromWallet: true, toWallet: true },
  });
  return NextResponse.json(transfer, { status: 201 });
}
