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
  if (remaining < 0) return "text-red-600 font-semibold";
  if (ratio < 0.1) return "text-red-600";
  if (ratio < 0.25) return "text-amber-600";
  return "text-emerald-700";
}

function UsageBar({ spent, pending, total }: { spent: number; pending: number; total: number }) {
  if (total <= 0) return null;
  const spentPct = Math.min((spent / total) * 100, 100);
  const pendingPct = Math.min((pending / total) * 100, 100 - spentPct);
  return (
    <div className="h-1.5 w-full min-w-24 overflow-hidden rounded-full bg-muted">
      <div className="flex h-full">
        <div className="h-full bg-primary" style={{ width: `${spentPct}%` }} />
        <div className="h-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
      </div>
    </div>
  );
}

// Bảng nhóm → quỹ: Tổng / Đã chi / Chờ mua / Còn lại (tính động, đã sửa lỗi Excel)
export function BudgetOverviewTable({ groups }: { groups: GroupStats[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-64">Khoản mục / Quỹ</TableHead>
            <TableHead className="text-right">Tổng quỹ</TableHead>
            <TableHead className="text-right">Đã chi (VAT)</TableHead>
            <TableHead className="text-right">Chờ mua</TableHead>
            <TableHead className="text-right">Còn lại</TableHead>
            <TableHead className="w-32">Mức dùng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
      <TableRow className="bg-muted/60 hover:bg-muted/60">
        <TableCell className="font-semibold">
          {g.code}. {g.name}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {formatVND(g.total)}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {formatVND(g.spent)}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {g.pending > 0 ? formatVND(g.pending) : "—"}
        </TableCell>
        <TableCell
          className={cn(
            "text-right font-semibold tabular-nums",
            remainingColor(g.remaining, g.total)
          )}
        >
          {formatVND(g.remaining)}
        </TableCell>
        <TableCell>
          <UsageBar spent={g.spent} pending={g.pending} total={g.total} />
        </TableCell>
      </TableRow>
      {!selfOnly &&
        g.funds.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="pl-8 text-muted-foreground">{f.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatVND(f.total)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {f.spent > 0 ? formatVND(f.spent) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {f.pending > 0 ? formatVND(f.pending) : "—"}
            </TableCell>
            <TableCell
              className={cn("text-right tabular-nums", remainingColor(f.remaining, f.total))}
            >
              {formatVND(f.remaining)}
            </TableCell>
            <TableCell>
              <UsageBar spent={f.spent} pending={f.pending} total={f.total} />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
