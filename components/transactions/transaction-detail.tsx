"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatVND } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS, type TransactionRow } from "@/lib/types";
import { TransactionForm, type Option } from "@/components/forms/transaction-form";
import { TransferForm } from "@/components/forms/transfer-form";
import { useCan, NO_PERM } from "@/components/permissions-provider";

const ENDPOINTS = {
  expense: "/api/expenses",
  income: "/api/incomes",
  transfer: "/api/transfers",
} as const;

// FR-5/FR-6: chi tiết giao dịch — xem ảnh hóa đơn, sửa (kèm thay/gỡ ảnh), xóa
export function TransactionDetailDialog({
  row,
  onClose,
  wallets,
  expenseCategories,
  incomeCategories,
}: {
  row: TransactionRow | null;
  onClose: () => void;
  wallets: Option[];
  expenseCategories: Option[];
  incomeCategories: Option[];
}) {
  const router = useRouter();
  const can = useCan();
  const canEdit = can("finance", "edit");
  const canDelete = can("finance", "delete");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (row) setEditing(false);
  }, [row]);

  async function handleDelete() {
    if (!row) return;
    setDeleting(true);
    const res = await fetch(`${ENDPOINTS[row.type]}/${row.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setConfirmDelete(false);
    if (res.ok) {
      toast.success("Đã xóa giao dịch");
      router.refresh();
      onClose();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
  }

  if (!row) return null;

  return (
    <>
      <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa giao dịch" : TRANSACTION_TYPE_LABELS[row.type]}
            </DialogTitle>
          </DialogHeader>

          {editing ? (
            row.type === "transfer" ? (
              <TransferForm
                wallets={wallets}
                existing={{
                  id: row.id,
                  title: row.title,
                  amount: row.amount,
                  fromWalletId: row.fromWalletId!,
                  toWalletId: row.toWalletId!,
                  occurredAt: row.occurredAt,
                  imagePath: row.imagePath,
                }}
                onDone={onClose}
              />
            ) : (
              <TransactionForm
                kind={row.type}
                wallets={wallets}
                categories={row.type === "expense" ? expenseCategories : incomeCategories}
                existing={{
                  id: row.id,
                  title: row.title,
                  amount: row.amount,
                  categoryId: row.categoryId!,
                  walletId: row.walletId!,
                  occurredAt: row.occurredAt,
                  imagePath: row.imagePath,
                }}
                onDone={onClose}
              />
            )
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-lg font-semibold">{row.title}</div>
                <div className="text-2xl font-semibold tabular-nums">
                  {formatVND(row.amount)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Ngày</div>
                <div>{formatDate(row.occurredAt)}</div>
                {row.categoryName && (
                  <>
                    <div className="text-muted-foreground">Danh mục</div>
                    <div>
                      <Badge variant="secondary">{row.categoryName}</Badge>
                    </div>
                  </>
                )}
                {row.type === "transfer" ? (
                  <>
                    <div className="text-muted-foreground">Từ ví</div>
                    <div>{row.fromWalletName}</div>
                    <div className="text-muted-foreground">Đến ví</div>
                    <div>{row.toWalletName}</div>
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground">Ví</div>
                    <div>{row.walletName}</div>
                  </>
                )}
              </div>

              {row.imagePath && (
                <a
                  href={`/api/images/${row.imagePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                  title="Mở ảnh gốc"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${row.imagePath}`}
                    alt="Ảnh hóa đơn"
                    className="max-h-64 w-auto rounded-md border object-contain"
                  />
                </a>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!canEdit}
                  title={canEdit ? undefined : NO_PERM}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={!canDelete}
                  title={canDelete ? undefined : NO_PERM}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> Xóa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giao dịch này?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{row.title}&quot; — {formatVND(row.amount)}. Ảnh đính kèm (nếu có)
              cũng bị xóa. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
