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
  if (remaining < 0) return "text-destructive font-semibold";
  if (ratio < 0.1) return "text-destructive";
  if (ratio < 0.25) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function UsageBar({ spent, pending, total }: { spent: number; pending: number; total: number }) {
  if (total <= 0) return null;
  const spentPct = Math.min((spent / total) * 100, 100);
  const pendingPct = Math.min((pending / total) * 100, 100 - spentPct);
  return (
    <div className="h-1.5 w-full min-w-24 overflow-hidden rounded-full bg-muted border border-border/50">
      <div className="flex h-full">
        <div className="h-full bg-primary" style={{ width: `${spentPct}%` }} />
        <div className="h-full bg-amber-500" style={{ width: `${pendingPct}%` }} />
      </div>
    </div>
  );
}

export function BudgetOverviewTable({ groups }: { groups: GroupStats[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <TableHead className="min-w-64 py-2.5 px-3">Khoản mục / Quỹ</TableHead>
            <TableHead className="text-right py-2.5 px-3">Tổng quỹ</TableHead>
            <TableHead className="text-right py-2.5 px-3">Đã chi (VAT)</TableHead>
            <TableHead className="text-right py-2.5 px-3">Chờ mua</TableHead>
            <TableHead className="text-right py-2.5 px-3">Còn lại</TableHead>
            <TableHead className="w-32 py-2.5 px-3">Mức dùng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
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
      <TableRow className="bg-muted/40 hover:bg-muted/60 border-b border-border/60 font-semibold text-foreground transition-colors">
        <TableCell className="py-2.5 px-3 font-semibold text-foreground">
          {g.code}. {g.name}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums py-2.5 px-3">
          {formatVND(g.total)}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums py-2.5 px-3">
          {formatVND(g.spent)}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums py-2.5 px-3">
          {g.pending > 0 ? formatVND(g.pending) : "—"}
        </TableCell>
        <TableCell
          className={cn(
            "text-right font-semibold tabular-nums py-2.5 px-3",
            remainingColor(g.remaining, g.total)
          )}
        >
          {formatVND(g.remaining)}
        </TableCell>
        <TableCell className="py-2.5 px-3">
          <UsageBar spent={g.spent} pending={g.pending} total={g.total} />
        </TableCell>
      </TableRow>
      {!selfOnly &&
        g.funds.map((f) => (
          <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
            <TableCell className="py-2 px-3 pl-8 text-xs text-muted-foreground">{f.name}</TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3 text-xs">
              {formatVND(f.total)}
            </TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3 text-xs">
              {f.spent > 0 ? formatVND(f.spent) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums py-2 px-3 text-xs">
              {f.pending > 0 ? formatVND(f.pending) : "—"}
            </TableCell>
            <TableCell
              className={cn("text-right tabular-nums py-2 px-3 text-xs", remainingColor(f.remaining, f.total))}
            >
              {formatVND(f.remaining)}
            </TableCell>
            <TableCell className="py-2 px-3">
              <UsageBar spent={f.spent} pending={f.pending} total={f.total} />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
