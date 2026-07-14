import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, monthsToData, parseMonths } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên quỹ là bắt buộc");

  const group = await prisma.budgetGroup.findUnique({
    where: { id: String(body.groupId ?? "") },
    include: { _count: { select: { funds: true } } },
  });
  if (!group) return jsonError("Nhóm không tồn tại");

  const months = parseMonths(body.months);
  if ("error" in months) return jsonError(months.error);

  const fund = await prisma.budgetFund.create({
    data: {
      groupId: group.id,
      name,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      sortOrder: group._count.funds,
      ...monthsToData(months),
    },
  });
  return NextResponse.json(fund, { status: 201 });
}
