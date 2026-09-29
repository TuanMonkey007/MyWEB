"use client";

import { useState } from "react";
import { ArrowLeftRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm, type Option } from "./transaction-form";
import { TransferForm } from "./transfer-form";
import { useCan, NO_PERM } from "@/components/permissions-provider";

export function QuickAddButtons({
  wallets,
  expenseCategories,
  incomeCategories,
}: {
  wallets: Option[];
  expenseCategories: Option[];
  incomeCategories: Option[];
}) {
  const [open, setOpen] = useState<"expense" | "income" | "transfer" | null>(null);
  const close = () => setOpen(null);
  const can = useCan();
  const canCreate = can("finance", "create");

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen("expense")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-400 transition-colors disabled:opacity-50"
        >
          <Minus className="size-3.5" /> Khoản chi
        </button>
        <button
          type="button"
          onClick={() => setOpen("income")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors disabled:opacity-50"
        >
          <Plus className="size-3.5" /> Khoản thu
        </button>
        <button
          type="button"
          onClick={() => setOpen("transfer")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ArrowLeftRight className="size-3.5" /> Chuyển khoản
        </button>
      </div>

      <Dialog open={open === "expense"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm khoản chi</DialogTitle>
          </DialogHeader>
          <TransactionForm
            kind="expense"
            wallets={wallets}
            categories={expenseCategories}
            onDone={close}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={open === "income"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm khoản thu</DialogTitle>
          </DialogHeader>
          <TransactionForm
            kind="income"
            wallets={wallets}
            categories={incomeCategories}
            onDone={close}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={open === "transfer"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển khoản nội bộ</DialogTitle>
          </DialogHeader>
          <TransferForm wallets={wallets} onDone={close} />
        </DialogContent>
      </Dialog>
    </>
  );
}
