// Module tính toán dùng chung — mọi số dư/tổng tài sản tính động, KHÔNG lưu DB.
// BR-1: Số dư ví VNĐ = initialBalance + ΣIncome + ΣTransfer(đến) + adjustment
//                     − ΣExpense − ΣTransfer(từ)
// BR-2: Số dư ví INVEST (VNĐ) = balanceUSD × exchangeRate
// BR-3: Tổng tài sản = tổng số dư quy đổi VNĐ của tất cả ví
import type { Wallet } from "@prisma/client";
import { prisma } from "./prisma";

export type WalletSums = {
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
};

export type WalletWithBalance = Wallet & {
  balance: number;
  sums: WalletSums;
  transactionCount: number;
};

export function computeBalance(wallet: Wallet, sums: WalletSums): number {
  if (wallet.type === "INVEST") {
    // BR-2
    return (wallet.balanceUSD ?? 0) * (wallet.exchangeRate ?? 0);
  }
  // BR-1 (BR-4: cho phép âm, không chặn)
  return (
    wallet.initialBalance +
    sums.income +
    sums.transferIn +
    wallet.adjustment -
    sums.expense -
    sums.transferOut
  );
}

export async function getWalletsWithBalances(): Promise<WalletWithBalance[]> {
  const [wallets, expenseSums, incomeSums, outSums, inSums] =
    await Promise.all([
      prisma.wallet.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.expense.groupBy({
        by: ["walletId"],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.income.groupBy({
        by: ["walletId"],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transfer.groupBy({
        by: ["fromWalletId"],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transfer.groupBy({
        by: ["toWalletId"],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  const expenseBy = new Map(expenseSums.map((s) => [s.walletId, s]));
  const incomeBy = new Map(incomeSums.map((s) => [s.walletId, s]));
  const outBy = new Map(outSums.map((s) => [s.fromWalletId, s]));
  const inBy = new Map(inSums.map((s) => [s.toWalletId, s]));

  return wallets.map((wallet) => {
    const sums: WalletSums = {
      income: incomeBy.get(wallet.id)?._sum.amount ?? 0,
      expense: expenseBy.get(wallet.id)?._sum.amount ?? 0,
      transferIn: inBy.get(wallet.id)?._sum.amount ?? 0,
      transferOut: outBy.get(wallet.id)?._sum.amount ?? 0,
    };
    const transactionCount =
      (expenseBy.get(wallet.id)?._count ?? 0) +
      (incomeBy.get(wallet.id)?._count ?? 0) +
      (outBy.get(wallet.id)?._count ?? 0) +
      (inBy.get(wallet.id)?._count ?? 0);
    return { ...wallet, sums, balance: computeBalance(wallet, sums), transactionCount };
  });
}

// BR-3 — transfer nội bộ tự triệt tiêu (+in/−out) nên không đổi tổng (BR-5)
export async function getTotalAssets(): Promise<number> {
  const wallets = await getWalletsWithBalances();
  return wallets.reduce((sum, w) => sum + w.balance, 0);
}

// Tổng thu/chi trong khoảng thời gian (transfer KHÔNG tính — BR-5)
export async function getIncomeExpenseTotals(from: Date, to: Date) {
  const [income, expense] = await Promise.all([
    prisma.income.aggregate({
      _sum: { amount: true },
      where: { occurredAt: { gte: from, lte: to } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { occurredAt: { gte: from, lte: to } },
    }),
  ]);
  return {
    income: income._sum.amount ?? 0,
    expense: expense._sum.amount ?? 0,
  };
}
