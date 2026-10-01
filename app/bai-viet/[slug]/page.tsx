import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Eye,
  Lock,
  Pencil,
  Share2,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { ArticleContent } from "@/components/articles/article-content";
import { getCurrentUser } from "@/lib/auth";
import {
  bumpViews,
  canEdit,
  getArticleBySlug,
  getNextPrevArticles,
  getSidebarData,
  VISIBILITY_LABELS,
  type Visibility,
} from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { ArticleSidebar } from "@/components/articles/article-sidebar";
import { ArticleLayoutWrapper } from "@/components/articles/article-layout-wrapper";
import { ArticleThumbnail } from "@/components/articles/article-thumbnail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const article = await getArticleBySlug(user, slug);
  if (!article) return { title: `Không tìm thấy · ${settings.platformName}` };

  return {
    title: `${article.title} · ${settings.platformName}`,
    description: article.summary ?? undefined,
    robots: article.visibility === "PUBLIC" ? undefined : { index: false, follow: false },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const article = await getArticleBySlug(user, slug);
  if (!article) notFound();

  // Tăng lượt xem & lấy dữ liệu thanh bên cùng lúc
  const [, sidebarData, nextPrev] = await Promise.all([
    bumpViews(article.id),
    getSidebarData(user, {
      currentSlug: slug,
      categoryId: article.categoryId,
      categorySlug: article.category?.slug,
    }),
    getNextPrevArticles(user, slug, article.categoryId),
  ]);

  // Ước tính thời gian đọc (trung bình 200 từ/phút)
  const wordCount = article.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <ArticleLayoutWrapper
      sidebar={
        <ArticleSidebar
          sameCategoryArticles={sidebarData.sameCategoryArticles}
          featuredArticles={sidebarData.featuredArticles}
          otherCategoryArticles={sidebarData.otherCategoryArticles}
          categories={sidebarData.categories}
          currentCategoryName={article.category?.name}
          currentSlug={slug}
        />
      }
    >
      <article className="space-y-6">
        {/* Thanh điều hướng quay lại & hành động */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/bai-viet"
              className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all rounded-xs border border-transparent hover:border-[#1C1917] px-2 py-1"
            >
              <ArrowLeft className="size-3.5" /> Thư viện bài viết
            </Link>
            {article.category && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link
                  href={`/bai-viet?chuyen-muc=${article.category.slug}`}
                  className="font-bold text-primary hover:underline uppercase text-[11px]"
                >
                  {article.category.name}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit(user, article) && (
              <Link
                href={`/articles/${article.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all rounded-xs border-2 border-[#1C1917] px-3 py-1 shadow-neo-sm"
              >
                <Pencil className="size-3" /> Sửa bài viết
              </Link>
            )}
          </div>
        </div>

        {/* Tiêu đề & Metadata bài viết */}
        <header className="space-y-4 rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-7 shadow-neo dark:bg-card">
          <div className="flex flex-wrap items-center gap-2">
            {article.category && (
              <span className="inline-flex items-center rounded-xs border border-[#1C1917] bg-primary px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-neo-sm">
                {article.category.name}
              </span>
            )}
            {article.pinned && (
              <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-amber-300 px-2 py-0.5 text-[10.5px] font-black uppercase text-stone-900 shadow-neo-sm">
                <Sparkles className="size-3" /> Nổi bật
              </span>
            )}
            {article.visibility !== "PUBLIC" && (
              <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-stone-100 px-2 py-0.5 text-[10.5px] font-bold text-stone-800 shadow-neo-sm dark:bg-stone-800 dark:text-stone-200">
                <Lock className="size-3" />
                {VISIBILITY_LABELS[article.visibility as Visibility]}
              </span>
            )}
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
            {article.title}
          </h1>

          {article.summary && (
            <div className="rounded-xs border-l-4 border-primary bg-[#FAF7F0] p-3 text-xs sm:text-sm font-medium text-stone-700 leading-relaxed dark:bg-[#22170F] dark:text-stone-300">
              {article.summary}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t-2 border-[#1C1917] text-xs text-muted-foreground dark:border-stone-800">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <UserIcon className="size-3.5 text-primary" />
              {article.author.displayName || article.author.username}
            </span>
            <span className="flex items-center gap-1.5 font-medium font-mono">
              <CalendarDays className="size-3.5 text-primary" />
              {(article.publishedAt ?? article.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Eye className="size-3.5 text-primary" />
              {article.views + 1} lượt xem
            </span>
            <span className="flex items-center gap-1.5 font-medium font-mono text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              ~{readTime} phút đọc
            </span>
          </div>
        </header>

        {/* Ảnh bìa bài viết nếu có */}
        {article.coverImage && (
          <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-100 shadow-neo dark:bg-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/anh-bai-viet/${article.coverImage}`}
              alt={article.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Nội dung chi tiết bài viết */}
        <div className="rounded-xs border-2 border-[#1C1917] bg-white p-6 sm:p-8 md:p-10 shadow-neo dark:bg-card">
          <ArticleContent content={article.content} format={article.format} />
        </div>

        {/* Điều hướng Bài trước / Bài tiếp theo */}
        {(nextPrev.prev || nextPrev.next) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {nextPrev.prev ? (
              <Link
                href={`/bai-viet/${nextPrev.prev.slug}`}
                className="group flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo-sm hover:shadow-neo hover:bg-[#FAF7F0] dark:bg-card dark:hover:bg-[#22170F] transition-all"
              >
                <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                  <ArrowLeft className="size-3" /> Bài trước
                </div>
                <div className="mt-1 font-editorial font-bold text-sm text-foreground group-hover:text-primary line-clamp-2">
                  {nextPrev.prev.title}
                </div>
              </Link>
            ) : <div />}

            {nextPrev.next ? (
              <Link
                href={`/bai-viet/${nextPrev.next.slug}`}
                className="group flex flex-col justify-between text-right rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo-sm hover:shadow-neo hover:bg-[#FAF7F0] dark:bg-card dark:hover:bg-[#22170F] transition-all"
              >
                <div className="flex items-center justify-end gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                  Bài tiếp theo <ArrowRight className="size-3" />
                </div>
                <div className="mt-1 font-editorial font-bold text-sm text-foreground group-hover:text-primary line-clamp-2">
                  {nextPrev.next.title}
                </div>
              </Link>
            ) : <div />}
          </div>
        )}
      </article>
    </ArticleLayoutWrapper>
  );
}
