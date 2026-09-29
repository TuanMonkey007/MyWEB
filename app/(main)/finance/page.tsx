import { ArrowDownLeft, ArrowUpRight, BarChart3, CreditCard, PieChart, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getWalletsWithBalances, getIncomeExpenseTotals } from "@/lib/balance";
import {
  currentMonthRange,
  getExpenseByCategory,
  getMonthlySeries,
} from "@/lib/reports";
import { formatVND } from "@/lib/format";
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
    <div className="space-y-5">
      {/* SECTION HEADER — THIẾT KẾ ĐỒNG BỘ THEO DESIGN SYSTEM */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Tổng quan tài chính cá nhân — Tháng {monthLabel}
              </h1>
              <p className="text-xs text-muted-foreground">
                Theo dõi chi tiết số dư ví, đối soát dòng tiền thu chi và phân bổ danh mục theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* 4 KPI CARDS — DÙNG BIẾN SEMANTIC ĐỒNG BỘ 100% CẢ LIGHT VÀ DARK MODE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng tiền */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng tài sản khả dụng
            </p>
            <Wallet className="size-4 text-primary" />
          </div>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {formatVND(totalAssets)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Trên tổng số {wallets.length} ví hoạt động
          </p>
        </div>

        {/* Card 2: Thu tháng */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Thu tháng {monthLabel}
            </p>
            <ArrowDownLeft className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatVND(monthTotals.income)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tổng dòng tiền thu trong kỳ
          </p>
        </div>

        {/* Card 3: Chi tháng */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Chi tháng {monthLabel}
            </p>
            <ArrowUpRight className="size-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
            -{formatVND(monthTotals.expense)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Chênh lệch: {formatVND(monthTotals.income - monthTotals.expense)}
          </p>
        </div>

        {/* Card 4: Số ví */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Số tài khoản / Ví
            </p>
            <CreditCard className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {wallets.length} ví
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tiền mặt, ngân hàng, thẻ tín dụng
          </p>
        </div>
      </div>

      {/* BẢNG SỐ DƯ TỪNG VÍ — PHONG CÁCH BẢNG KÊ CHUYÊN NGHIỆP */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                Chi tiết số dư & tỷ trọng từng tài khoản
              </h2>
              <p className="text-xs text-muted-foreground">
                Bảng đối soát số dư thực tế theo các nguồn tiền đang quản lý
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Đơn vị tính: <strong className="text-foreground">VNĐ</strong>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2 px-3 text-center w-12 border-r border-border">STT</th>
                <th className="py-2 px-4 border-r border-border">Tên ví / Tài khoản</th>
                <th className="py-2 px-4 border-r border-border w-64">Phân bổ tỷ trọng</th>
                <th className="py-2 px-4 text-right border-r border-border w-44">Số dư khả dụng</th>
                <th className="py-2 px-3 text-center w-28">Trạng thái</th>
              </tr>
              {/* DÒNG TỔNG CỘNG HÀI HÒA VỚI GIAO DIỆN */}
              <tr className="border-b-2 border-border bg-muted/70 font-semibold text-foreground">
                <td className="py-2 px-3 text-center border-r border-border">—</td>
                <td className="py-2 px-4 border-r border-border font-bold">
                  Tổng cộng ({wallets.length} ví)
                </td>
                <td className="py-2 px-4 border-r border-border">
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full" />
                  </div>
                </td>
                <td className="py-2 px-4 text-right border-r border-border font-bold text-foreground tabular-nums text-xs sm:text-sm">
                  {formatVND(totalAssets)}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Khớp số liệu
                  </span>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {wallets.map((w, idx) => {
                const ratio = totalAssets > 0 ? Math.max(0, (w.balance / totalAssets) * 100) : 0;
                return (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 text-center text-muted-foreground border-r border-border">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-4 font-medium text-foreground border-r border-border">
                      <div className="flex items-center gap-2">
                        <Wallet className="size-3.5 text-muted-foreground" />
                        <span>{w.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-r border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden border border-border">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              w.balance < 0 ? "bg-rose-500" : "bg-primary"
                            )}
                            style={{
                              width: `${Math.min(
                                (Math.abs(w.balance) / maxBalance) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-10 text-right font-medium tabular-nums">
                          {ratio.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "py-2 px-4 text-right font-semibold tabular-nums border-r border-border",
                        w.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                      )}
                    >
                      {formatVND(w.balance)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2 BIỂU ĐỒ BÁO CÁO TRỰC QUAN */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-border pb-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PieChart className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Cơ cấu chi tiêu theo danh mục — Tháng {monthLabel}
              </h3>
              <p className="text-[11px] text-muted-foreground">Tỷ lệ các khoản chi phát sinh trong kỳ</p>
            </div>
          </div>
          <div className="pt-2">
            <ExpenseDonut
              data={byCategory.map((s) => ({ name: s.name, amount: s.amount }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-border pb-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Xu hướng dòng tiền thu — chi 6 tháng gần nhất
              </h3>
              <p className="text-[11px] text-muted-foreground">So sánh đối soát luân chuyển dòng tiền</p>
            </div>
          </div>
          <div className="pt-2">
            <MonthlyChart data={monthly} />
          </div>
        </div>
      </div>
    </div>
  );
}
