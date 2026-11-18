import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseItemBody } from "@/lib/api";

// Các hạng mục đã đề xuất trên một hay nhiều quỹ (?fundIds=a,b) — kèm đợt đề xuất,
// dùng cho bảng chi tiết khi bấm vào quỹ ở trang Ngân sách
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("fundIds") ?? "";
  const fundIds = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (fundIds.length === 0) return jsonError("Thiếu fundIds");

  const items = await prisma.proposalItem.findMany({
    where: { fundId: { in: fundIds } },
    orderBy: [{ proposal: { proposedAt: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true,
      status: true,
      proposedAmount: true,
      actualAmount: true,
      notes: true,
      fund: { select: { id: true, name: true } },
      proposal: { select: { id: true, number: true, title: true, proposedAt: true } },
    },
  });
  return NextResponse.json(items);
}

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

  // Hạng mục mới nằm cuối đợt
  const last = await prisma.proposalItem.aggregate({
    _max: { sortOrder: true },
    where: { proposalId: proposal.id },
  });
  const item = await prisma.proposalItem.create({
    data: { ...parsed, proposalId: proposal.id, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    include: { fund: true, attachments: true },
  });
  return NextResponse.json(item, { status: 201 });
}
