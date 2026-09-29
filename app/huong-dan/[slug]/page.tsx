import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Eye, Lock, Pencil, User as UserIcon } from "lucide-react";
import { ArticleContent } from "@/components/articles/article-content";
import { getCurrentUser } from "@/lib/auth";
import { bumpViews, canEdit, getArticleBySlug, VISIBILITY_LABELS, type Visibility } from "@/lib/articles";
import { getSettings } from "@/lib/settings";

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

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const article = await getArticleBySlug(user, slug);
  if (!article) notFound();

  await bumpViews(article.id);

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
        <Link
          href="/huong-dan"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all rounded-xs border-2 border-transparent hover:border-[#1C1917] px-2 py-1"
        >
          <ArrowLeft className="size-3.5" /> Tất cả bài hướng dẫn
        </Link>
        {canEdit(user, article) && (
          <Link
            href={`/articles/${article.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#F25C2B] hover:bg-[#E8592A] transition-all rounded-xs border-2 border-[#1C1917] px-3 py-1 shadow-neo-sm"
          >
            <Pencil className="size-3" /> Sửa bài viết
          </Link>
        )}
      </div>

      <header className="space-y-3 rounded-sm border-2 border-[#1C1917] bg-white p-5 sm:p-6 shadow-neo dark:bg-card">
        {article.category && (
          <span className="inline-flex items-center rounded-xs border border-[#1C1917] bg-[#F25C2B] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-neo-sm">
            {article.category.name}
          </span>
        )}
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>
        {article.summary && (
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t-2 border-[#1C1917] text-xs text-muted-foreground dark:border-stone-800">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <UserIcon className="size-3.5 text-[#F25C2B]" />
            {article.author.displayName || article.author.username}
          </span>
          <span className="flex items-center gap-1.5 font-medium font-mono">
            <CalendarDays className="size-3.5 text-[#F25C2B]" />
            {(article.publishedAt ?? article.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Eye className="size-3.5 text-[#F25C2B]" />
            {article.views + 1} lượt xem
          </span>
          {article.visibility !== "PUBLIC" && (
            <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-stone-100 px-2 py-0.5 text-[10.5px] font-bold text-stone-800 shadow-neo-sm dark:bg-stone-800 dark:text-stone-200">
              <Lock className="size-3" />
              {VISIBILITY_LABELS[article.visibility as Visibility]}
            </span>
          )}
        </div>
      </header>

      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 sm:p-8 shadow-neo dark:bg-card">
        <ArticleContent content={article.content} format={article.format} />
      </div>
    </article>
  );
}
