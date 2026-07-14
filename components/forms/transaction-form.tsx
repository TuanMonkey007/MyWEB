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

export type Option = { id: string; name: string };

export type TransactionFormExisting = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  walletId: string;
  occurredAt: string;
  imagePath: string | null;
};

// Form dùng chung cho khoản chi (FR-2) và khoản thu (FR-3)
export function TransactionForm({
  kind,
  wallets,
  categories,
  existing = null,
  onDone,
}: {
  kind: "expense" | "income";
  wallets: Option[];
  categories: Option[];
  existing?: TransactionFormExisting | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [walletId, setWalletId] = useState(existing?.walletId ?? "");
  const [date, setDate] = useState(toDateInputValue(existing?.occurredAt ?? new Date()));
  const [image, setImage] = useState<ImageValue>(emptyImageValue);
  const [saving, setSaving] = useState(false);

  const endpoint = kind === "expense" ? "/api/expenses" : "/api/incomes";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || amount <= 0 || !categoryId || !walletId) {
      toast.error("Điền đủ tên, số tiền, danh mục và ví");
      return;
    }
    setSaving(true);
    try {
      const imagePath = await resolveImagePath(image, existing?.imagePath ?? null);
      const res = await fetch(existing ? `${endpoint}/${existing.id}` : endpoint, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount,
          categoryId,
          walletId,
          occurredAt: new Date(`${date}T00:00:00`).toISOString(),
          imagePath,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(existing ? "Đã cập nhật giao dịch" : "Đã lưu giao dịch");
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
        <Label htmlFor="tx-title">
          Tên {kind === "expense" ? "khoản chi" : "khoản thu"}
        </Label>
        <Input
          id="tx-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "expense" ? "vd: Ăn trưa" : "vd: Lương tháng 7"}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tx-amount">Số tiền</Label>
          <MoneyInput id="tx-amount" value={amount} onChange={setAmount} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tx-date">Ngày</Label>
          <Input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Danh mục</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{kind === "expense" ? "Ví bị trừ" : "Ví được cộng"}</Label>
          <Select value={walletId} onValueChange={setWalletId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn ví" />
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
