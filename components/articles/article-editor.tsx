"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Eye, ExternalLink, Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { MarkdownView } from "@/components/articles/markdown-view";
import { useCan } from "@/components/permissions-provider";
import {
  VISIBILITIES,
  VISIBILITY_HINTS,
  VISIBILITY_LABELS,
  type Visibility,
} from "@/lib/articles";
import { cn } from "@/lib/utils";

export type EditorArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  visibility: string;
  categoryId: string | null;
};

const MAU_BAI = `## Chuẩn bị

- Thiết bị A: ...
- Thiết bị B: ...

## Các bước

1. Bước một
2. Bước hai

\`\`\`bash
# ví dụ cấu hình
config vpn ipsec phase1-interface
\`\`\`

> Lưu ý: ...
`;

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
  const [saving, setSaving] = useState(false);
  // Trên màn hẹp không đủ chỗ hai cột — cho chuyển qua lại soạn/xem trước
  const [mobileTab, setMobileTab] = useState<"soan" | "xem">("soan");

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

      {/* Chuyển tab chỉ hiện trên màn hẹp; từ md trở lên xem hai cột song song */}
      <div className="flex gap-2 md:hidden">
        {(["soan", "xem"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={mobileTab === t ? "default" : "outline"}
            onClick={() => setMobileTab(t)}
          >
            {t === "soan" ? <Pencil className="size-4" /> : <Eye className="size-4" />}
            {t === "soan" ? "Soạn" : "Xem trước"}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn("space-y-1.5", mobileTab !== "soan" && "hidden md:block")}>
          <Label htmlFor="content" className="text-xs">
            Nội dung (Markdown)
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={26}
            spellCheck={false}
            className="font-mono text-[13px] leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Dùng <code>## Tiêu đề</code>, <code>- gạch đầu dòng</code>, <code>**đậm**</code>,
            bảng, và ```` ```bash ```` cho khối lệnh. HTML thô bị bỏ qua để tránh XSS.
          </p>
        </div>
        <div className={cn("space-y-1.5", mobileTab !== "xem" && "hidden md:block")}>
          <Label className="text-xs">Xem trước</Label>
          <Card className="min-h-[200px]">
            <CardContent>
              {content.trim() ? (
                <MarkdownView content={content} />
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có nội dung.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
