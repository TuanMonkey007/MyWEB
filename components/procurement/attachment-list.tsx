"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  File as FileIcon,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export type AttachmentDTO = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime === "application/pdf") return FileText;
  if (mime.includes("sheet") || mime.includes("excel")) return FileSpreadsheet;
  return FileIcon;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// FR bằng chứng: upload/xem/xóa file gắn với phiếu (proposalId) hoặc hạng mục (itemId)
export function AttachmentList({
  attachments,
  proposalId,
  itemId,
  compact = false,
}: {
  attachments: AttachmentDTO[];
  proposalId?: string;
  itemId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<AttachmentDTO | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        if (proposalId) form.append("proposalId", proposalId);
        if (itemId) form.append("itemId", itemId);
        const res = await fetch("/api/attachments", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Upload "${file.name}" thất bại`);
        }
      }
      toast.success("Đã tải file lên");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/attachments/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa file");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex items-center justify-between gap-2">
        {!compact && (
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Paperclip className="size-4" /> Bằng chứng ({attachments.length})
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {uploading ? "Đang tải..." : "Tải file lên"}
        </Button>
      </div>

      {attachments.length > 0 && (
        <ul className="divide-y rounded-md border">
          {attachments.map((a) => {
            const Icon = iconFor(a.mimeType);
            return (
              <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate hover:underline"
                  title={a.fileName}
                >
                  {a.fileName}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatSize(a.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleting(a)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa file bằng chứng?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleting?.fileName}&quot; sẽ bị xóa vĩnh viễn khỏi ổ đĩa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
