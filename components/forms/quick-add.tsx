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

// Nút thêm nhanh 3 loại giao dịch — dùng ở Dashboard và trang Giao dịch
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

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen("expense")} variant="destructive" size="sm">
          <Minus className="size-4" /> Khoản chi
        </Button>
        <Button
          onClick={() => setOpen("income")}
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="size-4" /> Khoản thu
        </Button>
        <Button onClick={() => setOpen("transfer")} variant="outline" size="sm">
          <ArrowLeftRight className="size-4" /> Chuyển khoản
        </Button>
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
