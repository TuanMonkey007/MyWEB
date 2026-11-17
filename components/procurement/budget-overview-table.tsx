"use client";

import { useState, type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
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
import { FundItemsSheet, type FundTarget } from "./fund-items-sheet";

// Dòng bấm được (chuột + bàn phím) để mở chi tiết các khoản đã đề xuất
function clickable(open: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: open,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    },
  };
}

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
  const [target, setTarget] = useState<FundTarget | null>(null);
  return (
    <>
    <p className="-mb-3 text-xs font-semibold text-muted-foreground">
      Bấm vào một nhóm hoặc quỹ để xem các khoản đã chi và đang chờ mua.
    </p>
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
            <Group key={g.id} group={g} onOpen={setTarget} />
          ))}
        </TableBody>
      </Table>
    </div>
    <FundItemsSheet target={target} onOpenChange={(open) => !open && setTarget(null)} />
    </>
  );
}

function Group({
  group: g,
  onOpen,
}: {
  group: GroupStats;
  onOpen: (t: FundTarget) => void;
}) {
  const selfOnly = g.funds.length === 1 && g.funds[0].name === g.name;
  const openGroup = () =>
    onOpen({
      title: `${g.code}. ${g.name}`,
      subtitle: selfOnly ? "Quỹ" : `Cả nhóm · ${g.funds.length} quỹ`,
      fundIds: g.funds.map((f) => f.id),
      total: g.total,
      spent: g.spent,
      pending: g.pending,
      remaining: g.remaining,
    });
  return (
    <>
      <TableRow
        {...clickable(openGroup)}
        title="Xem các khoản đã đề xuất"
        className="group/row cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F25C2B] focus-visible:-outline-offset-2 bg-[#FAF7F0] hover:bg-[#F3ECE2] border-b-2 border-[#1C1917] font-black text-foreground dark:bg-[#22170F] dark:hover:bg-[#2C1F15] transition-colors">
        <TableCell className="py-2.5 px-3.5 font-bold text-foreground border-r-2 border-[#1C1917]">
          <span className="flex items-center gap-1">
            {g.code}. {g.name}
            <ChevronRight className="size-4 shrink-0 opacity-30 transition-opacity group-hover/row:opacity-100" />
          </span>
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
          <TableRow
            key={f.id}
            {...clickable(() =>
              onOpen({
                title: f.name,
                subtitle: `Quỹ thuộc nhóm ${g.code}. ${g.name}`,
                fundIds: [f.id],
                total: f.total,
                spent: f.spent,
                pending: f.pending,
                remaining: f.remaining,
              })
            )}
            title="Xem các khoản đã đề xuất"
            className="group/row cursor-pointer hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-[#F25C2B] focus-visible:-outline-offset-2 transition-colors"
          >
            <TableCell className="py-2 px-3.5 pl-8 text-xs font-semibold text-muted-foreground border-r-2 border-[#1C1917] group-hover/row:text-foreground">
              <span className="flex items-center gap-1">
                {f.name}
                {f.itemCount > 0 && (
                  <span className="rounded-sm bg-muted px-1 text-[10px] font-black tabular-nums">
                    {f.itemCount}
                  </span>
                )}
                <ChevronRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
              </span>
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
