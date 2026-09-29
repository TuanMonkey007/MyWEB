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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-700 border border-rose-200/80 hover:bg-rose-500/20 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Minus className="size-3.5" /> Khoản chi
        </button>
        <button
          type="button"
          onClick={() => setOpen("income")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Plus className="size-3.5" /> Khoản thu
        </button>
        <button
          type="button"
          onClick={() => setOpen("transfer")}
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <ArrowLeftRight className="size-3.5" /> Chuyển khoản
        </button>
      </div>

      <Dialog open={open === "expense"} onOpenChange={(o) => !o && close()}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Thêm khoản chi</DialogTitle>\n          </DialogHeader>\n          <TransactionForm\n            kind=\"expense\"\n            wallets={wallets}\n            categories={expenseCategories}\n            onDone={close}\n          />\n        </DialogContent>\n      </Dialog>\n\n      <Dialog open={open === \"income\"} onOpenChange={(o) => !o && close()}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Thêm khoản thu</DialogTitle>\n          </DialogHeader>\n          <TransactionForm\n            kind=\"income\"\n            wallets={wallets}\n            categories={incomeCategories}\n            onDone={close}\n          />\n        </DialogContent>\n      </Dialog>\n\n      <Dialog open={open === \"transfer\"} onOpenChange={(o) => !o && close()}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Chuyển khoản nội bộ</DialogTitle>\n          </DialogHeader>\n          <TransferForm wallets={wallets} onDone={close} />\n        </DialogContent>\n      </Dialog>\n    </>\n  );\n}\n