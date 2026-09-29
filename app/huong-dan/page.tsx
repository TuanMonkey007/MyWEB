import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Clock, Eye, Lock, MessageSquareText, Pin, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listArticles, listCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { thoiGianTuongDoi } from "@/lib/article-format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Hướng dẫn kỹ thuật · ${settings.platformName}`,
    description: "Tổng hợp bài hướng dẫn, thủ thuật và tài liệu kỹ thuật.",
  };
}

export default async function HuongDanPage({
  searchParams,
}: {
  searchParams: Promise<{ "chuyen-muc"?: string }>;
}) {
  const { "chuyen-muc": chuyenMuc } = await searchParams;
  const user = await getCurrentUser();
  const [articles, categories] = await Promise.all([
    listArticles(user, chuyenMuc),
    listCategories(),
  ]);

  const groups = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      items: articles.filter((a) => a.category?.id === c.id),
    })),
    {
      id: "none",
      name: "Chưa phân loại",
      description: null,
      items: articles.filter((a) => !a.category),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="size-4" /> Tài liệu & Hướng dẫn kỹ thuật
        </div>
        <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Thư viện kiến thức & Hướng dẫn
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-2xl">
          {articles.length > 0
            ? `Tổng hợp ${articles.length} bài viết được hệ thống hoá theo ${groups.length} chuyên mục.`
            : "Chưa có bài viết nào được đăng."}
          {!user && " Đăng nhập để mở khoá các tài liệu hướng dẫn nội bộ."}
        </p>
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <MessageSquareText className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            Chưa có bài hướng dẫn nào được đăng.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vui lòng quay lại sau hoặc liên hệ quản trị viên.
          </p>
        </div>
      )}

      {/* Categories Group Sections */}
      <div className="space-y-4">
        {groups.map((g) => (
          <section
            key={g.id}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-colors"
          >
            <header className="border-b border-border bg-muted/40 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  {g.name}
                </h2>
                {g.description && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{g.description}</p>
                )}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {g.items.length} chủ đề
              </span>
            </header>

            <ul className="divide-y divide-border/60">
              {g.items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/huong-dan/${a.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        {a.pinned && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            <Pin className="size-3" /> Ghim
                          </span>
                        )}
                        {a.visibility !== "PUBLIC" && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Lock className="size-3" />
                            {a.visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
                          </span>
                        )}
                        <span className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                          {a.title}
                        </span>
                      </div>
                      {a.summary && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {a.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-[11px]">
                        <User className="size-3" />
                        {a.author.displayName || a.author.username}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[11px]">
                        <Eye className="size-3" />
                        {a.views}
                      </span>
                      <span className="w-20 text-right flex items-center justify-end gap-1 text-[10px]">
                        <Clock className="size-3" />
                        {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
