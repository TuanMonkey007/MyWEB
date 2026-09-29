import { Suspense } from "react";
import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTransactions } from "@/lib/transactions";
import type { TransactionType } from "@/lib/types";
import { QuickAddButtons } from "@/components/forms/quick-add";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const type = first(params.type);
  const from = first(params.from);
  const to = first(params.to);

  const [rows, wallets, categories] = await Promise.all([
    getTransactions({
      type: ["expense", "income", "transfer"].includes(type ?? "")
        ? (type as TransactionType)
        : undefined,
      q: first(params.q),
      walletId: first(params.walletId),
      categoryId: first(params.categoryId),
      from: from ? new Date(`${from}T00:00:00`) : undefined,
      to: to ? new Date(`${to}T23:59:59.999`) : undefined,
    }),
    prisma.wallet.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }),
  ]);

  const walletOptions = wallets.map((w) => ({ id: w.id, name: w.name }));
  const expenseCategories = categories
    .filter((c) => c.kind === "EXPENSE")
    .map((c) => ({ id: c.id, name: c.name }));
  const incomeCategories = categories
    .filter((c) => c.kind === "INCOME")
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <div className="flex items-center space-x-3.5">
          <div className="flex size-10 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Quản lý lịch sử giao dịch
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              {rows.length} giao dịch được ghi nhận trong hệ thống
            </p>
          </div>
        </div>

        <QuickAddButtons
          wallets={walletOptions}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      </div>

      {/* Filter Bar */}
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-4 shadow-neo-sm dark:bg-card">
        <Suspense>
          <TransactionFilters
            wallets={walletOptions}
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              kind: c.kind,
            }))}
          />
        </Suspense>
      </div>

      {/* Transactions Table */}
      <TransactionTable
        rows={rows}
        wallets={walletOptions}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </div>
  );
}
