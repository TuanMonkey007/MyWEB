"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { articleSchema } from "@/lib/markdown-sanitize";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// Render Markdown dùng chung cho khung xem trước lúc soạn và trang đọc bài.
//
// BẢO MẬT — thứ tự plugin ở đây là điểm mấu chốt, đừng đảo:
//   rehype-raw      đọc HTML thô người viết nhúng vào
//   rehype-sanitize LỌC ngay sau đó theo danh sách cho phép
//   rehype-highlight tô màu code (chạy sau khi đã sạch)
// Nếu đặt sanitize TRƯỚC raw thì HTML thô lọt qua không bị lọc — bài viết hiển
// thị công khai nên đó là lỗ hổng XSS thật. Danh sách cho phép ở
// lib/markdown-sanitize.ts.

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent<HTMLButtonElement>) {
    const pre = e.currentTarget.parentElement?.querySelector("code");
    const text = pre?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* trình duyệt chặn clipboard — bỏ qua, người dùng vẫn bôi đen copy được */
    }
  }

  return (
    <div className="group/code relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Sao chép đoạn mã"
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100"
      >
        {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
        {copied ? "Đã chép" : "Chép"}
      </button>
      <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-4 text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-article", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, articleSchema],
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          // Link ra ngoài mở tab mới + chặn tab-nabbing
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {children}
              </a>
            );
          },
          // Bảng có thể rộng hơn khung — cho cuộn trong hộp riêng, không đẩy cả trang
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
