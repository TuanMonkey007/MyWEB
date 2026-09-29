"use client";

import { formatVND } from "@/lib/format";
import type { GroupStats } from "@/lib/procurement";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function remainingColor(remaining: number, total: number): string {
  if (total <= 0) return "text-muted-foreground";
  const ratio = remaining / total;
  if (remaining < 0) return "text-destructive font-black";
  if (ratio < 0.1) return "text-destructive font-bold";
  if (ratio < 0.25) return "text-[#E65100] font-bold";
  return "text-emerald-700 dark:text-emerald-400 font-bold";
}

function UsageBar({ spent, pending, total }: { spent: number; pending: number; total: number }) {
  if (total <= 0) return null;
  const spentPct = Math.min((spent / total) * 100, 100);
  const pendingPct = Math.min((pending / total) * 100, 100 - spentPct);
  return (
    <div className="h-2.5 w-full min-w-24 overflow-hidden rounded-none bg-stone-200 border border-[#1C1917] dark:bg-stone-800">
      <div className="flex h-full">
        <div className="h-full bg-[#F25C2B]" style={{ width: `${spentPct}%` }} />
        <div className="h-full bg-amber-500" style={{ width: `${pendingPct}%` }} />
      </div>
    </div>
  );
}

export function BudgetOverviewTable({ groups }: { groups: GroupStats[] }) {
  return (
    <div className="overflow-x-auto rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
      <Table className="border-0 shadow-none">
        <TableHeader>
          <TableRow className="border-b-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#2C1F15]">
            <TableHead className="min-w-64 py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Khoản mục / Quỹ
            </TableHead>
            <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Tổng quỹ
            </TableHead>
            <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Đã chi (VAT)
            </TableHead>
            <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Chờ mua
            </TableHead>
            <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Còn lại
            </TableHead>
            <TableHead className="w-32 py-2.5 px-3.5 text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">
              Mức dùng
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y-2 divide-border/60">
          {groups.map((g) => (
            <Group key={g.id} group={g} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Group({ group: g }: { group: GroupStats }) {
  const selfOnly = g.funds.length === 1 && g.funds[0].name === g.name;
  return (
    <>
      <TableRow className="bg-[#FAF7F0] hover:bg-[#F3ECE2] border-b-2 border-[#1C1917] font-black text-foreground dark:bg-[#22170F] dark:hover:bg-[#2C1F15] transition-colors">
        <TableCell className="py-2.5 px-3.5 font-bold text-foreground border-r-2 border-[#1C1917]">
          {g.code}. {g.name}
        </TableCell>
        <TableCell className="text-right font-black tabular-nums py-2.5 px-3.5 border-r-2 border-[#1C1917]">
          {formatVND(g.total)}
        </TableCell>
        <TableCell className="text-right font-black tabular-nums py-2.5 px-3.5 border-r-2 border-[#1C1917]">
          {formatVND(g.spent)}
        </TableCell>
        <TableCell className="text-right font-black tabular-nums py-2.5 px-3.5 border-r-2 border-[#1C1917]">
          {g.pending > 0 ? formatVND(g.pending) : "—"}
        </TableCell>
        <TableCell
          className={cn(
            "text-right font-black tabular-nums py-2.5 px-3.5 border-r-2 border-[#1C1917]",
            remainingColor(g.remaining, g.total)
          )}
        >
          {formatVND(g.remaining)}
        </TableCell>
        <TableCell className="py-2.5 px-3.5">
          <UsageBar spent={g.spent} pending={g.pending} total={g.total} />
        </TableCell>
      </TableRow>
      {!selfOnly &&
        g.funds.map((f) => (
          <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
            <TableCell className="py-2 px-3.5 pl-8 text-xs font-semibold text-muted-foreground border-r-2 border-[#1C1917]">
              {f.name}
            </TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3.5 text-xs font-semibold border-r-2 border-[#1C1917]">
              {formatVND(f.total)}
            </TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3.5 text-xs font-semibold border-r-2 border-[#1C1917]">
              {f.spent > 0 ? formatVND(f.spent) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3.5 text-xs font-semibold border-r-2 border-[#1C1917]">
              {f.pending > 0 ? formatVND(f.pending) : "—"}
            </TableCell>
            <TableCell
              className={cn("text-right tabular-nums py-2 px-3.5 text-xs font-bold border-r-2 border-[#1C1917]", remainingColor(f.remaining, f.total))}
            >
              {formatVND(f.remaining)}
            </TableCell>
            <TableCell className="py-2 px-3.5">
              <UsageBar spent={f.spent} pending={f.pending} total={f.total} />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
