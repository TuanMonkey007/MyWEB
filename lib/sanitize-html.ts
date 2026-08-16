// Lọc HTML bài viết ở PHÍA SERVER rồi mới trả về trình duyệt.
//
// Bài soạn bằng trình trực quan lưu ra HTML. Không cho nó đi qua bộ phân tích
// Markdown nữa: dấu * _ ` trong nội dung sẽ bị hiểu nhầm thành định dạng.
//
// Lọc vẫn là bắt buộc dù HTML do trình soạn sinh ra — vì dữ liệu trong DB có
// thể bị sửa bằng đường khác, và bài hiển thị công khai.
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { articleSchema } from "./markdown-sanitize";

export async function sanitizeArticleHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, articleSchema)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(html);
  return String(file);
}
