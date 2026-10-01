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

/** Giá trị `style` duy nhất được phép — do trình soạn sinh ra khi canh lề */
const CANH_LE = [
  "text-align: left",
  "text-align: center",
  "text-align: right",
  "text-align: justify",
  "text-align:left",
  "text-align:center",
  "text-align:right",
  "text-align:justify",
];

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
    // nhúng media an toàn
    "iframe",
    "video",
    "audio",
    "source",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Cho phép class trên mọi thẻ để dùng tiện ích Tailwind + class tô màu code.
    //
    // `style` KHÔNG cho tự do: đó là đường vào của url(javascript:...),
    // expression() và nhiều lỗ hổng khác. Chỉ cho đúng các giá trị canh lề mà
    // trình soạn sinh ra — giá trị nào khác bị bỏ nguyên thuộc tính.
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      "className",
      "class",
      "id",
      // MỘT tuple duy nhất liệt kê mọi giá trị hợp lệ. Tách thành nhiều tuple
      // cùng tên thuộc tính thì thư viện chỉ nhận cái đầu — các giá trị sau bị
      // bỏ âm thầm.
      ["style", ...CANH_LE],
    ],
    iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "title"],
    video: ["src", "controls", "width", "height", "autoplay", "loop", "muted", "poster", "preload"],
    audio: ["src", "controls", "autoplay", "loop", "muted"],
    source: ["src", "type"],
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
