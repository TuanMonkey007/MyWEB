"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  Download,
  Folder,
  FolderPlus,
  HardDrive,
  Home,
  Loader2,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate } from "@/lib/format";
import { formatBytes } from "@/lib/drive-format";
import { cn } from "@/lib/utils";
import { fileIconFor } from "./file-icon";
import { useCan, NO_PERM } from "@/components/permissions-provider";

type FolderRow = { id: string; name: string; childCount: number };
type FileRow = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
};
type Stats = {
  fileCount: number;
  logicalSize: number;
  physicalSize: number;
  savedByDedup: number;
};
type Uploading = { name: string; progress: number };

export function DriveBrowser({
  currentFolderId,
  breadcrumb,
  folders,
  files,
  stats,
}: {
  currentFolderId: string | null;
  breadcrumb: { id: string; name: string }[];
  folders: FolderRow[];
  files: FileRow[];
  stats: Stats;
  allFolders: { id: string; name: string }[];
}) {
  const router = useRouter();
  const can = useCan();
  const canCreate = can("drive", "create");
  const canEdit = can("drive", "edit");
  const canDelete = can("drive", "delete");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Uploading[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [rename, setRename] = useState<
    { kind: "folder" | "file"; id: string; name: string } | null
  >(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<
    { kind: "folder" | "file"; id: string; name: string } | null
  >(null);

  // Upload từng file bằng XHR để có tiến độ; gửi raw body (streaming phía server)
  function uploadFile(file: File): Promise<void> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const q = new URLSearchParams({ name: file.name });
      if (currentFolderId) q.set("folderId", currentFolderId);
      xhr.open("POST", `/api/drive/files?${q.toString()}`);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream"
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads((us) =>
            us.map((u) => (u.name === file.name ? { ...u, progress } : u))
          );
        }
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          const err = JSON.parse(xhr.responseText || "{}")?.error;
          toast.error(`"${file.name}": ${err ?? "tải lên thất bại"}`);
        }
        resolve();
      };
      xhr.onerror = () => {
        toast.error(`"${file.name}": lỗi kết nối`);
        resolve();
      };
      xhr.send(file);
    });
  }

  async function handleUpload(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    setUploads(arr.map((f) => ({ name: f.name, progress: 0 })));
    for (const f of arr) await uploadFile(f);
    setUploads([]);
    toast.success(`Đã tải lên ${arr.length} file`);
    router.refresh();
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const res = await fetch("/api/drive/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: currentFolderId }),
    });
    if (res.ok) {
      toast.success("Đã tạo thư mục");
      setNewFolderOpen(false);
      setNewFolderName("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Tạo thất bại");
    }
  }

  async function doRename() {
    if (!rename) return;
    const url =
      rename.kind === "folder"
        ? `/api/drive/folders/${rename.id}`
        : `/api/drive/files/${rename.id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      toast.success("Đã đổi tên");
      setRename(null);
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Đổi tên thất bại");
    }
  }

  async function doDelete() {
    if (!deleting) return;
    const url =
      deleting.kind === "folder"
        ? `/api/drive/folders/${deleting.id}`
        : `/api/drive/files/${deleting.id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast.error(d?.error ?? "Xóa thất bại");
    }
    setDeleting(null);
  }

  const empty = folders.length === 0 && files.length === 0;

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (canCreate && e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kho file</h1>
          <p className="text-sm text-muted-foreground">
            Lưu trữ chống trùng lặp — file giống hệt chỉ tốn dung lượng một lần.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canCreate}
            title={canCreate ? undefined : NO_PERM}
            onClick={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="size-4" /> Thư mục mới
          </Button>
          <Button
            size="sm"
            disabled={!canCreate}
            title={canCreate ? undefined : NO_PERM}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" /> Tải file lên
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Thẻ thống kê dung lượng */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={HardDrive}
          label="Dung lượng thực dùng"
          value={formatBytes(stats.physicalSize)}
          sub={`${stats.fileCount} file`}
        />
        <StatCard
          icon={Folder}
          label="Tổng kích thước file"
          value={formatBytes(stats.logicalSize)}
          sub="nếu không nén trùng"
        />
        <StatCard
          icon={Sparkles}
          label="Tiết kiệm nhờ chống trùng"
          value={formatBytes(stats.savedByDedup)}
          sub={
            stats.logicalSize > 0
              ? `${Math.round((stats.savedByDedup / stats.logicalSize) * 100)}% dung lượng`
              : "—"
          }
          highlight
        />
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <Link
          href="/drive"
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent",
            !currentFolderId && "font-medium"
          )}
        >
          <Home className="size-4" /> Kho file
        </Link>
        {breadcrumb.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <Link
              href={`/drive?folder=${b.id}`}
              className={cn(
                "rounded px-1.5 py-0.5 hover:bg-accent",
                b.id === currentFolderId && "font-medium"
              )}
            >
              {b.name}
            </Link>
          </span>
        ))}
      </div>

      {uploads.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-3">
            {uploads.map((u) => (
              <div key={u.name} className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                  <span className="min-w-0 flex-1 truncate">{u.name}</span>
                  <span className="tabular-nums text-muted-foreground">{u.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nội dung thư mục */}
      <div
        className={cn(
          "rounded-lg border transition-colors",
          dragActive && "border-primary bg-primary/5"
        )}
      >
        {empty ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Thư mục trống. Kéo thả file vào đây hoặc bấm &quot;Tải file lên&quot;.
          </div>
        ) : (
          <ul className="divide-y">
            {folders.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40"
              >
                <Link
                  href={`/drive?folder=${f.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Folder className="size-5 shrink-0 fill-amber-400/20 text-amber-500" />
                  <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {f.childCount} mục
                  </span>
                </Link>
                <RowMenu
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onRename={() => {
                    setRename({ kind: "folder", id: f.id, name: f.name });
                    setRenameValue(f.name);
                  }}
                  onDelete={() => setDeleting({ kind: "folder", id: f.id, name: f.name })}
                />
              </li>
            ))}
            {files.map((f) => {
              const { Icon, color } = fileIconFor(f.mimeType);
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40"
                >
                  <a
                    href={`/api/drive/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Icon className={cn("size-5 shrink-0", color)} />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {formatDate(f.createdAt)}
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatBytes(f.size)}
                    </span>
                  </a>
                  <a href={`/api/drive/files/${f.id}?download=1`} title="Tải xuống">
                    <Button variant="ghost" size="icon" className="size-8">
                      <Download className="size-4" />
                    </Button>
                  </a>
                  <RowMenu
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onRename={() => {
                      setRename({ kind: "file", id: f.id, name: f.name });
                      setRenameValue(f.name);
                    }}
                    onDelete={() => setDeleting({ kind: "file", id: f.id, name: f.name })}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Dialog tạo thư mục */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thư mục mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nf-name">Tên thư mục</Label>
            <Input
              id="nf-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Hủy
            </Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog đổi tên */}
      <Dialog open={!!rename} onOpenChange={(o) => !o && setRename(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi tên</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRename(null)}>
              Hủy
            </Button>
            <Button onClick={doRename} disabled={!renameValue.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận xóa */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa {deleting?.kind === "folder" ? "thư mục" : "file"} &quot;{deleting?.name}
              &quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.kind === "folder"
                ? "Toàn bộ thư mục con và file bên trong sẽ bị xóa."
                : "File sẽ bị xóa."}{" "}
              Nếu không còn bản sao nào trùng nội dung, dữ liệu trên đĩa cũng được giải
              phóng. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof HardDrive;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-primary/40 bg-primary/5")}>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RowMenu({
  onRename,
  onDelete,
  canEdit,
  canDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canEdit} onClick={onRename}>
          <Pencil className="size-4" /> Đổi tên
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={!canDelete} onClick={onDelete}>
          <Trash2 className="size-4" /> Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
