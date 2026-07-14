import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const budgetYear = await prisma.budgetYear.findUnique({
    where: { id: String(body.budgetYearId ?? "") },
  });
  if (!budgetYear) return jsonError("Năm ngân sách không tồn tại");

  const proposedAt = new Date(String(body.proposedAt ?? ""));
  if (isNaN(proposedAt.getTime())) return jsonError("Ngày không hợp lệ");

  // Số đợt: tự tăng nếu không nhập
  let number = Math.round(Number(body.number));
  if (!Number.isFinite(number) || number <= 0) {
    const max = await prisma.proposal.aggregate({
      _max: { number: true },
      where: { budgetYearId: budgetYear.id },
    });
    number = (max._max.number ?? 0) + 1;
  } else {
    const dup = await prisma.proposal.findUnique({
      where: { budgetYearId_number: { budgetYearId: budgetYear.id, number } },
    });
    if (dup) return jsonError(`Đợt số ${number} đã tồn tại trong năm`, 409);
  }

  const proposal = await prisma.proposal.create({
    data: {
      budgetYearId: budgetYear.id,
      number,
      proposedAt,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(proposal, { status: 201 });
}
