"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  Smartphone,
  Unlock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Staff = {
  staffId: number;
  shopId: number;
  staffCode: string;
  staffName: string;
  imei: string;
};

type Attempt = {
  at: string;
  code: string;
  ok: boolean;
  detail: string;
};

export function ImeiManager() {
  const [code, setCode] = useState("");
  const [staff, setStaff] = useState<Staff | null>(null);
  const [looking, setLooking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [unlock, setUnlock] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  function log(entry: Attempt) {
    setAttempts((prev) => [entry, ...prev].slice(0, 20));
  }

  async function lookup() {
    const c = code.trim();
    if (!c) return toast.error("Nhập mã nhân viên");
    setLooking(true);
    setStaff(null);
    try {
      const res = await fetch("/api/dms-imei/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Tra cứu thất bại");
      setStaff(data.staff as Staff);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tra cứu thất bại");
    } finally {
      setLooking(false);
    }
  }

  async function reset() {
    if (!staff) return;
    if (!confirm(`Clear IMEI của ${staff.staffCode} - ${staff.staffName}?`)) return;
    setResetting(true);
    const at = new Date().toLocaleTimeString("vi-VN");
    try {
      const res = await fetch("/api/dms-imei/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: staff.staffCode, unlock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Reset thất bại");
      setStaff((s) => (s ? { ...s, imei: data.imeiAfter as string } : s));
      log({
        at,
        code: `${data.staffCode} - ${data.staffName}`,
        ok: true,
        detail: `IMEI '${data.imeiBefore}' → '${data.imeiAfter}'${data.unlocked ? " + mở khóa app" : ""}`,
      });
      toast.success("Clear IMEI xong");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reset thất bại";
      log({ at, code: staff.staffCode, ok: false, detail: msg });
      toast.error(msg);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="size-4" /> Reset IMEI tablet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="imei-code">Mã nhân viên</Label>
              <Input
                id="imei-code"
                placeholder="VD: GS43"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={lookup} disabled={looking || !code.trim()}>
                {looking ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Tra cứu
              </Button>
            </div>
          </div>

          {staff && (
            <div className="rounded-sm border p-3 text-sm">
              <div className="font-bold">
                {staff.staffCode} — {staff.staffName}
              </div>
              <div className="mt-1 text-muted-foreground">
                IMEI hiện tại:{" "}
                <code className="font-mono font-bold text-foreground">
                  {staff.imei || "(trống — user đăng nhập máy mới được)"}
                </code>
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={unlock}
                  onChange={(e) => setUnlock(e.target.checked)}
                  className="size-4"
                />
                <Unlock className="size-4" /> Mở khóa app luôn sau khi clear
              </label>
              <Button
                className="mt-2"
                variant="destructive"
                onClick={reset}
                disabled={resetting}
              >
                {resetting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Clear IMEI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nhật ký ({attempts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attempts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {a.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <div>
                  <span className="text-xs text-muted-foreground">{a.at}</span>{" "}
                  <b>{a.code}</b>
                  <div className="text-muted-foreground">{a.detail}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
