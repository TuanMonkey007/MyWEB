// Số liệu cho Dashboard (FR-7) — transfer KHÔNG tính vào thu/chi (BR-5)
import { prisma } from "./prisma";

export type CategorySlice = { categoryId: string; name: string; amount: number };

export async function getExpenseByCategory(
  from: Date,
  to: Date
): Promise<CategorySlice[]> {
  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: { occurredAt: { gte: from, lte: to } },
  });
  const categories = await prisma.category.findMany({
    where: { kind: "EXPENSE" },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return grouped
    .map((g) => ({
      categoryId: g.categoryId,
      name: nameById.get(g.categoryId) ?? "Khác",
      amount: g._sum.amount ?? 0,
    }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export type MonthPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export async function getMonthlySeries(monthCount = 6): Promise<MonthPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { occurredAt: { gte: start } },
      select: { amount: true, occurredAt: true },
    }),
    prisma.income.findMany({
      where: { occurredAt: { gte: start } },
      select: { amount: true, occurredAt: true },
    }),
  ]);

  const points: MonthPoint[] = [];
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1) + i, 1);
    points.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `T${d.getMonth() + 1}/${d.getFullYear() % 100}`,
      income: 0,
      expense: 0,
    });
  }
  const indexByKey = new Map(points.map((p, i) => [p.key, i]));

  for (const e of expenses) {
    const i = indexByKey.get(
      `${e.occurredAt.getFullYear()}-${e.occurredAt.getMonth()}`
    );
    if (i != null) points[i].expense += e.amount;
  }
  for (const inc of incomes) {
    const i = indexByKey.get(
      `${inc.occurredAt.getFullYear()}-${inc.occurredAt.getMonth()}`
    );
    if (i != null) points[i].income += inc.amount;
  }
  return points;
}

export function currentMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}
