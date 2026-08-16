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
    // Bài nội bộ/nháp không cho công cụ tìm kiếm lập chỉ mục
    robots: article.visibility === "PUBLIC" ? undefined : { index: false, follow: false },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const article = await getArticleBySlug(user, slug);
  // getArticleBySlug trả null khi không đủ quyền → 404, không tiết lộ bài có tồn tại
  if (!article) notFound();

  await bumpViews(article.id);

  return (
    <article className="space-y-6">
      <Link
        href="/huong-dan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tất cả bài hướng dẫn
      </Link>

      <header className="space-y-3 border-b pb-5">
        {article.category && (
          <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {article.category.name}
          </span>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{article.title}</h1>
        {article.summary && <p className="text-muted-foreground">{article.summary}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-3.5" />
            {article.author.displayName || article.author.username}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {(article.publishedAt ?? article.createdAt).toLocaleDateString("vi-VN")}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {article.views + 1} lượt xem
          </span>
          {article.visibility !== "PUBLIC" && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs">
              <Lock className="size-3" />
              {VISIBILITY_LABELS[article.visibility as Visibility]} — không hiện với khách
            </span>
          )}
          {canEdit(user, article) && (
            <Link
              href={`/articles/${article.id}`}
              className="flex items-center gap-1.5 text-primary underline-offset-2 hover:underline"
            >
              <Pencil className="size-3.5" /> Sửa bài
            </Link>
          )}
        </div>
      </header>

      <ArticleContent content={article.content} format={article.format} />
    </article>
  );
}
