import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// Khoá so khớp tên quỹ giữa các năm: bỏ dấu cách thừa, chữ hoa/thường, dấu chấm cuối.
// File Excel công ty hay dùng Unicode tổ hợp nên phải NFC trước khi so.
function fundKey(name: string): string {
  return name.normalize("NFC").toLowerCase().replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
}
const nameKey = fundKey;

// Kế thừa mặt hàng: liệt kê hạng mục ở các đợt khác (mọi năm, mới nhất trước)
// kèm quỹ tương ứng trong năm của đợt đích
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const target = await prisma.proposal.findUnique({
    where: { id },
    include: { items: { select: { name: true } } },
  });
  if (!target) return jsonError("Không tìm thấy đợt đề xuất", 404);

  const [targetFunds, sources] = await Promise.all([
    prisma.budgetFund.findMany({
      where: { group: { budgetYearId: target.budgetYearId } },
      select: { id: true, name: true },
    }),
    prisma.proposal.findMany({
      where: { id: { not: id } },
      orderBy: [{ proposedAt: "desc" }, { number: "desc" }],
      include: {
        budgetYear: { select: { year: true } },
        items: {
          where: { status: { not: "CANCELLED" } },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { fund: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const fundIds = new Set(targetFunds.map((f) => f.id));
  const fundByKey = new Map(targetFunds.map((f) => [fundKey(f.name), f.id]));
  const existing = new Set(target.items.map((i) => nameKey(i.name)));

  // Mặc định: đợt gần nhất trước (hoặc cùng ngày) đợt đích có hàng ĐÃ MUA —
  // đợt toàn hàng chờ mua thì danh sách mặc định (chỉ hiện đã mua) sẽ trống
  const hasPurchased = (p: (typeof sources)[number]) => p.items.some((i) => i.status === "PURCHASED");
  const notAfter = (p: (typeof sources)[number]) => p.proposedAt.getTime() <= target.proposedAt.getTime();
  const fallback =
    sources.find((p) => notAfter(p) && hasPurchased(p)) ??
    sources.find(hasPurchased) ??
    sources.find((p) => p.items.length > 0);

  return NextResponse.json({
    defaultSourceId: fallback?.id ?? null,
    sources: sources
      .filter((p) => p.items.length > 0)
      .map((p) => ({
        id: p.id,
        number: p.number,
        title: p.title,
        proposedAt: p.proposedAt.toISOString(),
        year: p.budgetYear.year,
        items: p.items.map((it) => ({
          id: it.id,
          name: it.name,
          unit: it.unit,
          quantity: it.quantity,
          specs: it.specs,
          reason: it.reason,
          status: it.status,
          proposedAmount: it.proposedAmount,
          fundName: it.fund.name,
          // Cùng năm thì giữ quỹ cũ; khác năm thì tìm quỹ trùng tên trong năm đích
          targetFundId: fundIds.has(it.fund.id) ? it.fund.id : fundByKey.get(fundKey(it.fund.name)) ?? null,
          alreadyInTarget: existing.has(nameKey(it.name)),
        })),
      })),
  });
}

// Sao chép các mặt hàng đã chọn vào đợt này, trạng thái Chờ mua.
// Không chép tiền thực tế, ngày mua hay file đính kèm — đó là chứng từ của lần mua cũ.
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const target = await prisma.proposal.findUnique({ where: { id } });
  if (!target) return jsonError("Không tìm thấy đợt đề xuất", 404);

  const body = await req.json().catch(() => null);
  const rows: unknown[] = Array.isArray(body?.items) ? body.items : [];
  if (rows.length === 0) return jsonError("Chưa chọn mặt hàng nào");
  if (rows.length > 300) return jsonError("Chọn tối đa 300 mặt hàng mỗi lần");

  const parsed: { sourceItemId: string; quantity: number; proposedAmount: number; fundId: string }[] = [];
  for (const r of rows) {
    const o = (r ?? {}) as Record<string, unknown>;
    const quantity = Number(o.quantity);
    const proposedAmount = Math.round(Number(o.proposedAmount));
    if (typeof o.sourceItemId !== "string" || typeof o.fundId !== "string" || !o.fundId)
      return jsonError("Có mặt hàng chưa chọn quỹ");
    if (!Number.isFinite(quantity) || quantity <= 0) return jsonError("Số lượng phải lớn hơn 0");
    if (!Number.isFinite(proposedAmount) || proposedAmount < 0)
      return jsonError("Tiền đề xuất không hợp lệ");
    parsed.push({ sourceItemId: o.sourceItemId, quantity, proposedAmount, fundId: o.fundId });
  }

  const [sourceItems, validFunds] = await Promise.all([
    prisma.proposalItem.findMany({ where: { id: { in: parsed.map((p) => p.sourceItemId) } } }),
    prisma.budgetFund.findMany({
      where: { id: { in: parsed.map((p) => p.fundId) }, group: { budgetYearId: target.budgetYearId } },
      select: { id: true },
    }),
  ]);
  const sourceById = new Map(sourceItems.map((s) => [s.id, s]));
  const fundOk = new Set(validFunds.map((f) => f.id));
  for (const p of parsed) {
    if (!sourceById.has(p.sourceItemId)) return jsonError("Mặt hàng gốc không còn tồn tại");
    if (!fundOk.has(p.fundId)) return jsonError("Quỹ không thuộc năm ngân sách của đợt này");
  }

  // Mặt hàng kế thừa nối vào cuối đợt, giữ thứ tự đã chọn
  const last = await prisma.proposalItem.aggregate({
    _max: { sortOrder: true },
    where: { proposalId: target.id },
  });
  const base = (last._max.sortOrder ?? -1) + 1;

  await prisma.$transaction(
    parsed.map((p, i) => {
      const s = sourceById.get(p.sourceItemId)!;
      return prisma.proposalItem.create({
        data: {
          proposalId: target.id,
          fundId: p.fundId,
          name: s.name,
          unit: s.unit,
          quantity: p.quantity,
          specs: s.specs,
          reason: s.reason,
          notes: s.notes,
          status: "PENDING",
          proposedAmount: p.proposedAmount,
          sortOrder: base + i,
        },
      });
    })
  );
  return NextResponse.json({ created: parsed.length }, { status: 201 });
}
