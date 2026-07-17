"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Lock,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createVaultKey,
  decryptSecret,
  encryptSecret,
  unlockVaultKey,
  type VaultKey,
} from "@/lib/vault-crypto";
import { useCan } from "@/components/permissions-provider";
import { cn } from "@/lib/utils";
import { EntryDialog } from "./entry-dialog";
import { ChangeMasterDialog } from "./change-master-dialog";

export type VaultEntryMeta = {
  id: string;
  title: string;
  username: string;
  url: string;
  category: string;
  cipher: string;
  updatedAt: string;
};

const AUTO_LOCK_MS = 5 * 60 * 1000;
const CLIP_CLEAR_MS = 45 * 1000;

async function copyClip(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label} — tự xóa clipboard sau 45s`);
    setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), CLIP_CLEAR_MS);
  } catch {
    toast.error("Trình duyệt chặn copy");
  }
}

function normalizeUrl(u: string) {
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function VaultApp() {
  const can = useCan();
  const canCreate = can("passwords", "create");
  const canEdit = can("passwords", "edit");
  const canDelete = can("passwords", "delete");

  const [phase, setPhase] = useState<"loading" | "setup" | "locked" | "unlocked">("loading");
  const [config, setConfig] = useState<{ salt: string; verifier: string; kdfIters: number } | null>(null);
  const [vaultKey, setVaultKey] = useState<VaultKey | null>(null);
  const [entries, setEntries] = useState<VaultEntryMeta[]>([]);
  const [search, setSearch] = useState("");
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; entry: VaultEntryMeta | null }>({ open: false, entry: null });
  const [deleting, setDeleting] = useState<VaultEntryMeta | null>(null);
  const [changeMaster, setChangeMaster] = useState(false);

  // ----- Nạp trạng thái vault -----
  useEffect(() => {
    fetch("/api/passwords/config")
      .then((r) => r.json())
      .then((d) => {
        if (!d.configured) setPhase("setup");
        else {
          setConfig({ salt: d.salt, verifier: d.verifier, kdfIters: d.kdfIters });
          setPhase("locked");
        }
      })
      .catch(() => toast.error("Không tải được kho mật khẩu"));
  }, []);

  const loadEntries = useCallback(async () => {
    const res = await fetch("/api/passwords/entries");
    if (res.ok) setEntries(await res.json());
  }, []);

  const lock = useCallback(() => {
    setVaultKey(null);
    setEntries([]);
    setSearch("");
    setPhase("locked");
  }, []);

  // ----- Tự khóa sau 5 phút không thao tác -----
  const lastActivity = useRef(Date.now());
  useEffect(() => {
    if (phase !== "unlocked") return;
    const bump = () => (lastActivity.current = Date.now());
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, bump));
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > AUTO_LOCK_MS) {
        lock();
        toast.info("Đã tự khóa kho mật khẩu do không hoạt động");
      }
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [phase, lock]);

  if (phase === "loading") {
    return <div className="py-16 text-center text-sm text-muted-foreground">Đang tải...</div>;
  }
  if (phase === "setup") {
    return (
      <SetupScreen
        onDone={(vk, cfg) => {
          setVaultKey(vk);
          setConfig(cfg);
          setPhase("unlocked");
          loadEntries();
        }}
      />
    );
  }
  if (phase === "locked" || !vaultKey) {
    return (
      <UnlockScreen
        config={config!}
        onUnlock={(vk) => {
          setVaultKey(vk);
          setPhase("unlocked");
          loadEntries();
        }}
      />
    );
  }

  // ----- Đã mở khóa -----
  const filtered = entries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q)
    );
  });
  const grouped = new Map<string, VaultEntryMeta[]>();
  for (const e of filtered) {
    const k = e.category || "Khác";
    (grouped.get(k) ?? grouped.set(k, []).get(k)!).push(e);
  }
  const categories = [...new Set(entries.map((e) => e.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="size-6 text-emerald-600" /> Kho mật khẩu
          </h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} mục · mã hóa đầu-cuối, tự khóa sau 5 phút
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!canCreate}
            title={canCreate ? undefined : "Bạn không có quyền"}
            onClick={() => setEntryDialog({ open: true, entry: null })}
          >
            <Plus className="size-4" /> Thêm
          </Button>
          <ImportExportMenu
            vaultKey={vaultKey}
            config={config!}
            entries={entries}
            canCreate={canCreate}
            onImported={loadEntries}
          />
          <Button variant="outline" size="sm" onClick={() => setChangeMaster(true)}>
            <KeyRound className="size-4" /> Đổi mật khẩu chủ
          </Button>
          <Button variant="outline" size="sm" onClick={lock}>
            <Lock className="size-4" /> Khóa
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tiêu đề, tài khoản, nhóm..." className="pl-8" />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          Chưa có mục nào. Bấm &quot;Thêm&quot; để lưu mật khẩu đầu tiên.
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cat} ({list.length})
              </h2>
              <div className="divide-y rounded-lg border">
                {list.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    vaultKey={vaultKey}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => setEntryDialog({ open: true, entry: e })}
                    onDelete={() => setDeleting(e)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <datalist id="vault-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <EntryDialog
        open={entryDialog.open}
        entry={entryDialog.entry}
        vaultKey={vaultKey}
        canEdit={entryDialog.entry ? canEdit : canCreate}
        onClose={() => setEntryDialog({ open: false, entry: null })}
        onSaved={loadEntries}
      />

      <ChangeMasterDialog
        open={changeMaster}
        onClose={() => setChangeMaster(false)}
        vaultKey={vaultKey}
        entries={entries}
        onChanged={(vk, cfg) => {
          setVaultKey(vk);
          setConfig(cfg);
          loadEntries();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa &quot;{deleting?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Mục này sẽ bị xóa vĩnh viễn. Không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                const res = await fetch(`/api/passwords/entries/${deleting.id}`, { method: "DELETE" });
                if (res.ok) {
                  toast.success("Đã xóa");
                  loadEntries();
                } else toast.error("Xóa thất bại");
                setDeleting(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===== Dòng entry =====
function EntryRow({
  entry,
  vaultKey,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  entry: VaultEntryMeta;
  vaultKey: VaultKey;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);

  async function withPassword(action: (pw: string) => void) {
    try {
      const s = await decryptSecret<{ password: string }>(vaultKey, entry.cipher);
      action(s.password ?? "");
    } catch {
      toast.error("Không giải mã được");
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{entry.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {entry.username || "—"}
          {revealed !== null && <span className="ml-2 font-mono text-foreground">{revealed || "(trống)"}</span>}
        </div>
      </div>

      {entry.username && (
        <Button variant="ghost" size="icon" className="size-8" title="Copy tài khoản" onClick={() => copyClip(entry.username, "tài khoản")}>
          <Copy className="size-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        title={revealed === null ? "Hiện mật khẩu" : "Ẩn"}
        onClick={() => (revealed === null ? withPassword((pw) => setRevealed(pw)) : setRevealed(null))}
      >
        {revealed === null ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="size-8" title="Copy mật khẩu" onClick={() => withPassword((pw) => copyClip(pw, "mật khẩu"))}>
        <KeyRound className="size-3.5" />
      </Button>
      {entry.url && (
        <a href={normalizeUrl(entry.url)} target="_blank" rel="noreferrer" title="Mở link">
          <Button variant="ghost" size="icon" className="size-8">
            <ExternalLink className="size-3.5" />
          </Button>
        </a>
      )}
      <Button variant="ghost" size="icon" className="size-8" disabled={!canEdit} title={canEdit ? "Sửa" : "Bạn không có quyền"} onClick={onEdit}>
        <Pencil className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        disabled={!canDelete}
        title={canDelete ? "Xóa" : "Bạn không có quyền"}
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

// ===== Thiết lập master lần đầu =====
function SetupScreen({
  onDone,
}: {
  onDone: (vk: VaultKey, cfg: { salt: string; verifier: string; kdfIters: number }) => void;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Mật khẩu chủ tối thiểu 8 ký tự");
    if (pw !== confirm) return toast.error("Nhập lại không khớp");
    setBusy(true);
    try {
      const { vaultKey, saltB64, verifier, kdfIters } = await createVaultKey(pw);
      const res = await fetch("/api/passwords/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salt: saltB64, verifier, kdfIters }),
      });
      if (!res.ok) throw new Error();
      onDone(vaultKey, { salt: saltB64, verifier, kdfIters });
    } catch {
      toast.error("Thiết lập thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <LockKeyhole className="size-6 text-emerald-600" />
          </div>
          <CardTitle>Tạo mật khẩu chủ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handle} className="space-y-3">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Mật khẩu chủ dùng để mã hóa toàn bộ kho, <b>khác</b> mật khẩu đăng nhập.
              Nó không được lưu ở đâu — <b>quên là mất sạch, không khôi phục được</b>.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-pw">Mật khẩu chủ (≥8 ký tự)</Label>
              <Input id="m-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-cf">Nhập lại</Label>
              <Input id="m-cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Đang tạo..." : "Tạo kho mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Mở khóa =====
function UnlockScreen({
  config,
  onUnlock,
}: {
  config: { salt: string; verifier: string; kdfIters: number };
  onUnlock: (vk: VaultKey) => void;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const vk = await unlockVaultKey(pw, config.salt, config.verifier, config.kdfIters);
      if (!vk) {
        toast.error("Mật khẩu chủ không đúng");
        setPw("");
      } else onUnlock(vk);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="size-6 text-emerald-600" />
          </div>
          <CardTitle>Kho mật khẩu đang khóa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handle} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-pw">Mật khẩu chủ</Label>
              <Input id="u-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !pw}>
              {busy ? "Đang mở..." : "Mở khóa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Import / Export =====
function ImportExportMenu({
  vaultKey,
  config,
  entries,
  canCreate,
  onImported,
}: {
  vaultKey: VaultKey;
  config: { salt: string; verifier: string; kdfIters: number };
  entries: VaultEntryMeta[];
  canCreate: boolean;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvWarn, setCsvWarn] = useState(false);
  const [importMaster, setImportMaster] = useState<{ open: boolean; payload: EncBackup | null }>({ open: false, payload: null });

  type EncBackup = {
    app: "myweb-vault";
    salt: string;
    verifier: string;
    kdfIters: number;
    entries: { title: string; username: string; url: string; category: string; cipher: string }[];
  };

  async function exportEncrypted() {
    const data: EncBackup = {
      app: "myweb-vault",
      salt: config.salt,
      verifier: config.verifier,
      kdfIters: config.kdfIters,
      entries: entries.map((e) => ({ title: e.title, username: e.username, url: e.url, category: e.category, cipher: e.cipher })),
    };
    downloadFile(JSON.stringify(data, null, 2), `khomatkhau-${dateStamp()}.mwvault.json`, "application/json");
    toast.success("Đã xuất bản sao lưu (đã mã hóa)");
  }

  async function exportCsv() {
    setCsvWarn(false);
    const rows = [["Group", "Title", "Username", "Password", "URL", "Notes"]];
    for (const e of entries) {
      const s = await decryptSecret<{ password: string; notes: string }>(vaultKey, e.cipher).catch(() => ({ password: "", notes: "" }));
      rows.push([e.category, e.title, e.username, s.password ?? "", e.url, s.notes ?? ""]);
    }
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    downloadFile("﻿" + csv, `khomatkhau-${dateStamp()}.csv`, "text/csv");
    toast.success("Đã xuất CSV (KHÔNG mã hóa) — bảo quản cẩn thận!");
  }

  async function handleFile(file: File) {
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".csv")) {
      await importCsv(text);
    } else {
      try {
        const data = JSON.parse(text) as EncBackup;
        if (data.app !== "myweb-vault" || !Array.isArray(data.entries)) throw new Error();
        setImportMaster({ open: true, payload: data });
      } catch {
        toast.error("File không đúng định dạng bản sao lưu");
      }
    }
  }

  // CSV KeePassXC: Group,Title,Username,Password,URL,Notes
  async function importCsv(text: string) {
    const rows = parseCsv(text);
    if (rows.length < 2) return toast.error("File CSV rỗng");
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    const idx = {
      title: col("title"),
      user: col("username"),
      pass: col("password"),
      url: col("url"),
      notes: col("notes"),
      group: col("group"),
    };
    if (idx.title < 0) return toast.error('CSV thiếu cột "Title"');

    const payload = [];
    for (const r of rows.slice(1)) {
      const title = r[idx.title]?.trim();
      if (!title) continue;
      const cipher = await encryptSecret(vaultKey, {
        password: idx.pass >= 0 ? r[idx.pass] ?? "" : "",
        notes: idx.notes >= 0 ? r[idx.notes] ?? "" : "",
      });
      payload.push({
        title,
        username: idx.user >= 0 ? r[idx.user] ?? "" : "",
        url: idx.url >= 0 ? r[idx.url] ?? "" : "",
        category: idx.group >= 0 ? r[idx.group] ?? "" : "",
        cipher,
      });
    }
    await uploadBulk(payload);
  }

  async function importEncrypted(master: string) {
    const data = importMaster.payload!;
    const key = await unlockVaultKey(master, data.salt, data.verifier, data.kdfIters);
    if (!key) return toast.error("Mật khẩu chủ của bản sao lưu không đúng");
    const payload = [];
    for (const e of data.entries) {
      const secret = await decryptSecret(key, e.cipher).catch(() => null);
      if (!secret) continue;
      const cipher = await encryptSecret(vaultKey, secret); // mã hóa lại bằng khóa hiện tại
      payload.push({ title: e.title, username: e.username, url: e.url, category: e.category, cipher });
    }
    setImportMaster({ open: false, payload: null });
    await uploadBulk(payload);
  }

  async function uploadBulk(payload: unknown[]) {
    if (payload.length === 0) return toast.error("Không có mục nào để nhập");
    const res = await fetch("/api/passwords/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast.success(`Đã nhập ${payload.length} mục`);
      onImported();
    } else toast.error("Nhập thất bại");
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="size-4" /> Import / Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canCreate} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Nhập từ file (.mwvault / .csv)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportEncrypted}>
            <Download className="size-4" /> Xuất bản sao lưu (mã hóa)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCsvWarn(true)}>
            <Download className="size-4" /> Xuất CSV (không mã hóa)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={csvWarn} onOpenChange={setCsvWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Xuất CSV không mã hóa</AlertDialogTitle>
            <AlertDialogDescription>
              File CSV chứa <b>mật khẩu ở dạng chữ thường</b>, ai mở cũng đọc được. Chỉ
              dùng để chuyển sang KeePassXC/trình quản lý khác, rồi <b>xóa file ngay</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={exportCsv}>
              Tôi hiểu, xuất CSV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportMasterDialog
        open={importMaster.open}
        onClose={() => setImportMaster({ open: false, payload: null })}
        onSubmit={importEncrypted}
      />
    </>
  );
}

function ImportMasterDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (master: string) => void;
}) {
  const [pw, setPw] = useState("");
  useEffect(() => {
    if (open) setPw("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mật khẩu chủ của bản sao lưu</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(pw);
          }}
          className="space-y-3"
        >
          <p className="text-xs text-muted-foreground">
            Nhập mật khẩu chủ đã dùng lúc xuất file để giải mã và nhập vào kho hiện tại.
          </p>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          <Button type="submit" className="w-full" disabled={!pw}>
            Giải mã & nhập
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== tiện ích =====
function downloadFile(content: string, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function dateStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
function csvCell(v: string) {
  const s = v ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}
