import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { WALLET_TYPES } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.wallet.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy ví", 404);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên ví là bắt buộc");
  if (!WALLET_TYPES.includes(body.type)) return jsonError("Loại ví không hợp lệ");

  const isInvest = body.type === "INVEST";
  const balanceUSD = Number(body.balanceUSD);
  const exchangeRate = Number(body.exchangeRate);
  if (isInvest && (!Number.isFinite(balanceUSD) || !Number.isFinite(exchangeRate)))
    return jsonError("Ví INVEST phải nhập số dư USD và tỷ giá");

  const wallet = await prisma.wallet.update({
    where: { id },
    data: {
      name,
      type: body.type,
      initialBalance: Number(body.initialBalance) || 0,
      adjustment: Number(body.adjustment) || 0,
      balanceUSD: isInvest ? balanceUSD : null,
      exchangeRate: isInvest ? exchangeRate : null,
      notes: typeof body.notes === "string" && body.notes ? body.notes : null,
      url: typeof body.url === "string" && body.url ? body.url : null,
    },
  });
  return NextResponse.json(wallet);
}

// FR-1: xóa ví — cảnh báo (không chặn) khi còn giao dịch, xử lý ở UI;
// giao dịch liên quan bị xóa theo (onDelete: Cascade)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.wallet.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy ví", 404);

  await prisma.wallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
