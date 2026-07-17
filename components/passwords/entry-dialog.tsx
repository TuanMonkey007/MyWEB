"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { encryptSecret, decryptSecret, type VaultKey } from "@/lib/vault-crypto";
import { PasswordGenerator } from "./password-generator";
import type { VaultEntryMeta } from "./vault-app";

export function EntryDialog({
  open,
  onClose,
  vaultKey,
  entry,
  onSaved,
  canEdit,
}: {
  open: boolean;
  onClose: () => void;
  vaultKey: VaultKey;
  entry: VaultEntryMeta | null;
  onSaved: () => void;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [reveal, setReveal] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReveal(false);
    setShowGen(false);
    if (entry) {
      setTitle(entry.title);
      setUsername(entry.username);
      setUrl(entry.url);
      setCategory(entry.category);
      // giải mã password + notes ngay tại client
      decryptSecret<{ password: string; notes: string }>(vaultKey, entry.cipher)
        .then((s) => {
          setPassword(s.password ?? "");
          setNotes(s.notes ?? "");
        })
        .catch(() => toast.error("Không giải mã được mục này"));
    } else {
      setTitle("");
      setUsername("");
      setUrl("");
      setCategory("");
      setPassword("");
      setNotes("");
    }
  }, [open, entry, vaultKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Nhập tiêu đề");
      return;
    }
    setSaving(true);
    try {
      const cipher = await encryptSecret(vaultKey, { password, notes });
      const payload = { title, username, url, category, cipher };
      const res = await fetch(
        entry ? `/api/passwords/entries/${entry.id}` : "/api/passwords/entries",
        {
          method: entry ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Lưu thất bại");
      }
      toast.success(entry ? "Đã cập nhật" : "Đã thêm mật khẩu");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" /> {entry ? "Sửa mục" : "Thêm mật khẩu"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-title">Tiêu đề</Label>
              <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="vd: VPS Hostinger" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-cat">Nhóm</Label>
              <Input id="e-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="vd: Server, Mail..." list="vault-categories" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-user">Tên đăng nhập</Label>
            <Input id="e-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-pass">Mật khẩu</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="e-pass"
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setShowGen((v) => !v)} title="Tạo mật khẩu mạnh">
                <Wand2 className="size-4" />
              </Button>
            </div>
            {showGen && (
              <PasswordGenerator
                onUse={(pw) => {
                  setPassword(pw);
                  setReveal(true);
                  setShowGen(false);
                }}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-url">Đường dẫn</Label>
            <Input id="e-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="e-notes">Ghi chú</Label>
            <Textarea id="e-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={saving || !canEdit} title={canEdit ? undefined : "Bạn không có quyền"}>
            {saving ? "Đang lưu..." : entry ? "Cập nhật" : "Thêm"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Nút xóa dùng trong danh sách (tách ra để gọn)
export function DeleteEntryButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onConfirm}>
      <Trash2 className="size-3.5" />
    </Button>
  );
}
