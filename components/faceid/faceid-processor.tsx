"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  Search,
  Sparkles,
  Upload,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCan, NO_PERM } from "@/components/permissions-provider";
import { cn } from "@/lib/utils";

type Personnel = { id: string; name: string; count: number };
type Inspection = {
  token: string;
  fileName: string;
  rowCount: number;
  columns: string[];
  personnel: Personnel[];
};

const DEFAULTS = {
  dedupWindowSeconds: "30",
  shiftStart: "08:00",
  shiftEnd: "17:00",
  breakWindows: "12:00-13:00",
  exceptionWindowMinutes: "10",
};

export function FaceidProcessor() {
  const canRun = useCan()("faceid", "run");
  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "inspecting" | "ready" | "processing">("idle");
  const [dragActive, setDragActive] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);

  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [exceptionIds, setExceptionIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [cfg, setCfg] = useState(DEFAULTS);
  const [nameMode, setNameMode] = useState<"same" | "custom">("custom");
  const [customName, setCustomName] = useState("");

  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{ token: string; fileName: string } | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  function baseName(fn: string) {
    return fn.replace(/\.[^.]+$/, "");
  }

  async function inspect(file: File) {
    setPhase("inspecting");
    setInspection(null);
    setResult(null);
    setLogs([]);
    setExcludeIds(new Set());
    setExceptionIds(new Set());
    try {
      const res = await fetch(
        `/api/faceid/inspect?name=${encodeURIComponent(file.name)}`,
        { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Đọc file thất bại");
      setInspection(data);
      setCustomName(`${baseName(file.name)}_da_xu_ly.xlsx`);
      setNameMode("custom");
      setPhase("ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đọc file thất bại");
      setPhase("idle");
    }
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function process() {
    if (!inspection) return;
    setPhase("processing");
    setLogs([]);
    setResult(null);
    const outputName =
      nameMode === "same" ? `${baseName(inspection.fileName)}.xlsx` : customName;
    try {
      const res = await fetch("/api/faceid/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inspection.token,
          excludeIds: [...excludeIds],
          exceptionIds: [...exceptionIds],
          dedupWindowSeconds: Number(cfg.dedupWindowSeconds),
          shiftStart: cfg.shiftStart,
          shiftEnd: cfg.shiftEnd,
          breakWindows: cfg.breakWindows,
          exceptionWindowMinutes: Number(cfg.exceptionWindowMinutes),
          outputName,
        }),
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Xử lý thất bại");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.trim()) continue;
          const obj = JSON.parse(line);
          if (obj.log) setLogs((l) => [...l, obj.log]);
          else if (obj.error) {
            setLogs((l) => [...l, `❌ LỖI: ${obj.error}`]);
            toast.error(obj.error);
          } else if (obj.done) {
            setResult({ token: obj.resultToken, fileName: obj.fileName });
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xử lý thất bại");
    } finally {
      setPhase("ready");
    }
  }

  const filtered = inspection?.personnel.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Lọc dữ liệu FaceID</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Làm sạch dữ liệu chấm công cổng bảo vệ: lọc trùng, loại ID không cần, sửa
          giờ user ngoại lệ, phân sheet theo khung giờ.
        </p>
      </div>

      {/* Vùng kéo thả */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (canRun && e.dataTransfer.files[0]) inspect(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx,.xlsm"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) inspect(e.target.files[0]);
            e.target.value = "";
          }}
        />
        {phase === "inspecting" ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Đang đọc file...</span>
          </>
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            {canRun ? (
              <>
                <div className="text-sm">
                  Kéo thả file Excel dữ liệu gốc vào đây, hoặc{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => fileRef.current?.click()}
                  >
                    chọn file
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">.xls · .xlsx · .xlsm</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{NO_PERM}</span>
            )}
          </>
        )}
      </div>

      {inspection && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
            <FileSpreadsheet className="size-4 text-primary" />
            <span className="font-medium">{inspection.fileName}</span>
            <span className="text-muted-foreground">
              · {inspection.rowCount.toLocaleString("vi-VN")} dòng ·{" "}
              {inspection.personnel.length} nhân sự
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            {/* Chọn nhân sự */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chọn nhân sự</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Ban className="size-3.5 text-red-500" /> Loại bỏ ({excludeIds.size})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserCog className="size-3.5 text-amber-500" /> Ngoại lệ (
                    {exceptionIds.size})
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo ID hoặc tên..."
                    className="pl-8"
                  />
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-1">
                  {filtered?.map((p) => {
                    const ex = excludeIds.has(p.id);
                    const exc = exceptionIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent/50"
                      >
                        <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                          {p.id}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {p.name || <span className="text-muted-foreground">(không tên)</span>}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {p.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggle(excludeIds, setExcludeIds, p.id)}
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                            ex ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-red-500/20"
                          )}
                        >
                          Loại
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(exceptionIds, setExceptionIds, p.id)}
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                            exc ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-amber-500/20"
                          )}
                        >
                          Ngoại lệ
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tham số + xuất */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tham số & xuất file</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ca bắt đầu">
                    <Input type="time" value={cfg.shiftStart} onChange={(e) => setCfg({ ...cfg, shiftStart: e.target.value })} />
                  </Field>
                  <Field label="Ca kết thúc">
                    <Input type="time" value={cfg.shiftEnd} onChange={(e) => setCfg({ ...cfg, shiftEnd: e.target.value })} />
                  </Field>
                  <Field label="Nghỉ trưa (hh:mm-hh:mm)">
                    <Input value={cfg.breakWindows} onChange={(e) => setCfg({ ...cfg, breakWindows: e.target.value })} />
                  </Field>
                  <Field label="Cửa sổ lọc trùng (giây)">
                    <Input type="number" value={cfg.dedupWindowSeconds} onChange={(e) => setCfg({ ...cfg, dedupWindowSeconds: e.target.value })} />
                  </Field>
                  <Field label="Biên sửa giờ ngoại lệ (phút)">
                    <Input type="number" value={cfg.exceptionWindowMinutes} onChange={(e) => setCfg({ ...cfg, exceptionWindowMinutes: e.target.value })} />
                  </Field>
                </div>

                <div className="space-y-2">
                  <Label>Tên file xuất</Label>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={nameMode === "custom"} onChange={() => setNameMode("custom")} className="accent-primary" />
                      Tên mới
                    </label>
                    {nameMode === "custom" && (
                      <Input value={customName} onChange={(e) => setCustomName(e.target.value)} className="ml-6" />
                    )}
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={nameMode === "same"} onChange={() => setNameMode("same")} className="accent-primary" />
                      Giữ tên file gốc ({baseName(inspection.fileName)}.xlsx)
                    </label>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={phase === "processing" || !canRun}
                  title={canRun ? undefined : NO_PERM}
                  onClick={process}
                >
                  {phase === "processing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" /> Chạy xử lý
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Console log */}
      {(logs.length > 0 || phase === "processing") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" /> Nhật ký xử lý
            </CardTitle>
            {result && (
              <a href={`/api/faceid/result/${result.token}?name=${encodeURIComponent(result.fileName)}`}>
                <Button size="sm">
                  <Download className="size-4" /> Tải kết quả
                </Button>
              </a>
            )}
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="max-h-80 overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-100"
            >
              {logs.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {l}
                </div>
              ))}
              {phase === "processing" && !result && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Loader2 className="size-3 animate-spin" /> đang chạy...
                </div>
              )}
            </div>
            {result && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">Xong</Badge>
                <span className="min-w-0 flex-1 truncate">{result.fileName}</span>
                <a href={`/api/faceid/result/${result.token}?name=${encodeURIComponent(result.fileName)}`}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
