import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseItemBody } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const proposal = await prisma.proposal.findUnique({
    where: { id: String(body.proposalId ?? "") },
  });
  if (!proposal) return jsonError("Đợt đề xuất không tồn tại");

  const parsed = parseItemBody(body);
  if ("error" in parsed) return jsonError(parsed.error);

  const fund = await prisma.budgetFund.findUnique({ where: { id: parsed.fundId } });
  if (!fund) return jsonError("Quỹ không tồn tại");

  const item = await prisma.proposalItem.create({
    data: { ...parsed, proposalId: proposal.id },
    include: { fund: true, attachments: true },
  });
  return NextResponse.json(item, { status: 201 });
}
