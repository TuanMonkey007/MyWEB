"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export type DmsImeiView = {
  baseUrl: string;
  username: string | null;
  hasPassword: boolean;
  masked: string | null;
  broken: string[];
  missing: string[];
};

export function DmsImeiConfigCard({ config }: { config: DmsImeiView }) {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [username, setUsername] = useState(config.username ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/dms-imei", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lưu thất bại");
      toast.success("Đã lưu cấu hình DMS");
      setPassword("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4" /> Tài khoản IT DMS Hữu Nghị
          {config.hasPassword ? (
            <Badge variant="secondary" className="text-[10px]">đã lưu</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">chưa có pass</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {config.broken.length > 0 && (
          <p className="text-xs font-semibold text-red-600">
            Không giải mã được ({config.broken.join(", ")}) — nhập lại mật khẩu.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="dms-base">Base URL</Label>
          <Input
            id="dms-base"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://huunghiv2.dmsone.vn"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dms-user">Tên đăng nhập</Label>
          <Input
            id="dms-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tuannm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dms-pass">Mật khẩu (để trống = giữ nguyên)</Label>
          <Input
            id="dms-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={config.masked ?? "dán mật khẩu vào đây"}
            autoComplete="new-password"
          />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu
        </Button>
      </CardContent>
    </Card>
  );
}
