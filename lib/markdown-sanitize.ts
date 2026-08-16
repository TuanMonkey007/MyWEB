// Danh sách thẻ/thuộc tính HTML được phép xuất hiện trong bài viết.
//
// Vì sao cần: người viết muốn dùng HTML để trình bày đẹp hơn Markdown thuần
// (chia cột, hộp cảnh báo, canh ảnh...). Nhưng bài viết hiển thị CÔNG KHAI, nên
// nếu cho HTML thô đi thẳng thì một tài khoản bị chiếm quyền có thể nhúng mã
// độc chạy trên máy mọi khách vào đọc.
//
// Cách làm: bật rehype-raw để đọc HTML, rồi rehype-sanitize lọc theo đúng danh
// sách dưới đây. Nguyên tắc là DANH SÁCH CHO PHÉP — thẻ/thuộc tính nào không
// liệt kê thì bị bỏ, kể cả những thứ chưa nghĩ tới.
import { defaultSchema } from "rehype-sanitize";

type Schema = typeof defaultSchema;

export const articleSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // bố cục
    "div",
    "section",
    "figure",
    "figcaption",
    "details",
    "summary",
    // định dạng chữ
    "mark",
    "small",
    "sub",
    "sup",
    "u",
    "abbr",
    "kbd",
    "time",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Cho phép class trên mọi thẻ để dùng tiện ích Tailwind + class tô màu code
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "class", "id", "style"],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading",
    ],
    a: [...(defaultSchema.attributes?.a ?? []), "href", "title", "target", "rel"],
    td: [...(defaultSchema.attributes?.td ?? []), "colspan", "rowspan", "align"],
    th: [...(defaultSchema.attributes?.th ?? []), "colspan", "rowspan", "align", "scope"],
  },
  // Chỉ cho phép giao thức an toàn — chặn javascript: và data: (trừ ảnh)
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto", "tel"],
    src: ["http", "https"],
  },
};

/**
 * `style` nằm trong danh sách cho phép để người viết canh chỉnh được, nhưng
 * thuộc tính này là đường dẫn cũ của nhiều lỗ hổng (url(javascript:...),
 * expression()...). Lọc thô những mẫu nguy hiểm trước khi lưu.
 */
export function stripDangerousCss(html: string): string {
  return html.replace(/style\s*=\s*(["'])(.*?)\1/gi, (match, quote, css: string) => {
    const nguyHiem = /(javascript:|expression\s*\(|behavior\s*:|@import|<\/?script)/i;
    return nguyHiem.test(css) ? "" : match;
  });
}
