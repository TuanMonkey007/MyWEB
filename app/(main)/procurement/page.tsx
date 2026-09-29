import Link from "next/link";
import { Suspense } from "react";
import { PiggyBank, ShoppingCart, Hourglass, CheckCircle2 } from "lucide-react";
import { getBudgetOverview, resolveBudgetYear } from "@/lib/procurement";
import { formatVND } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YearSelect } from "@/components/procurement/year-select";
import { BudgetOverviewTable } from "@/components/procurement/budget-overview-table";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const { years, selected } = await resolveBudgetYear(yearParam);

  if (!selected) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-20 text-center shadow-neo dark:bg-card">
        <PiggyBank className="size-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">
          Chưa có năm ngân sách nào. Tạo năm đầu tiên để bắt đầu.
        </p>
        <Button asChild size="sm">
          <Link href="/procurement/budget">Thiết lập ngân sách</Link>
        </Button>
      </div>
    );
  }

  const overview = await getBudgetOverview(selected.id);

  const cards = [
    { label: "Tổng ngân sách năm", value: overview.total, icon: PiggyBank, cls: "text-foreground" },
    { label: "Đã chi (VAT)", value: overview.spent, icon: CheckCircle2, cls: "text-primary font-black" },
    { label: "Chờ mua (đề xuất)", value: overview.pending, icon: Hourglass, cls: "text-[#E65100] font-black" },
    { label: "Còn lại", value: overview.remaining, icon: ShoppingCart, cls: "text-emerald-700 dark:text-emerald-400 font-black" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Ngân sách mua hàng
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            {selected.title ?? `Năm ${selected.year}`} · Còn lại = Tổng quỹ − Đã chi thực tế
          </p>
        </div>
        <Suspense>
          <YearSelect years={years.map((y) => y.year)} selectedYear={selected.year} />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, cls }) => (
          <Card key={label} className="transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <Icon className="size-4 text-[#F25C2B]" /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-editorial text-2xl font-bold tabular-nums ${cls}`}>
                {formatVND(value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BudgetOverviewTable groups={overview.groups} />
    </div>
  );
}
