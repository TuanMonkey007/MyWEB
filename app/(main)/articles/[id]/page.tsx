import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/articles/article-editor";
import { getCurrentUser } from "@/lib/auth";
import { canEdit, listCategories } from "@/lib/articles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, article, categories] = await Promise.all([
    getCurrentUser(),
    prisma.article.findUnique({ where: { id } }),
    listCategories(),
  ]);
  // Không mở được trình soạn của bài người khác (trừ admin) — cùng quy tắc với API
  if (!article || !user || !canEdit(user, article)) notFound();

  return (
    <ArticleEditor
      article={{
        id: article.id,
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        content: article.content,
        visibility: article.visibility,
        categoryId: article.categoryId,
        coverImage: article.coverImage,
        format: article.format,
      }}
      categories={categories}
    />
  );
}
