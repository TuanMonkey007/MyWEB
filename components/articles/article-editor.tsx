"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichEditor } from "@/components/articles/rich-editor";
import { useCan } from "@/components/permissions-provider";
import {
  VISIBILITIES,
  VISIBILITY_HINTS,
  VISIBILITY_LABELS,
  type Visibility,
} from "@/lib/articles";

export type EditorArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  visibility: string;
  categoryId: string | null;
  coverImage: string | null;
  format: string;
};

const MAU_BAI = `<h2>Chuẩn bị</h2><ul><li>Thiết bị A: …</li><li>Thiết bị B: …</li></ul><h2>Các bước</h2><ol><li>Bước một</li><li>Bước hai</li></ol><blockquote><p>Lưu ý: …</p></blockquote>`;

export function ArticleEditor({
  article,
  categories,
}: {
  article: EditorArticle | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const can = useCan();
  const canPublish = can("articles", "publish");

  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [content, setContent] = useState(article?.content ?? MAU_BAI);
  const [visibility, setVisibility] = useState<Visibility>(
    (article?.visibility as Visibility) ?? "DRAFT"
  );
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "none");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? null);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/articles/cover", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Tải ảnh thất bại");
      setCoverImage(data.name);
      toast.success("Đã tải ảnh bìa — nhớ bấm Lưu");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) return toast.error("Nhập tiêu đề bài viết");
    if (!content.trim()) return toast.error("Nội dung không được để trống");

    setSaving(true);
    try {
      const payload = {
        title,
        summary,
        content,
        visibility,
        categoryId: categoryId === "none" ? null : categoryId,
        coverImage,
        format: "HTML",
      };
      const res = await fetch(article ? `/api/articles/${article.id}` : "/api/articles", {
        method: article ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lưu thất bại");
      toast.success(article ? "Đã lưu bài viết" : "Đã tạo bài viết");
      router.push("/articles");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/articles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Danh sách
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {article ? "Sửa bài viết" : "Viết bài mới"}
        </h1>
        {article && visibility !== "DRAFT" && (
          <Link href={`/huong-dan/${article.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="size-4" /> Xem trang thật
            </Button>
          </Link>
        )}
        <Button className="ml-auto" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_220px_200px]">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">
              Tiêu đề
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="vd: Hướng dẫn tạo VPN Site-to-Site giữa 2 chi nhánh"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Chuyên mục</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chưa phân loại</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phạm vi hiển thị</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => (
                  <SelectItem key={v} value={v} disabled={v === "PUBLIC" && !canPublish}>
                    {VISIBILITY_LABELS[v]}
                    {v === "PUBLIC" && !canPublish ? " (không có quyền)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{VISIBILITY_HINTS[visibility]}</p>
          </div>
          <div className="space-y-1.5 md:col-span-3">
            <Label className="text-xs">
              Ảnh bìa <span className="text-muted-foreground">(hiện ở trang chủ kiểu báo)</span>
            </Label>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) uploadCover(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              {coverImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/anh-bai-viet/${coverImage}`}
                    alt="Ảnh bìa bài viết"
                    className="h-20 w-32 rounded-md border object-cover"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="size-4" /> Đổi ảnh
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setCoverImage(null)}>
                    <Trash2 className="size-4" /> Gỡ
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  Tải ảnh bìa
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="summary" className="text-xs">
              Mô tả ngắn <span className="text-muted-foreground">(hiện ở danh sách, không bắt buộc)</span>
            </Label>
            <Input
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Một câu tóm tắt bài này giải quyết việc gì"
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label className="text-xs">Nội dung</Label>
        <RichEditor value={content} onChange={setContent} />
        <p className="text-xs text-muted-foreground">
          Gõ và định dạng trực tiếp — bôi đen chữ rồi bấm nút trên thanh công cụ.
          Chèn ảnh, bảng, khối lệnh, liên kết đều có sẵn.
          {article?.format === "MARKDOWN" && (
            <span className="mt-1 block text-amber-600">
              Bài này viết bằng Markdown từ trước. Lưu lại sẽ chuyển sang định dạng
              mới — nội dung giữ nguyên, nhưng cú pháp Markdown (## , **đậm**) sẽ
              thành chữ thường.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
