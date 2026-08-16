"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// Render Markdown dùng chung cho khung xem trước lúc soạn và trang đọc bài.
//
// BẢO MẬT: react-markdown KHÔNG render HTML thô trừ khi cài thêm rehype-raw.
// Ta cố ý không cài — bài viết là nội dung do người dùng nhập, cho phép HTML
// thô là mở đường cho XSS. Muốn chèn HTML thì phải xem lại quyết định này.

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
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
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
