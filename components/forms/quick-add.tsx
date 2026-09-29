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
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen("expense")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-[#FFEBEE] px-3.5 py-1.5 text-xs font-bold text-[#B71C1C] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-300 dark:border-white/80"
        >
          <Minus className="size-3.5 stroke-[3]" /> Khoản chi
        </button>
        <button
          type="button"
          onClick={() => setOpen("income")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-[#E8F5E9] px-3.5 py-1.5 text-xs font-bold text-[#1B5E20] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-white/80"
        >
          <Plus className="size-3.5 stroke-[3]" /> Khoản thu
        </button>
        <button
          type="button"
          onClick={() => setOpen("transfer")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-3.5 py-1.5 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 dark:bg-stone-800 dark:text-stone-200 dark:border-white/80"
        >
          <ArrowLeftRight className="size-3.5 stroke-[2.5]" /> Chuyển khoản
        </button>
      </div>

      <Dialog open={open === "expense"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md rounded-xs border-2 border-[#1C1917] bg-white p-6 shadow-neo-lg dark:bg-card">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl font-bold uppercase tracking-tight text-foreground">
              Thêm khoản chi
            </DialogTitle>
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
        <DialogContent className="sm:max-w-md rounded-xs border-2 border-[#1C1917] bg-white p-6 shadow-neo-lg dark:bg-card">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl font-bold uppercase tracking-tight text-foreground">
              Thêm khoản thu
            </DialogTitle>
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
        <DialogContent className="sm:max-w-md rounded-xs border-2 border-[#1C1917] bg-white p-6 shadow-neo-lg dark:bg-card">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl font-bold uppercase tracking-tight text-foreground">
              Chuyển khoản nội bộ
            </DialogTitle>
          </DialogHeader>
          <TransferForm wallets={wallets} onDone={close} />
        </DialogContent>
      </Dialog>
    </>
  );
}
