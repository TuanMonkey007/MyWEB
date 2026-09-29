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
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link
          href="/huong-dan"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-muted"
        >
          <ArrowLeft className="size-3.5" /> Tất cả bài hướng dẫn
        </Link>
        {canEdit(user, article) && (
          <Link
            href={`/articles/${article.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-md px-2.5 py-1"
          >
            <Pencil className="size-3" /> Sửa bài viết
          </Link>
        )}
      </div>

      <header className="space-y-3 rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs">
        {article.category && (
          <span className="inline-flex items-center rounded bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-xs">
            {article.category.name}
          </span>
        )}
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>
        {article.summary && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <UserIcon className="size-3.5 text-muted-foreground" />
            {article.author.displayName || article.author.username}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {(article.publishedAt ?? article.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="size-3.5" />
            {article.views + 1} lượt xem
          </span>
          {article.visibility !== "PUBLIC" && (
            <span className="inline-flex items-center gap-1 rounded bg-muted border border-border px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              <Lock className="size-3" />
              {VISIBILITY_LABELS[article.visibility as Visibility]}
            </span>
          )}
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card p-5 sm:p-8 shadow-xs">
        <ArticleContent content={article.content} format={article.format} />
      </div>
    </article>
  );
}
