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
    title: `Bài viết & Hướng dẫn kỹ thuật · ${settings.platformName}`,
    description: "Tổng hợp bài viết, thủ thuật và tài liệu kỹ thuật.",
  };
}

export default async function BaiVietPage({
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
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
          <BookOpen className="size-4" /> Tài liệu & Hướng dẫn kỹ thuật
        </div>
        <h1 className="mt-1.5 font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Thư viện bài viết & Hướng dẫn
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed max-w-2xl">
          {articles.length > 0
            ? `Tổng hợp ${articles.length} bài viết được hệ thống hoá theo ${groups.length} chuyên mục.`
            : "Chưa có bài viết nào được đăng."}
          {!user && " Đăng nhập để mở khoá các tài liệu hướng dẫn nội bộ."}
        </p>
      </div>

      {groups.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-16 text-center shadow-neo dark:bg-card">
          <MessageSquareText className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-editorial text-lg font-bold text-foreground">
            Chưa có bài viết nào được đăng.
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            Vui lòng quay lại sau hoặc liên hệ quản trị viên.
          </p>
        </div>
      )}

      {/* Categories Group Sections */}
      <div className="space-y-6">
        {groups.map((g) => (
          <section
            key={g.id}
            className="overflow-hidden rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card transition-colors"
          >
            <header className="border-b-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#2C1F15] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="font-editorial text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-primary border border-[#1C1917]" />
                  {g.name}
                </h2>
                {g.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">{g.description}</p>
                )}
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                {g.items.length} bài viết
              </span>
            </header>

            <ul className="divide-y-2 divide-border/60">
              {g.items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/bai-viet/${a.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-5 py-3.5 hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15] transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {a.pinned && (
                          <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground shadow-neo-sm">
                            <Pin className="size-3" /> Ghim
                          </span>
                        )}
                        {a.visibility !== "PUBLIC" && (
                          <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-[#FAF7F0] px-1.5 py-0.5 text-[10px] font-bold text-stone-700 shadow-neo-sm dark:bg-card dark:text-stone-300">
                            <Lock className="size-3" />
                            {a.visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
                          </span>
                        )}
                        <span className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                          {a.title}
                        </span>
                      </div>
                      {a.summary && (
                        <p className="line-clamp-1 text-xs text-muted-foreground font-medium">
                          {a.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-[11px]">
                        <User className="size-3" />
                        {a.author.displayName || a.author.username}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        <Eye className="size-3 text-primary" />
                        {a.views}
                      </span>
                      <span className="w-24 text-right flex items-center justify-end gap-1 text-[11px] font-medium font-mono">
                        <Clock className="size-3" />
                        {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
                      </span>
                      <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
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
