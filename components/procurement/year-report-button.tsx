"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCan, NO_PERM } from "@/components/permissions-provider";

// Tải báo cáo theo dõi chi tiêu cả năm (Excel 3 sheet)
export function YearReportButton({ budgetYearId }: { budgetYearId: string }) {
  const canExport = useCan()("procurement", "export");
  if (!canExport) {
    return (
      <Button size="sm" variant="outline" disabled title={NO_PERM}>
        <FileSpreadsheet className="size-4" /> Xuất báo cáo năm
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" asChild>
      <a href={`/api/budget-years/${budgetYearId}/export`} title="Excel: tổng hợp quỹ, chi tiết từng đợt, chi tiêu theo tháng">
        <FileSpreadsheet className="size-4" /> Xuất báo cáo năm
      </a>
    </Button>
  );
}
