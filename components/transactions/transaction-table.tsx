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
  expense: { icon: ArrowUpRight, color: "text-[#F25C2B]", sign: "−" },
  income: { icon: ArrowDownLeft, color: "text-emerald-700 dark:text-emerald-400", sign: "+" },
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
      <div className="rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-16 text-center text-sm font-semibold text-muted-foreground dark:bg-card">
        Chưa có giao dịch nào khớp bộ lọc.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
        <Table className="border-0 shadow-none">
          <TableHeader>
            <TableRow className="bg-[#F5EFEB] border-b-2 border-[#1C1917] dark:bg-[#2C1F15]">
              <TableHead className="w-28 text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0] border-r-2 border-[#1C1917]">Ngày</TableHead>
              <TableHead className="text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0] border-r-2 border-[#1C1917]">Giao dịch</TableHead>
              <TableHead className="hidden sm:table-cell text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0] border-r-2 border-[#1C1917]">Ví</TableHead>
              <TableHead className="text-right text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y-2 divide-border/60">
            {rows.map((row) => {
              const meta = TYPE_META[row.type];
              const Icon = meta.icon;
              return (
                <TableRow
                  key={`${row.type}-${row.id}`}
                  className="cursor-pointer hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15] transition-colors"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground border-r-2 border-[#1C1917]">
                    {formatDate(row.occurredAt)}
                  </TableCell>
                  <TableCell className="border-r-2 border-[#1C1917]">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-3.5 shrink-0 stroke-[2.5]", meta.color)} />
                      <span className="font-bold text-xs sm:text-sm text-foreground">{row.title}</span>
                      {row.imagePath && (
                        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {row.categoryName && (
                      <Badge variant="secondary" className="mt-1 text-xs font-bold">
                        {row.categoryName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs font-semibold text-muted-foreground sm:table-cell border-r-2 border-[#1C1917]">
                    {row.type === "transfer"
                      ? `${row.fromWalletName} → ${row.toWalletName}`
                      : row.walletName}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-black text-xs sm:text-sm tabular-nums whitespace-nowrap",
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
