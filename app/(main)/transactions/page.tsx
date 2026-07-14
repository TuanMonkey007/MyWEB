import { Suspense } from "react";
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Giao dịch</h1>
          <p className="text-sm text-muted-foreground">{rows.length} giao dịch</p>
        </div>
        <QuickAddButtons
          wallets={walletOptions}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
        />
      </div>

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

      <TransactionTable
        rows={rows}
        wallets={walletOptions}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </div>
  );
}
