import { ArrowDownLeft, ArrowUpRight, BarChart3, Coins, CreditCard, DollarSign, FileSpreadsheet, PieChart, Plus, Wallet } from "lucide-react";
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
      {/* SECTION HEADER — CHUẨN PHONG CÁCH TOOL DMS HNF */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 bg-rose-100 text-[#881337] rounded-xl flex items-center justify-center font-black text-base shadow-xs">
              📊
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                BÁO CÁO TỔNG QUAN TÀI CHÍNH CÁ NHÂN (THÁNG {monthLabel})
              </h1>
              <p className="text-xs text-slate-500">
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

      {/* 4 KPI CARDS — THEO ĐÚNG MÀU SẮC TOOL DMS (ROSE, BLUE, INDIGO, AMBER) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng tiền */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Tổng tài sản khả dụng
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-900 mt-1 tabular-nums">
            {formatVND(totalAssets)}
          </p>
          <p className="text-[11px] text-rose-600 mt-1">
            Tổng số dư trên {wallets.length} ví hoạt động
          </p>
        </div>

        {/* Card 2: Thu tháng */}
        <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Tổng thu tháng {monthLabel}
          </p>
          <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1 tabular-nums">
            +{formatVND(monthTotals.income)}
          </p>
          <p className="text-[11px] text-blue-600 mt-1">
            Dòng tiền vào trong kỳ báo cáo
          </p>
        </div>

        {/* Card 3: Chi tháng */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Tổng chi tháng {monthLabel}
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-900 mt-1 tabular-nums">
            -{formatVND(monthTotals.expense)}
          </p>
          <p className="text-[11px] text-rose-600 mt-1">
            Chênh lệch: {formatVND(monthTotals.income - monthTotals.expense)}
          </p>
        </div>

        {/* Card 4: Số ví */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Số tài khoản / Ví
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
            {wallets.length} Ví
          </p>
          <p className="text-[11px] text-amber-600 mt-1">
            Tiền mặt, Ngân hàng, Thẻ tín dụng
          </p>
        </div>
      </div>

      {/* BẢNG SỐ DƯ TỪNG VÍ — PHONG CÁCH BẢNG EXCEL DMS */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold text-sm">
              📋
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Chi Tiết Số Dư & Tỷ Trọng Từng Tài Khoản
              </h2>
              <p className="text-xs text-slate-500">
                Bảng đối soát số dư thực tế theo định dạng bảng số liệu chuẩn DMS
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Đơn vị tính: <strong className="text-slate-700">VNĐ</strong>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 text-center w-14 border-r border-slate-200">STT</th>
                <th className="py-2.5 px-4 border-r border-slate-200">Tên Ví / Tài Khoản</th>
                <th className="py-2.5 px-4 border-r border-slate-200 w-64">Phân bổ tỷ trọng</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200 w-44">Số dư khả dụng</th>
                <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
              </tr>
              {/* DÒNG TỔNG CỘNG NỔI BẬT KIỂU DMS (NỀN VÀNG NHẸ) */}
              <tr className="bg-amber-100/80 font-bold border-b-2 border-amber-300 text-amber-950">
                <td className="py-2.5 px-3 text-center border-r border-amber-200">—</td>
                <td className="py-2.5 px-4 border-r border-amber-200 font-black">
                  TỔNG CỘNG ({wallets.length} VÍ)
                </td>
                <td className="py-2.5 px-4 border-r border-amber-200">
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 w-full" />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right border-r border-amber-200 font-black text-rose-700 text-sm">
                  {formatVND(totalAssets)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px]">
                    KHỚP SỐ LIỆU
                  </span>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wallets.map((w, idx) => {
                const ratio = totalAssets > 0 ? Math.max(0, (w.balance / totalAssets) * 100) : 0;
                return (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <Wallet className="size-3.5 text-[#9f1239]" />
                        <span>{w.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              w.balance < 0 ? "bg-rose-500" : "bg-[#9f1239]"
                            )}
                            style={{
                              width: `${Math.min(
                                (Math.abs(w.balance) / maxBalance) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 w-10 text-right font-medium">
                          {ratio.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "py-2.5 px-4 text-right font-bold tabular-nums border-r border-slate-200",
                        w.balance < 0 ? "text-rose-600" : "text-slate-900"
                      )}
                    >
                      {formatVND(w.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 bg-rose-100 text-[#881337] rounded-md flex items-center justify-center font-bold text-xs">
              <PieChart className="size-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Cơ Cấu Chi Tiêu Theo Danh Mục — Tháng {monthLabel}
              </h3>
              <p className="text-[11px] text-slate-500">Tỷ lệ các khoản chi phát sinh trong kỳ</p>
            </div>
          </div>
          <div className="pt-2">
            <ExpenseDonut
              data={byCategory.map((s) => ({ name: s.name, amount: s.amount }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center font-bold text-xs">
              <BarChart3 className="size-3.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Xu Hướng Dòng Tiền Thu — Chi 6 Tháng Gần Nhất
              </h3>
              <p className="text-[11px] text-slate-500">So sánh đối soát luân chuyển dòng tiền</p>
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
