import { redirect } from "next/navigation";
import { ArticleManager } from "@/components/articles/article-manager";
import { getCurrentUser } from "@/lib/auth";
import { listArticles, listCategories } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login"); // proxy đã chặn — lớp bảo hiểm thứ hai

  const [articles, categories] = await Promise.all([listArticles(user), listCategories()]);
  return <ArticleManager articles={articles} categories={categories} />;
}
