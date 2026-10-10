"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { CategoryKind } from "@/lib/types";

export type CategoryDTO = {
  id: string;
  name: string;
  kind: string;
  usageCount: number;
};

function CategorySection({
  title,
  kind,
  categories,
}: {
  title: string;
  kind: CategoryKind;
  categories: CategoryDTO[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), kind }),
    });
    if (res.ok) {
      toast.success(`Đã thêm danh mục "${newName.trim()}"`);
      setNewName("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Thêm thất bại");
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      toast.success("Đã đổi tên danh mục");
      setEditingId(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Đổi tên thất bại");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/categories/${deleting.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success(`Đã xóa danh mục "${deleting.name}"`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
    setDeleting(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên danh mục mới..."
          />
          <Button type="submit" size="icon" disabled={!newName.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>

        <ul className="divide-y">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2">
              {editingId === c.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleRename(c.id);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => handleRename(c.id)}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {c.usageCount} giao dịch
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa danh mục &quot;{deleting?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.usageCount > 0
                ? `Danh mục đang dùng trong ${deleting.usageCount} giao dịch — không thể xóa. Hãy chuyển các giao dịch sang danh mục khác trước.`
                : "Danh mục chưa dùng trong giao dịch nào. Không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            {deleting?.usageCount === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CategorySection
        title="Danh mục chi"
        kind="EXPENSE"
        categories={categories.filter((c) => c.kind === "EXPENSE")}
      />
      <CategorySection
        title="Danh mục thu"
        kind="INCOME"
        categories={categories.filter((c) => c.kind === "INCOME")}
      />
    </div>
  );
}
