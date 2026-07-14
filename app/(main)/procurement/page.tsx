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
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <PiggyBank className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          Chưa có năm ngân sách nào. Tạo năm đầu tiên để bắt đầu.
        </p>
        <Button asChild>
          <Link href="/procurement/budget">Thiết lập ngân sách</Link>
        </Button>
      </div>
    );
  }

  const overview = await getBudgetOverview(selected.id);

  const cards = [
    { label: "Tổng ngân sách năm", value: overview.total, icon: PiggyBank, cls: "" },
    { label: "Đã chi (VAT)", value: overview.spent, icon: CheckCircle2, cls: "text-primary" },
    { label: "Chờ mua (đề xuất)", value: overview.pending, icon: Hourglass, cls: "text-amber-600" },
    { label: "Còn lại", value: overview.remaining, icon: ShoppingCart, cls: "text-emerald-700" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ngân sách mua hàng</h1>
          <p className="text-sm text-muted-foreground">
            {selected.title ?? `Năm ${selected.year}`} · còn lại = tổng quỹ − đã chi
            thực tế
          </p>
        </div>
        <Suspense>
          <YearSelect years={years.map((y) => y.year)} selectedYear={selected.year} />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-semibold tabular-nums ${cls}`}>
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
