// FR-6: danh sách gộp chi/thu/chuyển, sắp mới nhất trước, lọc + tìm kiếm
import { prisma } from "./prisma";
import type { TransactionRow, TransactionType } from "./types";

export type TransactionFilters = {
  type?: TransactionType;
  q?: string;
  walletId?: string;
  categoryId?: string;
  from?: Date;
  to?: Date;
};

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionRow[]> {
  const { type, q, walletId, categoryId, from, to } = filters;

  const dateWhere =
    from || to
      ? { occurredAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
      : {};
  const search = q?.trim();

  const wantExpense = !type || type === "expense";
  const wantIncome = !type || type === "income";
  // Transfer không có danh mục — lọc theo danh mục thì loại transfer
  const wantTransfer = (!type || type === "transfer") && !categoryId;

  const [expenses, incomes, transfers] = await Promise.all([
    wantExpense
      ? prisma.expense.findMany({
          where: {
            ...dateWhere,
            ...(walletId && { walletId }),
            ...(categoryId && { categoryId }),
            ...(search && { title: { contains: search } }),
          },
          include: { category: true, wallet: true },
        })
      : [],
    wantIncome
      ? prisma.income.findMany({
          where: {
            ...dateWhere,
            ...(walletId && { walletId }),
            ...(categoryId && { categoryId }),
            ...(search && { title: { contains: search } }),
          },
          include: { category: true, wallet: true },
        })
      : [],
    wantTransfer
      ? prisma.transfer.findMany({
          where: {
            ...dateWhere,
            ...(walletId && {
              OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
            }),
            ...(search && { title: { contains: search } }),
          },
          include: { fromWallet: true, toWallet: true },
        })
      : [],
  ]);

  const rows: (TransactionRow & { createdAt: Date })[] = [
    ...expenses.map((e) => ({
      id: e.id,
      type: "expense" as const,
      title: e.title,
      amount: e.amount,
      occurredAt: e.occurredAt.toISOString(),
      createdAt: e.createdAt,
      imagePath: e.imagePath,
      categoryId: e.categoryId,
      categoryName: e.category.name,
      walletId: e.walletId,
      walletName: e.wallet.name,
      fromWalletId: null,
      fromWalletName: null,
      toWalletId: null,
      toWalletName: null,
    })),
    ...incomes.map((i) => ({
      id: i.id,
      type: "income" as const,
      title: i.title,
      amount: i.amount,
      occurredAt: i.occurredAt.toISOString(),
      createdAt: i.createdAt,
      imagePath: i.imagePath,
      categoryId: i.categoryId,
      categoryName: i.category.name,
      walletId: i.walletId,
      walletName: i.wallet.name,
      fromWalletId: null,
      fromWalletName: null,
      toWalletId: null,
      toWalletName: null,
    })),
    ...transfers.map((t) => ({
      id: t.id,
      type: "transfer" as const,
      title: t.title ?? "Chuyển khoản",
      amount: t.amount,
      occurredAt: t.occurredAt.toISOString(),
      createdAt: t.createdAt,
      imagePath: t.imagePath,
      categoryId: null,
      categoryName: null,
      walletId: null,
      walletName: null,
      fromWalletId: t.fromWalletId,
      fromWalletName: t.fromWallet.name,
      toWalletId: t.toWalletId,
      toWalletName: t.toWallet.name,
    })),
  ];

  rows.sort(
    (a, b) =>
      b.occurredAt.localeCompare(a.occurredAt) ||
      b.createdAt.getTime() - a.createdAt.getTime()
  );

  return rows.map(({ createdAt: _createdAt, ...row }) => row);
}
