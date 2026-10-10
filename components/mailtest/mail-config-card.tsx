"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, Loader2, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DRIVERS,
  DRIVER_FIELDS,
  DRIVER_LABELS,
  FIELD_META,
  type DriverName,
  type MailField,
} from "@/lib/mail/constants";

export type MailConfigView = {
  driver: DriverName;
  values: Record<string, string | null>;
  hasSecret: Record<string, boolean>;
  sources: Partial<Record<string, "db" | "env">>;
  broken: string[];
  missing: string[];
};

// Nhãn cho biết giá trị đang lấy từ đâu — giúp hiểu vì sao sửa .env mà không đổi
function SourceTag({ source }: { source?: "db" | "env" }) {
  if (!source) return null;
  return (
    <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs font-normal">
      {source === "db" ? "đã lưu" : ".env"}
    </Badge>
  );
}

export function MailConfigCard({ config }: { config: MailConfigView }) {
  const router = useRouter();
  const [driver, setDriver] = useState<DriverName>(config.driver);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Trường đang sửa thì lấy giá trị đang gõ, chưa sửa thì lấy giá trị hiện tại.
  // Riêng bí mật: ô luôn để trống, chỉ hiện bản che ở placeholder.
  function valueOf(field: MailField): string {
    if (field in edits) return edits[field];
    if (FIELD_META[field].secret) return "";
    return config.values[field] ?? "";
  }

  function setField(field: MailField, v: string) {
    setEdits((p) => ({ ...p, [field]: v }));
  }

  function placeholderOf(field: MailField): string {
    const meta = FIELD_META[field];
    if (meta.secret && config.hasSecret[field]) return config.values[field] ?? "";
    if (meta.secret) return meta.placeholder ?? "dán key vào đây";
    return meta.placeholder ?? "";
  }

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, string> = { ...edits, driver };
      const res = await fetch("/api/settings/mail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lưu thất bại");
      setEdits({});
      toast.success("Đã lưu cấu hình mail");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  const fields: MailField[] = ["from", "replyTo", ...DRIVER_FIELDS[driver]];
  const dirty = Object.keys(edits).length > 0 || driver !== config.driver;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="size-4" /> Cấu hình mail
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            chỉ quản trị viên
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.broken.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <span>
              Không giải mã được:{" "}
              <b>{config.broken.map((f) => FIELD_META[f as MailField].label).join(", ")}</b>.
              Khóa chủ đã đổi (APP_SECRET hoặc file .app-secret) — nhập lại key rồi lưu.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">
            Nhà cung cấp
            <SourceTag source={config.sources.driver} />
          </Label>
          <Select value={driver} onValueChange={(v) => setDriver(v as DriverName)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRIVERS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DRIVER_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fields.map((field) => {
          const meta = FIELD_META[field];
          return (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`mail-${field}`} className="text-xs">
                {meta.secret && <KeyRound className="mr-1 inline size-3" />}
                {meta.label}
                <SourceTag source={config.sources[field]} />
              </Label>
              <Input
                id={`mail-${field}`}
                value={valueOf(field)}
                onChange={(e) => setField(field, e.target.value)}
                placeholder={placeholderOf(field)}
                type={meta.secret ? "password" : "text"}
                autoComplete="off"
                className={meta.secret ? "font-mono" : undefined}
              />
              {meta.hint && <p className="text-xs text-muted-foreground">{meta.hint}</p>}
              {meta.secret && config.hasSecret[field] && (
                <p className="text-xs text-muted-foreground">
                  Đã có key — để trống nếu giữ nguyên, gõ key mới để thay.
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="size-4" /> Lưu cấu hình
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Lưu vào database, có hiệu lực ngay — không cần sửa .env hay khởi động lại.
            Key được mã hóa trước khi lưu.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
