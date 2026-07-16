import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { parseProposalWorkbook } from "@/lib/proposal-import";

const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

// Đọc phiếu đề xuất đã điền, khớp "Nguồn ngân sách" với quỹ trong năm.
// Trả về hạng mục (kèm fundId đã khớp / null) + danh sách quỹ cho bảng xem trước.
export async function POST(req: Request) {
  const budgetYearId = new URL(req.url).searchParams.get("budgetYearId") ?? "";
  const year = await prisma.budgetYear.findUnique({ where: { id: budgetYearId } });
  if (!year) return jsonError("Năm ngân sách không tồn tại");
  if (!req.body) return jsonError("Không có dữ liệu file");

  const buffer = Buffer.from(await req.arrayBuffer());
  if (buffer.length > 15 * 1024 * 1024) return jsonError("File tối đa 15MB");

  let parsed;
  try {
    parsed = await parseProposalWorkbook(buffer);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không đọc được file", 422);
  }

  const funds = await prisma.budgetFund.findMany({
    where: { group: { budgetYearId } },
    include: { group: true },
    orderBy: { sortOrder: "asc" },
  });
  const byNorm = new Map(funds.map((f) => [norm(f.name), f.id]));

  const items = parsed.items.map((it) => ({
    ...it,
    fundId: byNorm.get(norm(it.fundName)) ?? null,
  }));

  return NextResponse.json({
    proposedAt: parsed.proposedAt,
    items,
    funds: funds.map((f) => ({ id: f.id, name: f.name, groupCode: f.group.code })),
    matchedCount: items.filter((i) => i.fundId).length,
  });
}
