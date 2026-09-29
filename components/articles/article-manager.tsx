"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, FolderPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCan } from "@/components/permissions-provider";
import { VISIBILITY_LABELS, type Visibility } from "@/lib/articles";

type Row = {
  id: string;
  slug: string;
  title: string;
  visibility: string;
  views: number;
  updatedAt: string | Date;
  category: { id: string; name: string } | null;
  author: { username: string; displayName: string | null };
};

const BADGE_VARIANT: Record<Visibility, "secondary" | "outline" | "default"> = {
  DRAFT: "secondary",
  INTERNAL: "outline",
  PUBLIC: "default",
};

export function ArticleManager({
  articles,
  categories,
}: {
  articles: Row[];
  categories: { id: string; name: string; _count: { articles: number } }[];
}) {
  const router = useRouter();
  const can = useCan();
  const [newCategory, setNewCategory] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch("/api/article-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Tạo chuyên mục thất bại");
      setNewCategory("");
      toast.success(`Đã tạo chuyên mục "${data.name}"`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(id: string, name: string, count: number) {
    const hoi =
      count > 0
        ? `Xóa chuyên mục "${name}"? ${count} bài trong đó sẽ chuyển về "Chưa phân loại", không bị xóa.`
        : `Xóa chuyên mục "${name}"?`;
    if (!confirm(hoi)) return;
    await fetch(`/api/article-categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    toast.success("Đã xóa chuyên mục");
    router.refresh();
  }

  async function removeArticle(id: string, title: string) {
    if (!confirm(`Xóa bài "${title}"? Không khôi phục được.`)) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      return toast.error(d?.error ?? "Xóa thất bại");
    }
    toast.success("Đã xóa bài viết");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Quản lý bài viết & Hướng dẫn
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            Viết tài liệu kỹ thuật & chia sẻ kiến thức. Bài công khai hiện ở{" "}
            <Link href="/bai-viet" className="text-primary underline-offset-2 hover:underline font-bold">
              /bai-viet
            </Link>{" "}
            cho cả người chưa đăng nhập.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/bai-viet" target="_blank">
            <Button variant="outline">
              <Eye className="size-4" /> Xem trang công khai
            </Button>
          </Link>
          {can("articles", "create") && (
            <Link href="/articles/new">
              <Button>
                <Plus className="size-4" /> Viết bài
              </Button>
            </Link>
          )}
        </div>
      </div>

      {can("articles", "categories") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chuyên mục</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có chuyên mục nào — bài viết sẽ nằm ở nhóm &quot;Chưa phân loại&quot;.
                </p>
              )}
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 py-1 pl-3 pr-1.5 text-sm"
                >
                  {c.name}
                  <span className="text-xs text-muted-foreground">{c._count.articles}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id, c.name, c._count.articles)}
                    aria-label={`Xóa chuyên mục ${c.name}`}
                    className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Tên chuyên mục mới, vd: Mạng & VPN"
                className="max-w-xs"
              />
              <Button variant="outline" onClick={addCategory} disabled={busy || !newCategory.trim()}>
                <FolderPlus className="size-4" /> Thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="px-0">
          {articles.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Chưa có bài viết nào. Bấm &quot;Viết bài&quot; để bắt đầu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Chuyên mục</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead className="text-right">Lượt xem</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[26rem] truncate font-medium">
                      <Link href={`/articles/${a.id}`} className="hover:underline">
                        {a.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.category?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={BADGE_VARIANT[a.visibility as Visibility] ?? "secondary"}>
                        {VISIBILITY_LABELS[a.visibility as Visibility] ?? a.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{a.views}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(a.updatedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {can("articles", "delete") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeArticle(a.id, a.title)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
