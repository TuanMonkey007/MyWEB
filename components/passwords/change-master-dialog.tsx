"use client";

import { useEffect, useState } from "react";
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
  createVaultKey,
  decryptSecret,
  encryptSecret,
  type VaultKey,
} from "@/lib/vault-crypto";
import type { VaultEntryMeta } from "./vault-app";

// Đổi mật khẩu chủ: mã hóa lại TOÀN BỘ entry bằng khóa mới rồi gửi lên server
// cùng salt/verifier mới (1 transaction). Client tự làm hết — server chỉ nhận bản mã.
export function ChangeMasterDialog({
  open,
  onClose,
  vaultKey,
  entries,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  vaultKey: VaultKey;
  entries: VaultEntryMeta[];
  onChanged: (vk: VaultKey, cfg: { salt: string; verifier: string; kdfIters: number }) => void;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPw("");
      setConfirm("");
    }
  }, [open]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Mật khẩu chủ mới tối thiểu 8 ký tự");
    if (pw !== confirm) return toast.error("Nhập lại không khớp");
    setBusy(true);
    try {
      const { vaultKey: newKey, saltB64, verifier, kdfIters } = await createVaultKey(pw);
      // giải mã bằng khóa cũ, mã hóa lại bằng khóa mới
      const reEncrypted = [];
      for (const e2 of entries) {
        const secret = await decryptSecret(vaultKey, e2.cipher);
        reEncrypted.push({ id: e2.id, cipher: await encryptSecret(newKey, secret) });
      }
      const res = await fetch("/api/passwords/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salt: saltB64, verifier, kdfIters, entries: reEncrypted }),
      });
      if (!res.ok) throw new Error();
      onChanged(newKey, { salt: saltB64, verifier, kdfIters });
      toast.success("Đã đổi mật khẩu chủ — các thiết bị khác cần mở khóa lại");
      onClose();
    } catch {
      toast.error("Đổi mật khẩu chủ thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu chủ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Toàn bộ {entries.length} mục sẽ được mã hóa lại bằng mật khẩu mới.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="cm-pw">Mật khẩu chủ mới (≥8 ký tự)</Label>
            <Input id="cm-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cm-cf">Nhập lại</Label>
            <Input id="cm-cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Đang xử lý..." : "Đổi mật khẩu chủ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
