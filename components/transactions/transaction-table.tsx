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
  expense: { icon: ArrowUpRight, color: "text-red-600", sign: "−" },
  income: { icon: ArrowDownLeft, color: "text-emerald-600", sign: "+" },
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
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        Chưa có giao dịch nào khớp bộ lọc.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Ngày</TableHead>
              <TableHead>Giao dịch</TableHead>
              <TableHead className="hidden sm:table-cell">Ví</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const meta = TYPE_META[row.type];
              const Icon = meta.icon;
              return (
                <TableRow
                  key={`${row.type}-${row.id}`}
                  className="cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-4 shrink-0", meta.color)} />
                      <span className="font-medium">{row.title}</span>
                      {row.imagePath && (
                        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {row.categoryName && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {row.categoryName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {row.type === "transfer"
                      ? `${row.fromWalletName} → ${row.toWalletName}`
                      : row.walletName}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums whitespace-nowrap",
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
