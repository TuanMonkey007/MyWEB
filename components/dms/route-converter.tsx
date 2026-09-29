"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCan } from "@/components/permissions-provider";
import { cn } from "@/lib/utils";

function FileDrop({
  label,
  hint,
  file,
  onFile,
  disabled,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File) => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs">{label}</Label>}
      <input
        ref={ref}
        type="file"
        accept=".xls,.xlsx,.xlsm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-3 text-left text-sm transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {file ? (
          <>
            <FileSpreadsheet className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">đổi file</span>
          </>
        ) : (
          <>
            <Upload className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{hint}</span>
          </>
        )}
      </button>
    </div>
  );
}

// Khu chọn mẫu import. Mẫu đã lưu là mặc định — không phải chọn lại mỗi lần.
function TemplateSlot({
  savedTemplate,
  isAdmin,
  oneOff,
  setOneOff,
  disabled,
}: {
  savedTemplate: string | null;
  isAdmin: boolean;
  oneOff: File | null;
  setOneOff: (f: File | null) => void;
  disabled: boolean;
}) {
  const router = useRouter();
  const saveRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function saveAsDefault(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/settings/dms-template", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lưu mẫu thất bại");
      setOneOff(null);
      toast.success(`Đã lưu mẫu: ${data.fileName}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu mẫu thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function removeDefault() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings/dms-template", { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa mẫu thất bại");
      toast.success("Đã xóa mẫu đã lưu");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa mẫu thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">2. Mẫu import (định dạng đích)</Label>

      {savedTemplate && !oneOff ? (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
            <FileSpreadsheet className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate font-medium">{savedTemplate}</span>
            <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
              mẫu đã lưu
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => saveRef.current?.click()}
              className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
            >
              dùng file khác cho lần này
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveRef.current?.click()}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Save className="size-3" /> đổi mẫu đã lưu
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={removeDefault}
                  className="flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-3" /> xóa
                </button>
              </>
            )}
          </div>
          {/* Cùng một input: chọn xong thì hỏi dùng tạm hay lưu luôn */}
          <input
            ref={saveRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setOneOff(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </>
      ) : (
        <>
          <FileDrop
            label=""
            hint={savedTemplate ? "Chọn file dùng riêng lần này (.xlsx)" : "Kéo thả hoặc chọn (.xlsx)"}
            file={oneOff}
            onFile={setOneOff}
            disabled={disabled}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {isAdmin && oneOff && (
              <button
                type="button"
                disabled={busy}
                onClick={() => saveAsDefault(oneOff)}
                className="flex items-center gap-1 text-primary underline-offset-2 hover:underline disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                lưu làm mẫu mặc định (lần sau khỏi chọn lại)
              </button>
            )}
            {savedTemplate && (
              <button
                type="button"
                onClick={() => setOneOff(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                quay lại mẫu đã lưu ({savedTemplate})
              </button>
            )}
            {!savedTemplate && !isAdmin && (
              <span className="text-muted-foreground">
                Chưa có mẫu lưu sẵn — nhờ quản trị viên lưu để lần sau khỏi chọn lại.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function RouteConverter({
  savedTemplate,
  isAdmin,
}: {
  savedTemplate: string | null;
  isAdmin: boolean;
}) {
  const canRun = useCan()("dms", "run");
  const logRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [unitCode, setUnitCode] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{ token: string; fileName: string; rowCount: number } | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  async function run() {
    if (!source) return toast.error("Chọn file dữ liệu tuyến gốc");
    if (!template && !savedTemplate) return toast.error("Chưa có mẫu import — chọn hoặc lưu mẫu trước");
    if (!unitCode.trim()) return toast.error("Nhập mã đơn vị NPP mới");

    setRunning(true);
    setLogs([]);
    setResult(null);
    try {
      const form = new FormData();
      form.append("source", source);
      // Không gửi template → máy chủ dùng mẫu đã lưu
      if (template) form.append("template", template);
      form.append("unitCode", unitCode.trim());
      const res = await fetch("/api/dms/routes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Xử lý thất bại");
      setLogs(data.logs ?? []);
      setResult({ token: data.resultToken, fileName: data.fileName, rowCount: data.rowCount });
      toast.success(`Đã tạo ${data.rowCount} dòng`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xử lý thất bại");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          <ArrowRightLeft className="size-5 text-primary" /> Chuyển tuyến giữa nhà phân phối
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Đổi dữ liệu tuyến từ NPP A sang file import cho NPP B: cập nhật mã đơn vị,
          sinh mã tuyến mới (ngày + mã NVBH), từ ngày = ngày mai, giữ nguyên định dạng mẫu.
          Mẫu import lưu một lần, những lần sau chỉ cần chọn file gốc.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đầu vào</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDrop
              label="1. File dữ liệu tuyến gốc (NPP A)"
              hint="Kéo thả hoặc chọn (.xls / .xlsx)"
              file={source}
              onFile={setSource}
              disabled={!canRun}
            />
            <TemplateSlot
              savedTemplate={savedTemplate}
              isAdmin={isAdmin}
              oneOff={template}
              setOneOff={setTemplate}
              disabled={!canRun}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs">
                3. Mã đơn vị NPP mới (NPP B)
              </Label>
              <Input
                id="unit"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                placeholder="vd: HU02"
                disabled={!canRun}
              />
            </div>
            <Button onClick={run} disabled={running || !canRun} title={canRun ? undefined : "Bạn không có quyền"}>
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Play className="size-4" /> Chạy chuyển đổi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(logs.length > 0 || running) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" /> Nhật ký xử lý
            </CardTitle>
            {result && (
              <a href={`/api/dms/routes/result/${result.token}?name=${encodeURIComponent(result.fileName)}`}>
                <Button size="sm">
                  <Download className="size-4" /> Tải kết quả
                </Button>
              </a>
            )}
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="max-h-96 overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100"
            >
              {logs.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {l}
                </div>
              ))}
              {running && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Loader2 className="size-3 animate-spin" /> đang chạy...
                </div>
              )}
            </div>
            {result && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">Xong · {result.rowCount} dòng</Badge>
                <span className="min-w-0 flex-1 truncate">{result.fileName}</span>
                <a href={`/api/dms/routes/result/${result.token}?name=${encodeURIComponent(result.fileName)}`}>
                  <Button size="sm" variant="outline">
                    <Download className="size-4" /> Tải xuống
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
