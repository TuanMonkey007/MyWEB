"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/money-input";
import {
  ImageField,
  emptyImageValue,
  resolveImagePath,
  type ImageValue,
} from "@/components/image-field";
import { toDateInputValue } from "@/lib/format";
import type { Option } from "./transaction-form";

export type TransferFormExisting = {
  id: string;
  title: string | null;
  amount: number;
  fromWalletId: string;
  toWalletId: string;
  occurredAt: string;
  imagePath: string | null;
};

// FR-4: chuyển khoản nội bộ — BR-6 (nguồn ≠ đích), BR-5 (không phải thu/chi)
export function TransferForm({
  wallets,
  existing = null,
  onDone,
}: {
  wallets: Option[];
  existing?: TransferFormExisting | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [fromWalletId, setFromWalletId] = useState(existing?.fromWalletId ?? "");
  const [toWalletId, setToWalletId] = useState(existing?.toWalletId ?? "");
  const [date, setDate] = useState(toDateInputValue(existing?.occurredAt ?? new Date()));
  const [image, setImage] = useState<ImageValue>(emptyImageValue);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0 || !fromWalletId || !toWalletId) {
      toast.error("Điền đủ số tiền, ví nguồn và ví đích");
      return;
    }
    if (fromWalletId === toWalletId) {
      toast.error("Ví nguồn phải khác ví đích");
      return;
    }
    setSaving(true);
    try {
      const imagePath = await resolveImagePath(image, existing?.imagePath ?? null);
      const res = await fetch(
        existing ? `/api/transfers/${existing.id}` : "/api/transfers",
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || null,
            amount,
            fromWalletId,
            toWalletId,
            occurredAt: new Date(`${date}T00:00:00`).toISOString(),
            imagePath,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(existing ? "Đã cập nhật chuyển khoản" : "Đã lưu chuyển khoản");
      router.refresh();
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tf-title">Ghi chú (tùy chọn)</Label>
        <Input
          id="tf-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="vd: Nạp Momo"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Từ ví</Label>
          <Select value={fromWalletId} onValueChange={setFromWalletId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ví nguồn" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Đến ví</Label>
          <Select value={toWalletId} onValueChange={setToWalletId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ví đích" />
            </SelectTrigger>
            <SelectContent>
              {wallets
                .filter((w) => w.id !== fromWalletId)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tf-amount">Số tiền</Label>
          <MoneyInput id="tf-amount" value={amount} onChange={setAmount} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tf-date">Ngày</Label>
          <Input
            id="tf-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <ImageField
        value={image}
        onChange={setImage}
        existingPath={existing?.imagePath ?? null}
      />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Đang lưu..." : existing ? "Cập nhật" : "Lưu"}
      </Button>
    </form>
  );
}
