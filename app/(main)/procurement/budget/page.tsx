import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { resolveBudgetYear } from "@/lib/procurement";
import { YearSelect } from "@/components/procurement/year-select";
import {
  BudgetManager,
  NewYearButton,
} from "@/components/procurement/budget-manager";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BudgetSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const { years, selected } = await resolveBudgetYear(yearParam);

  const groups = selected
    ? await prisma.budgetGroup.findMany({
        where: { budgetYearId: selected.id },
        orderBy: { sortOrder: "asc" },
        include: {
          funds: {
            orderBy: { sortOrder: "asc" },
            include: { _count: { select: { items: true } } },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Thiết lập ngân sách
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            Năm ngân sách → Nhóm khoản mục → Quỹ chi tiết (phân bổ 12 tháng)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <Suspense>
              <YearSelect
                years={years.map((y) => y.year)}
                selectedYear={selected.year}
              />
            </Suspense>
          )}
          <NewYearButton
            currentYearId={selected?.id ?? null}
            currentYearLabel={selected ? `năm ${selected.year}` : null}
          />
        </div>
      </div>

      {!selected ? (
        <div className="rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-16 text-center text-sm font-semibold text-muted-foreground dark:bg-card">
          Chưa có năm ngân sách nào — bấm &quot;Thêm năm&quot; để bắt đầu.
        </div>
      ) : (
        <BudgetManager
          budgetYearId={selected.id}
          groups={groups.map((g) => ({
            id: g.id,
            code: g.code,
            name: g.name,
            funds: g.funds.map((f) => ({
              id: f.id,
              name: f.name,
              months: [f.m1, f.m2, f.m3, f.m4, f.m5, f.m6, f.m7, f.m8, f.m9, f.m10, f.m11, f.m12],
              notes: f.notes,
              itemCount: f._count.items,
            })),
          }))}
        />
      )}
    </div>
  );
}
