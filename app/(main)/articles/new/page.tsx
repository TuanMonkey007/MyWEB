import { ArticleEditor } from "@/components/articles/article-editor";
import { listCategories } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const categories = await listCategories();
  return <ArticleEditor article={null} categories={categories} />;
}
