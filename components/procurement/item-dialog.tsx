"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/money-input";
import { formatVND, toDateInputValue } from "@/lib/format";
import { AttachmentList, type AttachmentDTO } from "./attachment-list";

export type FundOption = {
  id: string;
  name: string;
  groupCode: string;
  total: number;
  remaining: number;
  remainingAfterPending: number;
};

export type ItemDTO = {
  id: string;
  name: string;
  fundId: string;
  unit: string | null;
  quantity: number;
  specs: string | null;
  reason: string | null;
  status: string;
  proposedAmount: number;
  actualAmount: number | null;
  purchasedAt: string | null;
  notes: string | null;
  attachments: AttachmentDTO[];
};

// Form hạng mục đề xuất: chọn quỹ thấy ngay số còn lại để cân đối trước khi trình
export function ItemDialog({
  open,
  onClose,
  proposalId,
  item,
  fundOptions,
}: {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  item: ItemDTO | null;
  fundOptions: FundOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [fundId, setFundId] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [specs, setSpecs] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [proposedAmount, setProposedAmount] = useState(0);
  const [actualAmount, setActualAmount] = useState(0);
  const [purchasedAt, setPurchasedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setFundId(item?.fundId ?? "");
    setUnit(item?.unit ?? "");
    setQuantity(String(item?.quantity ?? 1));
    setSpecs(item?.specs ?? "");
    setReason(item?.reason ?? "");
    setStatus(item?.status ?? "PENDING");
    setProposedAmount(item?.proposedAmount ?? 0);
    setActualAmount(item?.actualAmount ?? 0);
    setPurchasedAt(item?.purchasedAt ? toDateInputValue(item.purchasedAt) : "");
    setNotes(item?.notes ?? "");
  }, [open, item]);

  const fund = fundOptions.find((f) => f.id === fundId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !fundId) {
      toast.error("Điền tên hạng mục và chọn quỹ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        item ? `/api/proposal-items/${item.id}` : "/api/proposal-items",
        {
          method: item ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalId,
            name,
            fundId,
            unit,
            quantity: Number(quantity) || 1,
            specs,
            reason,
            status,
            proposedAmount,
            actualAmount: status === "PURCHASED" ? actualAmount : null,
            purchasedAt:
              status === "PURCHASED" && purchasedAt
                ? new Date(`${purchasedAt}T00:00:00`).toISOString()
                : null,
            notes,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(item ? "Đã cập nhật hạng mục" : "Đã thêm hạng mục");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    const res = await fetch(`/api/proposal-items/${item.id}`, { method: "DELETE" });
    setConfirmDelete(false);
    if (res.ok) {
      toast.success("Đã xóa hạng mục");
      router.refresh();
      onClose();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{item ? "Hạng mục đề xuất" : "Thêm hạng mục"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="it-name">Nội dung mua hàng</Label>
              <Input
                id="it-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: Màn hình máy tính 24 inch"
                autoFocus={!item}
              />
            </div>

            <div className="space-y-2">
              <Label>Nguồn ngân sách (quỹ)</Label>
              <Select value={fundId} onValueChange={setFundId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn quỹ..." />
                </SelectTrigger>
                <SelectContent>
                  {fundOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.groupCode} · {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fund && (
                <p className="text-xs text-muted-foreground">
                  Tổng quỹ {formatVND(fund.total)} · còn lại{" "}
                  <span
                    className={
                      fund.remaining < 0 ? "font-medium text-red-600" : "font-medium text-emerald-700"
                    }
                  >
                    {formatVND(fund.remaining)}
                  </span>
                  {fund.remainingAfterPending !== fund.remaining && (
                    <>
                      {" "}
                      · nếu mua hết hàng chờ còn{" "}
                      <span
                        className={
                          fund.remainingAfterPending < 0
                            ? "font-medium text-red-600"
                            : "font-medium"
                        }
                      >
                        {formatVND(fund.remainingAfterPending)}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="it-qty">Số lượng</Label>
                <Input
                  id="it-qty"
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it-unit">ĐVT</Label>
                <Input
                  id="it-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Chiếc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it-proposed">Tiền đề xuất</Label>
                <MoneyInput
                  id="it-proposed"
                  value={proposedAmount}
                  onChange={setProposedAmount}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Chờ mua</SelectItem>
                    <SelectItem value="PURCHASED">Đã mua</SelectItem>
                    <SelectItem value="CANCELLED">Huỷ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {status === "PURCHASED" && (
                <div className="space-y-2">
                  <Label htmlFor="it-date">Ngày mua</Label>
                  <Input
                    id="it-date"
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                  />
                </div>
              )}
            </div>

            {status === "PURCHASED" && (
              <div className="space-y-2">
                <Label htmlFor="it-actual">Tiền mua thực tế (đã VAT)</Label>
                <MoneyInput id="it-actual" value={actualAmount} onChange={setActualAmount} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="it-specs">Yêu cầu kỹ thuật</Label>
                <Textarea
                  id="it-specs"
                  rows={2}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it-reason">Lý do đề xuất</Label>
                <Textarea
                  id="it-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="it-notes">Ghi chú</Label>
              <Input id="it-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-2">
              {item && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Đang lưu..." : item ? "Cập nhật" : "Thêm hạng mục"}
              </Button>
            </div>
          </form>

          {item && (
            <>
              <Separator />
              <AttachmentList attachments={item.attachments} itemId={item.id} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hạng mục này?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{item?.name}&quot; và các file bằng chứng đính kèm sẽ bị xóa. Không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
