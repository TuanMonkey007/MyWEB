"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Paperclip } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatVND } from "@/lib/format";
import type { TransactionRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Option } from "@/components/forms/transaction-form";
import { TransactionDetailDialog } from "./transaction-detail";

const TYPE_META = {
  expense: { icon: ArrowUpRight, color: "text-rose-600 dark:text-rose-400", sign: "−" },
  income: { icon: ArrowDownLeft, color: "text-emerald-600 dark:text-emerald-400", sign: "+" },
  transfer: { icon: ArrowLeftRight, color: "text-muted-foreground", sign: "" },
} as const;

export function TransactionTable({
  rows,
  wallets,
  expenseCategories,
  incomeCategories,
}: {
  rows: TransactionRow[];
  wallets: Option[];
  expenseCategories: Option[];
  incomeCategories: Option[];
}) {
  const [selected, setSelected] = useState<TransactionRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Chưa có giao dịch nào khớp bộ lọc.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
              <TableHead className="w-28 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngày</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Giao dịch</TableHead>
              <TableHead className="hidden sm:table-cell text-xs font-bold uppercase tracking-wider text-muted-foreground">Ví</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const meta = TYPE_META[row.type];
              const Icon = meta.icon;
              return (
                <TableRow
                  key={`${row.type}-${row.id}`}
                  className="cursor-pointer hover:bg-muted/30 border-b border-border/50 transition-colors"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(row.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-3.5 shrink-0", meta.color)} />
                      <span className="font-semibold text-xs sm:text-sm text-foreground">{row.title}</span>
                      {row.imagePath && (
                        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {row.categoryName && (
                      <Badge variant="secondary" className="mt-1 text-[10px] rounded px-1.5 py-0">
                        {row.categoryName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {row.type === "transfer"
                      ? `${row.fromWalletName} → ${row.toWalletName}`
                      : row.walletName}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold text-xs sm:text-sm tabular-nums whitespace-nowrap",
                      meta.color
                    )}
                  >
                    {meta.sign}
                    {formatVND(row.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailDialog
        row={selected}
        onClose={() => setSelected(null)}
        wallets={wallets}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </>
  );
}
