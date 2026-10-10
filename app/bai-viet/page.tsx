import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  Lock,
  MessageSquareText,
  Pin,
  Sparkles,
  User,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSidebarData, listArticles, listCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { thoiGianTuongDoi } from "@/lib/article-format";
import { ArticleThumbnail } from "@/components/articles/article-thumbnail";
import { ArticleSidebar } from "@/components/articles/article-sidebar";
import { ArticleLayoutWrapper } from "@/components/articles/article-layout-wrapper";

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
  const [articles, categories, sidebarData] = await Promise.all([
    listArticles(user, chuyenMuc),
    listCategories(),
    getSidebarData(user, { categorySlug: chuyenMuc }),
  ]);

  const currentCategory = categories.find((c) => c.slug === chuyenMuc);

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
    <ArticleLayoutWrapper
      sidebar={
        <ArticleSidebar
          sameCategoryArticles={sidebarData.sameCategoryArticles}
          featuredArticles={sidebarData.featuredArticles}
          otherCategoryArticles={sidebarData.otherCategoryArticles}
          categories={sidebarData.categories}
          currentCategoryName={currentCategory?.name}
        />
      }
    >
      <div className="space-y-6">
        {/* Banner tiêu đề trang */}
        <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-6 shadow-neo dark:bg-card">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
            <BookOpen className="size-4" /> Tài liệu & Hướng dẫn kỹ thuật
          </div>
          <h1 className="mt-1 font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            {currentCategory ? `Chuyên mục: ${currentCategory.name}` : "Thư viện bài viết & Hướng dẫn"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed max-w-2xl">
            {articles.length > 0
              ? `Tổng hợp ${articles.length} bài viết được hệ thống hoá trực quan kèm hình ảnh thumbnail và video minh họa.`
              : "Chưa có bài viết nào trong chuyên mục này."}
            {!user && " Đăng nhập để mở khoá các tài liệu hướng dẫn nội bộ."}
          </p>

          {/* Thanh lọc nhanh chuyên mục */}
          <div className="mt-4 pt-3 border-t-2 border-[#1C1917] flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-1">
              Lọc theo:
            </span>
            <Link
              href="/bai-viet"
              className={`rounded-xs border border-[#1C1917] px-2.5 py-1 text-xs font-bold transition-all shadow-neo-sm ${
                !chuyenMuc
                  ? "bg-primary text-primary-foreground font-black"
                  : "bg-[#FAF7F0] text-foreground hover:bg-white dark:bg-[#22170F]"
              }`}
            >
              Tất cả ({sidebarData.featuredArticles.length})
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/bai-viet?chuyen-muc=${c.slug}`}
                className={`rounded-xs border border-[#1C1917] px-2.5 py-1 text-xs font-bold transition-all shadow-neo-sm ${
                  chuyenMuc === c.slug
                    ? "bg-primary text-primary-foreground font-black"
                    : "bg-white text-foreground hover:bg-[#FDF1EA] dark:bg-card"
                }`}
              >
                {c.name}
                {typeof c._count?.articles === "number" && (
                  <span className="ml-1 text-xs opacity-80">({c._count.articles})</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="rounded-xs border-2 border-dashed border-[#1C1917] bg-white py-16 text-center shadow-neo dark:bg-card">
            <MessageSquareText className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 font-editorial text-lg font-bold text-foreground">
              Chưa có bài viết nào được đăng.
            </p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              Vui lòng quay lại sau hoặc liên hệ quản trị viên.
            </p>
          </div>
        )}

        {/* Danh sách các nhóm bài viết */}
        <div className="space-y-6">
          {groups.map((g) => (
            <section
              key={g.id}
              className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card transition-colors"
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
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {g.items.length} bài viết
                </span>
              </header>

              <div className="divide-y-2 divide-border/60">
                {g.items.map((a) => (
                  <article key={a.id} className="group p-4 sm:p-5 hover:bg-[#FAF7F0] dark:hover:bg-[#22170F] transition-colors">
                    <Link
                      href={`/bai-viet/${a.slug}`}
                      className="flex flex-col sm:flex-row gap-4 items-start"
                    >
                      {/* Thumbnail bài viết ở bên trái */}
                      <div className="w-full sm:w-44 md:w-52 shrink-0">
                        <ArticleThumbnail
                          coverImage={a.coverImage}
                          title={a.title}
                          categoryName={a.category?.name}
                          aspectRatio="video"
                        />
                      </div>

                      {/* Nội dung chi tiết bài viết */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-amber-300 px-1.5 py-0.5 text-xs font-black uppercase text-stone-900 shadow-neo-sm">
                              <Pin className="size-3" /> Ghim
                            </span>
                          )}
                          {a.visibility !== "PUBLIC" && (
                            <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-[#FAF7F0] px-1.5 py-0.5 text-xs font-bold text-stone-700 shadow-neo-sm dark:bg-card dark:text-stone-300">
                              <Lock className="size-3" />
                              {a.visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
                            </span>
                          )}
                          {a.category && (
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              {a.category.name}
                            </span>
                          )}
                        </div>

                        <h3 className="font-editorial text-base sm:text-xl font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {a.title}
                        </h3>

                        {a.summary && (
                          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                            {a.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 font-semibold text-xs">
                              <User className="size-3.5 text-primary" />
                              {a.author.displayName || a.author.username}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-xs">
                              <Eye className="size-3.5 text-primary" />
                              {a.views}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium font-mono">
                              <Clock className="size-3.5 text-primary" />
                              {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary group-hover:translate-x-1 transition-transform">
                            Đọc bài viết <ArrowRight className="size-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </ArticleLayoutWrapper>
  );
}
