import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Eye, Lock, Pencil, Sparkles, User as UserIcon } from "lucide-react";
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
    <article className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <Link
          href="/huong-dan"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors rounded-lg px-2.5 py-1.5 hover:bg-muted/50"
        >
          <ArrowLeft className="size-3.5" /> Tất cả bài hướng dẫn
        </Link>
        {canEdit(user, article) && (
          <Link
            href={`/articles/${article.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded-lg px-3 py-1.5"
          >
            <Pencil className="size-3.5" /> Sửa bài viết
          </Link>
        )}
      </div>

      <header className="space-y-4 rounded-3xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8 shadow-xs">
        {article.category && (
          <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {article.category.name}
          </span>
        )}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>
        {article.summary && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <UserIcon className="size-3.5 text-primary" />
            {article.author.displayName || article.author.username}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {(article.publishedAt ?? article.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="size-3.5" />
            {article.views + 1} lượt xem
          </span>
          {article.visibility !== "PUBLIC" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Lock className="size-3" />
              {VISIBILITY_LABELS[article.visibility as Visibility]}
            </span>
          )}
        </div>
      </header>

      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-10 shadow-xs">
        <ArticleContent content={article.content} format={article.format} />
      </div>
    </article>
  );
}
