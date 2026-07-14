import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWalletsWithBalances } from "@/lib/balance";
import { jsonError } from "@/lib/api";
import { WALLET_TYPES } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getWalletsWithBalances());
}

export async function POST(req: Request) {
  const body = await req.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên ví là bắt buộc");
  if (!WALLET_TYPES.includes(body.type)) return jsonError("Loại ví không hợp lệ");

  const isInvest = body.type === "INVEST";
  const balanceUSD = Number(body.balanceUSD);
  const exchangeRate = Number(body.exchangeRate);
  if (isInvest && (!Number.isFinite(balanceUSD) || !Number.isFinite(exchangeRate)))
    return jsonError("Ví INVEST phải nhập số dư USD và tỷ giá");

  const wallet = await prisma.wallet.create({
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
  return NextResponse.json(wallet, { status: 201 });
}
