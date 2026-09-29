import { ArrowDownLeft, ArrowUpRight, Coins, CreditCard, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWalletsWithBalances, getIncomeExpenseTotals } from "@/lib/balance";
import {
  currentMonthRange,
  getExpenseByCategory,
  getMonthlySeries,
} from "@/lib/reports";
import { formatVND } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { QuickAddButtons } from "@/components/forms/quick-add";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const totalAssets = wallets.reduce((sum, w) => sum + w.balance, 0);
  const monthLabel = `${from.getMonth() + 1}/${from.getFullYear()}`;
  const maxBalance = Math.max(...wallets.map((w) => Math.abs(w.balance)), 1);

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tổng quan tài chính
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3" /> Tháng {monthLabel}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Báo cáo thu chi, phân bổ ngân sách và biến động số dư các tài khoản
          </p>
        </div>

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
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-xs">
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/15 blur-2xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng tài sản khả dụng
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
                <Coins className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              {formatVND(totalAssets)}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Wallet className="size-3 text-primary" /> {wallets.length} ví & tài khoản đang theo dõi
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thu nhập tháng {monthLabel}
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <TrendingUp className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatVND(monthTotals.income)}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              <ArrowDownLeft className="size-3" /> Tổng các dòng tiền vào trong tháng
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-card to-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng chi tiêu tháng {monthLabel}
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-2xs">
                <TrendingDown className="size-4.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
              -{formatVND(monthTotals.expense)}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-rose-600/80 dark:text-rose-400/80">
              <ArrowUpRight className="size-3" /> Tổng các dòng tiền ra trong tháng
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              Phân bổ chi tiêu theo danh mục
            </CardTitle>
            <CardDescription className="text-xs">
              Thống kê tỷ lệ chi tiêu theo các nhóm trong tháng {monthLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ExpenseDonut
              data={byCategory.map((s) => ({ name: s.name, amount: s.amount }))}
            />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              Biểu đồ dòng tiền 6 tháng gần nhất
            </CardTitle>
            <CardDescription className="text-xs">
              So sánh tương quan giữa tổng thu và tổng chi qua từng chu kỳ
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <MonthlyChart data={monthly} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Số dư chi tiết từng ví
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Tỷ trọng số dư trên tổng tài sản khả dụng
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {wallets.length} ví hoạt động
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3.5">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-border/50 bg-card/50 p-3 hover:border-border transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-[140px] sm:w-44 shrink-0">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="size-3.5" />
                  </div>
                  <span className="truncate text-xs sm:text-sm font-semibold text-foreground">
                    {w.name}
                  </span>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        w.balance < 0
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-primary to-indigo-400"
                      )}
                      style={{
                        width: `${Math.min(
                          (Math.abs(w.balance) / maxBalance) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "text-right text-xs sm:text-sm font-bold tabular-nums shrink-0 sm:w-36",
                    w.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                  )}
                >
                  {formatVND(w.balance)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
