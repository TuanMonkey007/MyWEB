import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

// Tạo đợt đề xuất mới + toàn bộ hạng mục từ dữ liệu đã xem trước (1 transaction).
export async function POST(req: Request) {
  const body = await req.json();
  const budgetYear = await prisma.budgetYear.findUnique({
    where: { id: String(body.budgetYearId ?? "") },
  });
  if (!budgetYear) return jsonError("Năm ngân sách không tồn tại");

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return jsonError("Không có hạng mục nào để tạo");

  // Chuẩn hóa + kiểm tra từng hạng mục
  const fundIds = new Set<string>();
  const clean = [];
  for (const [i, it] of (items as Record<string, unknown>[]).entries()) {
    const name = typeof it.name === "string" ? it.name.trim() : "";
    if (!name) return jsonError(`Hạng mục ${i + 1} thiếu tên`);
    const fundId = typeof it.fundId === "string" ? it.fundId : "";
    if (!fundId) return jsonError(`Hạng mục "${name}" chưa chọn quỹ`);
    fundIds.add(fundId);
    const qty = Number(it.quantity);
    clean.push({
      name,
      fundId,
      unit: typeof it.unit === "string" && it.unit.trim() ? it.unit.trim() : null,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      specs: typeof it.specs === "string" && it.specs.trim() ? it.specs.trim() : null,
      reason: typeof it.reason === "string" && it.reason.trim() ? it.reason.trim() : null,
      notes: typeof it.notes === "string" && it.notes.trim() ? it.notes.trim() : null,
      proposedAmount: Math.max(0, Math.round(Number(it.proposedAmount) || 0)),
      status: "PENDING",
    });
  }

  // Mọi quỹ phải thuộc năm này
  const validFunds = await prisma.budgetFund.count({
    where: { id: { in: [...fundIds] }, group: { budgetYearId: budgetYear.id } },
  });
  if (validFunds !== fundIds.size)
    return jsonError("Có hạng mục trỏ tới quỹ không thuộc năm ngân sách này");

  const proposedAt = body.proposedAt ? new Date(String(body.proposedAt)) : new Date();
  const max = await prisma.proposal.aggregate({
    _max: { number: true },
    where: { budgetYearId: budgetYear.id },
  });

  try {
    const proposal = await prisma.proposal.create({
      data: {
        budgetYearId: budgetYear.id,
        number: (max._max.number ?? 0) + 1,
        proposedAt: isNaN(proposedAt.getTime()) ? new Date() : proposedAt,
        title:
          typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
        notes: "Nhập từ file Excel",
        items: { create: clean },
      },
    });
    return NextResponse.json({ id: proposal.id }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Tạo đợt thất bại", 400);
  }
}
