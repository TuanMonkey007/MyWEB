// Nghiệp vụ module Đề xuất mua hàng — mọi con số quỹ tính động, KHÔNG lưu DB.
// Còn lại      = Tổng quỹ (Σ 12 tháng) − Σ tiền thực tế các hạng mục ĐÃ MUA
// Còn sau chờ  = Còn lại − Σ tiền đề xuất các hạng mục CHỜ MUA
// Hạng mục HUỶ không tính vào bất kỳ số nào.
import type { BudgetFund } from "@prisma/client";
import { prisma } from "./prisma";

export const ITEM_STATUSES = ["PENDING", "PURCHASED", "CANCELLED"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  PENDING: "Chờ mua",
  PURCHASED: "Đã mua",
  CANCELLED: "Huỷ",
};

export function fundTotal(f: BudgetFund): number {
  return (
    f.m1 + f.m2 + f.m3 + f.m4 + f.m5 + f.m6 +
    f.m7 + f.m8 + f.m9 + f.m10 + f.m11 + f.m12
  );
}

export type FundStats = {
  id: string;
  name: string;
  monthly: number[];
  notes: string | null;
  total: number;
  spent: number;
  pending: number;
  remaining: number;
  remainingAfterPending: number;
  itemCount: number;
};

export type GroupStats = {
  id: string;
  code: string;
  name: string;
  funds: FundStats[];
  total: number;
  spent: number;
  pending: number;
  remaining: number;
};

export async function getBudgetOverview(budgetYearId: string): Promise<{
  groups: GroupStats[];
  total: number;
  spent: number;
  pending: number;
  remaining: number;
}> {
  const [groups, sums] = await Promise.all([
    prisma.budgetGroup.findMany({
      where: { budgetYearId },
      orderBy: { sortOrder: "asc" },
      include: { funds: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.proposalItem.groupBy({
      by: ["fundId", "status"],
      _sum: { actualAmount: true, proposedAmount: true },
      _count: true,
      where: { fund: { group: { budgetYearId } } },
    }),
  ]);

  const spentBy = new Map<string, number>();
  const pendingBy = new Map<string, number>();
  const countBy = new Map<string, number>();
  for (const s of sums) {
    countBy.set(s.fundId, (countBy.get(s.fundId) ?? 0) + s._count);
    if (s.status === "PURCHASED")
      spentBy.set(s.fundId, (spentBy.get(s.fundId) ?? 0) + (s._sum.actualAmount ?? 0));
    if (s.status === "PENDING")
      pendingBy.set(s.fundId, (pendingBy.get(s.fundId) ?? 0) + (s._sum.proposedAmount ?? 0));
  }

  const groupStats: GroupStats[] = groups.map((g) => {
    const funds: FundStats[] = g.funds.map((f) => {
      const total = fundTotal(f);
      const spent = spentBy.get(f.id) ?? 0;
      const pending = pendingBy.get(f.id) ?? 0;
      return {
        id: f.id,
        name: f.name,
        monthly: [f.m1, f.m2, f.m3, f.m4, f.m5, f.m6, f.m7, f.m8, f.m9, f.m10, f.m11, f.m12],
        notes: f.notes,
        total,
        spent,
        pending,
        remaining: total - spent,
        remainingAfterPending: total - spent - pending,
        itemCount: countBy.get(f.id) ?? 0,
      };
    });
    const sum = (fn: (f: FundStats) => number) => funds.reduce((s, f) => s + fn(f), 0);
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      funds,
      total: sum((f) => f.total),
      spent: sum((f) => f.spent),
      pending: sum((f) => f.pending),
      remaining: sum((f) => f.remaining),
    };
  });

  const sumAll = (fn: (g: GroupStats) => number) =>
    groupStats.reduce((s, g) => s + fn(g), 0);
  return {
    groups: groupStats,
    total: sumAll((g) => g.total),
    spent: sumAll((g) => g.spent),
    pending: sumAll((g) => g.pending),
    remaining: sumAll((g) => g.remaining),
  };
}

// Chọn năm ngân sách từ ?year= (mặc định: năm mới nhất)
export async function resolveBudgetYear(yearParam?: string) {
  const years = await prisma.budgetYear.findMany({ orderBy: { year: "desc" } });
  const selected =
    years.find((y) => String(y.year) === yearParam) ?? years[0] ?? null;
  return { years, selected };
}

// Danh sách quỹ kèm số còn lại — cho form chọn quỹ của hạng mục
export async function getFundOptions(budgetYearId: string) {
  const { groups } = await getBudgetOverview(budgetYearId);
  return groups.flatMap((g) =>
    g.funds.map((f) => ({
      id: f.id,
      name: f.name,
      groupCode: g.code,
      total: f.total,
      remaining: f.remaining,
      remainingAfterPending: f.remainingAfterPending,
    }))
  );
}
