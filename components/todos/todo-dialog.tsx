"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toDateInputValue } from "@/lib/format";
import {
  TODO_PRIORITIES,
  TODO_PRIORITY_LABELS,
  TODO_STATUSES,
  TODO_STATUS_LABELS,
  type TodoDTO,
} from "@/lib/todos-constants";

export function TodoDialog({
  open,
  onClose,
  todo,
}: {
  open: boolean;
  onClose: () => void;
  todo: TodoDTO | null; // null = tạo mới
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(todo?.title ?? "");
    setNotes(todo?.notes ?? "");
    setPriority(todo?.priority ?? "MEDIUM");
    setStatus(todo?.status ?? "TODO");
    setDueDate(todo?.dueDate ? toDateInputValue(todo.dueDate) : "");
  }, [open, todo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Nhập tên việc");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(todo ? `/api/todos/${todo.id}` : "/api/todos", {
        method: todo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          priority,
          status,
          dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(todo ? "Đã cập nhật việc" : "Đã thêm việc");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!todo) return;
    const res = await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa việc");
      router.refresh();
      onClose();
    } else {
      toast.error("Xóa thất bại");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "Chi tiết việc" : "Thêm việc mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="td-title">Tên việc</Label>
            <Input
              id="td-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="vd: Gia hạn SSL huunghi.com.vn"
              autoFocus={!todo}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TODO_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TODO_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="td-due">Hạn</Label>
              <Input
                id="td-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="td-notes">Ghi chú</Label>
            <Textarea
              id="td-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {todo && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Đang lưu..." : todo ? "Cập nhật" : "Thêm việc"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
