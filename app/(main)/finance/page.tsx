import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWalletsWithBalances, getIncomeExpenseTotals } from "@/lib/balance";
import {
  currentMonthRange,
  getExpenseByCategory,
  getMonthlySeries,
} from "@/lib/reports";
import { formatVND } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { QuickAddButtons } from "@/components/forms/quick-add";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// FR-7: Dashboard — tổng tài sản, thu/chi tháng, số dư ví, biểu đồ
export default async function DashboardPage() {
  const { from, to } = currentMonthRange();
  const [wallets, monthTotals, byCategory, monthly, categories] =
    await Promise.all([
      getWalletsWithBalances(),
      getIncomeExpenseTotals(from, to),
      getExpenseByCategory(from, to),
      getMonthlySeries(6),
      prisma.category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    ]);

  // BR-3 (transfer tự triệt tiêu — BR-5)
  const totalAssets = wallets.reduce((sum, w) => sum + w.balance, 0);
  const monthLabel = `${from.getMonth() + 1}/${from.getFullYear()}`;
  const maxBalance = Math.max(...wallets.map((w) => Math.abs(w.balance)), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <QuickAddButtons
          wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
          expenseCategories={categories
            .filter((c) => c.kind === "EXPENSE")
            .map((c) => ({ id: c.id, name: c.name }))}
          incomeCategories={categories
            .filter((c) => c.kind === "INCOME")
            .map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="size-4" /> Tổng tài sản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatVND(totalAssets)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowDownLeft className="size-4 text-emerald-600" /> Thu tháng{" "}
              {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-emerald-600 tracking-tight">
              {formatVND(monthTotals.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowUpRight className="size-4 text-red-600" /> Chi tháng {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-red-600 tracking-tight">
              {formatVND(monthTotals.expense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Chi theo danh mục — tháng {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseDonut
              data={byCategory.map((s) => ({ name: s.name, amount: s.amount }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thu — chi 6 tháng gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={monthly} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Số dư từng ví</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {wallets.map((w) => (
              <li key={w.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm">{w.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      w.balance < 0 ? "bg-red-500" : "bg-primary"
                    )}
                    style={{
                      width: `${Math.min(
                        (Math.abs(w.balance) / maxBalance) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "w-32 shrink-0 text-right text-sm font-medium tabular-nums",
                    w.balance < 0 && "text-red-600"
                  )}
                >
                  {formatVND(w.balance)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
