import { MarkdownView } from "@/components/articles/markdown-view";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

// Chọn đường render theo định dạng bài:
//   HTML     — soạn bằng trình trực quan, lọc ở server rồi chèn thẳng
//   MARKDOWN — bài cũ, giữ nguyên đường cũ để không vỡ nội dung đã viết
export async function ArticleContent({
  content,
  format,
}: {
  content: string;
  format: string;
}) {
  if (format === "MARKDOWN") return <MarkdownView content={content} />;

  const html = await sanitizeArticleHtml(content);
  return (
    // Đã lọc ở sanitizeArticleHtml theo danh sách cho phép
    <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
