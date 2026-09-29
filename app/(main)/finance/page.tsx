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
    <div className="space-y-6">
      {/* SECTION HEADER — PHONG CÁCH NEO-BRUTALIST EDITORIAL */}
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="flex size-10 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Tổng quan tài chính cá nhân — Tháng {monthLabel}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
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

      {/* 4 KPI CARDS — NEO-BRUTALIST VỚI VIỀN ĐEN VÀ BÓNG KHỐI CỨNG */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tổng tiền */}
        <div className="rounded-sm border-2 border-[#1C1917] bg-white p-4.5 shadow-neo transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Tổng tài sản khả dụng
            </p>
            <div className="rounded-xs border border-[#1C1917] bg-[#FDF1EA] p-1 text-[#F25C2B]">
              <Wallet className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {formatVND(totalAssets)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            Trên tổng số {wallets.length} ví hoạt động
          </p>
        </div>

        {/* Card 2: Thu tháng */}
        <div className="rounded-sm border-2 border-[#1C1917] bg-white p-4.5 shadow-neo transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Thu tháng {monthLabel}
            </p>
            <div className="rounded-xs border border-[#1C1917] bg-[#E8F5E9] p-1 text-emerald-700 dark:text-emerald-400">
              <ArrowDownLeft className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
            +{formatVND(monthTotals.income)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            Dòng tiền vào trong kỳ
          </p>
        </div>

        {/* Card 3: Chi tháng */}
        <div className="rounded-sm border-2 border-[#1C1917] bg-white p-4.5 shadow-neo transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#F25C2B]">
              Chi tháng {monthLabel}
            </p>
            <div className="rounded-xs border border-[#1C1917] bg-[#FDF1EA] p-1 text-[#F25C2B]">
              <ArrowUpRight className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#F25C2B]">
            -{formatVND(monthTotals.expense)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            Chênh lệch: {formatVND(monthTotals.income - monthTotals.expense)}
          </p>
        </div>

        {/* Card 4: Số ví */}
        <div className="rounded-sm border-2 border-[#1C1917] bg-white p-4.5 shadow-neo transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] dark:bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Số tài khoản / Ví
            </p>
            <div className="rounded-xs border border-[#1C1917] bg-stone-100 p-1 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
              <CreditCard className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 font-editorial text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {wallets.length} ví
          </p>
          <p className="mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            Tiền mặt, ngân hàng, thẻ tín dụng
          </p>
        </div>
      </div>

      {/* BẢNG SỐ DƯ TỪNG VÍ — PHONG CÁCH BẢNG KÊ CHUYÊN NGHIỆP NEO-BRUTALIST */}
      <section className="space-y-4 rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
              <CreditCard className="size-4" />
            </div>
            <div>
              <h2 className="font-editorial text-base sm:text-lg font-bold text-foreground">
                Chi tiết số dư & tỷ trọng từng tài khoản
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Bảng đối soát số dư thực tế theo các nguồn tiền đang quản lý
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
            Đơn vị tính: <strong className="font-black text-[#F25C2B]">VNĐ</strong>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xs border-2 border-[#1C1917] bg-white shadow-neo-sm dark:bg-card">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1C1917] bg-[#F5EFEB] text-[11px] font-black uppercase tracking-wider text-[#1C1917] dark:bg-[#2C1F15] dark:text-[#FAF7F0]">
                <th className="py-2.5 px-3 text-center w-12 border-r-2 border-[#1C1917]">STT</th>
                <th className="py-2.5 px-4 border-r-2 border-[#1C1917]">Tên ví / Tài khoản</th>
                <th className="py-2.5 px-4 border-r-2 border-[#1C1917] w-64">Phân bổ tỷ trọng</th>
                <th className="py-2.5 px-4 text-right border-r-2 border-[#1C1917] w-44">Số dư khả dụng</th>
                <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
              </tr>
              {/* DÒNG TỔNG CỘNG */}
              <tr className="border-b-2 border-[#1C1917] bg-[#FAF7F0] font-black text-foreground dark:bg-[#22170F]">
                <td className="py-2.5 px-3 text-center border-r-2 border-[#1C1917]">—</td>
                <td className="py-2.5 px-4 border-r-2 border-[#1C1917] font-black">
                  Tổng cộng ({wallets.length} ví)
                </td>
                <td className="py-2.5 px-4 border-r-2 border-[#1C1917]">
                  <div className="h-2.5 w-full bg-stone-200 border border-[#1C1917] rounded-none overflow-hidden">
                    <div className="h-full bg-[#F25C2B] w-full" />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right border-r-2 border-[#1C1917] font-black text-foreground tabular-nums text-xs sm:text-sm">
                  {formatVND(totalAssets)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-xs text-[10px] font-black uppercase bg-[#E8F5E9] text-[#1B5E20] border-1.5 border-[#1C1917] shadow-neo-sm">
                    Khớp số liệu
                  </span>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border/60">
              {wallets.map((w, idx) => {
                const ratio = totalAssets > 0 ? Math.max(0, (w.balance / totalAssets) * 100) : 0;
                return (
                  <tr key={w.id} className="hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15] transition-colors">
                    <td className="py-2.5 px-3 text-center text-muted-foreground border-r-2 border-[#1C1917] font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-foreground border-r-2 border-[#1C1917]">
                      <div className="flex items-center gap-2">
                        <Wallet className="size-3.5 text-[#F25C2B]" />
                        <span>{w.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 border-r-2 border-[#1C1917]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 flex-1 bg-stone-100 border border-[#1C1917] rounded-none overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              w.balance < 0 ? "bg-rose-500" : "bg-[#F25C2B]"
                            )}
                            style={{
                              width: `${Math.min(
                                (Math.abs(w.balance) / maxBalance) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-stone-700 dark:text-stone-300 w-10 text-right font-bold tabular-nums">
                          {ratio.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "py-2.5 px-4 text-right font-black tabular-nums border-r-2 border-[#1C1917]",
                        w.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                      )}
                    >
                      {formatVND(w.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-stone-100 text-stone-800 border border-[#1C1917] dark:bg-stone-800 dark:text-stone-200">
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
          <div className="flex items-center space-x-2.5 border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
              <PieChart className="size-4" />
            </div>
            <div>
              <h3 className="font-editorial text-base font-bold text-foreground">
                Cơ cấu chi tiêu theo danh mục — Tháng {monthLabel}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">Tỷ lệ các khoản chi phát sinh trong kỳ</p>
            </div>
          </div>
          <div className="pt-2">
            <ExpenseDonut
              data={byCategory.map((s) => ({ name: s.name, amount: s.amount }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
          <div className="flex items-center space-x-2.5 border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <h3 className="font-editorial text-base font-bold text-foreground">
                Xu hướng dòng tiền thu — chi 6 tháng gần nhất
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">So sánh đối soát luân chuyển dòng tiền</p>
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
