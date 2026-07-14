"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/money-input";
import { WALLET_TYPES, WALLET_TYPE_LABELS, type WalletType } from "@/lib/types";

export type WalletDTO = {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  balanceUSD: number | null;
  exchangeRate: number | null;
  adjustment: number;
  notes: string | null;
  url: string | null;
  balance: number;
  transactionCount: number;
};

// FR-1: form thêm/sửa ví — ví INVEST bắt buộc nhập balanceUSD + exchangeRate (BR-2)
export function WalletFormDialog({
  open,
  wallet,
  onClose,
}: {
  open: boolean;
  wallet: WalletDTO | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("CASH");
  const [initialBalance, setInitialBalance] = useState(0);
  const [balanceUSD, setBalanceUSD] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [adjustment, setAdjustment] = useState("0");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(wallet?.name ?? "");
    setType((wallet?.type as WalletType) ?? "CASH");
    setInitialBalance(wallet?.initialBalance ?? 0);
    setBalanceUSD(wallet?.balanceUSD != null ? String(wallet.balanceUSD) : "");
    setExchangeRate(wallet?.exchangeRate != null ? String(wallet.exchangeRate) : "");
    setAdjustment(String(wallet?.adjustment ?? 0));
    setNotes(wallet?.notes ?? "");
    setUrl(wallet?.url ?? "");
  }, [open, wallet]);

  const isInvest = type === "INVEST";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nhập tên ví");
      return;
    }
    if (isInvest && (balanceUSD === "" || exchangeRate === "")) {
      toast.error("Ví INVEST phải nhập số dư USD và tỷ giá");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(wallet ? `/api/wallets/${wallet.id}` : "/api/wallets", {
        method: wallet ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          initialBalance,
          balanceUSD: isInvest ? Number(balanceUSD) : null,
          exchangeRate: isInvest ? Number(exchangeRate) : null,
          adjustment: Number(adjustment) || 0,
          notes,
          url,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(wallet ? "Đã cập nhật ví" : "Đã tạo ví");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{wallet ? "Sửa ví" : "Thêm ví mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="w-name">Tên ví</Label>
              <Input
                id="w-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: BIDV"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Loại ví</Label>
              <Select value={type} onValueChange={(v) => setType(v as WalletType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WALLET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isInvest ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="w-usd">Số dư USD</Label>
                <Input
                  id="w-usd"
                  type="number"
                  step="0.01"
                  value={balanceUSD}
                  onChange={(e) => setBalanceUSD(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w-rate">Tỷ giá USD→VNĐ</Label>
                <Input
                  id="w-rate"
                  type="number"
                  step="any"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="vd: 25000"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="w-init">Số dư gốc</Label>
                <MoneyInput
                  id="w-init"
                  value={initialBalance}
                  onChange={setInitialBalance}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w-adj">Điều chỉnh (+/−)</Label>
                <Input
                  id="w-adj"
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="w-url">Link tham khảo (tùy chọn)</Label>
            <Input
              id="w-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="w-notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="w-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Đang lưu..." : wallet ? "Cập nhật" : "Tạo ví"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
