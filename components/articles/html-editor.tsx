"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileCode,
  Heading2,
  List,
  Quote,
  Table as TableIcon,
  Video,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HtmlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Chèn thẻ HTML tại vị trí con trỏ
  function insertSnippet(before: string, after: string = "", defaultText: string = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = ta.value;
    const selectedText = current.substring(start, end) || defaultText;
    const updated = current.substring(0, start) + before + selectedText + after + current.substring(end);
    onChange(updated);

    setTimeout(() => {
      ta.focus();
      const newCursor = start + before.length + selectedText.length;
      ta.setSelectionRange(newCursor, newCursor);
    }, 10);
  }

  // Định dạng lại thụt lề HTML cơ bản
  function formatHtml() {
    try {
      let formatted = "";
      const reg = /(>)(<)(\/*)/g;
      let xml = value.replace(reg, "$1\r\n$2$3");
      let pad = 0;
      xml.split("\r\n").forEach((node) => {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\/\w/)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        formatted += "  ".repeat(pad) + node + "\r\n";
        pad += indent;
      });
      onChange(formatted.trim());
      toast.success("Đã định dạng lại mã HTML");
    } catch {
      toast.error("Không thể tự động thụt lề HTML");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(value);
    toast.success("Đã sao chép mã nguồn HTML");
  }

  // Xử lý phím Tab trong textarea
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const updated = ta.value.substring(0, start) + "  " + ta.value.substring(end);
      onChange(updated);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
    }
  }

  return (
    <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
      {/* HTML Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-[#1C1917] bg-[#F5EFEB] p-2 dark:bg-[#1E140C] dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
            <FileCode className="size-3.5" /> Thẻ nhanh:
          </span>

          <button
            type="button"
            title="Thẻ H2"
            onClick={() => insertSnippet("<h2>", "</h2>", "Tiêu đề mục")}
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <Heading2 className="size-3 text-primary" /> H2
          </button>

          <button
            type="button"
            title="Thẻ H3"
            onClick={() => insertSnippet("<h3>", "</h3>", "Tiêu đề phụ")}
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            H3
          </button>

          <button
            type="button"
            title="Đoạn văn"
            onClick={() => insertSnippet("<p>", "</p>", "Nội dung đoạn văn…")}
            className="rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            &lt;p&gt;
          </button>

          <button
            type="button"
            title="Trích dẫn"
            onClick={() => insertSnippet("<blockquote>\n  <p>", "</p>\n</blockquote>", "Trích dẫn lưu ý quan trọng…")}
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <Quote className="size-3 text-primary" /> Quote
          </button>

          <button
            type="button"
            title="Danh sách"
            onClick={() => insertSnippet("<ul>\n  <li>", "</li>\n  <li>Mục 2</li>\n</ul>", "Mục 1")}
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <List className="size-3 text-primary" /> List
          </button>

          <button
            type="button"
            title="Khối lệnh Code"
            onClick={() => insertSnippet('<pre><code class="language-bash">\n', "\n</code></pre>", "# Lệnh chạy thử nghiệm")}
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <Code2 className="size-3 text-primary" /> Code
          </button>

          <button
            type="button"
            title="Bảng"
            onClick={() =>
              insertSnippet(
                '<table class="w-full border-collapse border-2 border-stone-800 my-4">\n  <thead>\n    <tr class="bg-stone-200">\n      <th class="border border-stone-800 p-2">Cột 1</th>\n      <th class="border border-stone-800 p-2">Cột 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border border-stone-800 p-2">Dữ liệu 1</td>\n      <td class="border border-stone-800 p-2">Dữ liệu 2</td>\n    </tr>\n  </tbody>\n</table>\n'
              )
            }
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <TableIcon className="size-3 text-primary" /> Table
          </button>

          <button
            type="button"
            title="Chèn Video (MP4 / Link Drive)"
            onClick={() =>
              insertSnippet(
                '<div class="my-4 overflow-hidden rounded-xs border-2 border-[#1C1917] bg-black shadow-neo">\n  <video controls playsinline webkit-playsinline preload="metadata" class="w-full h-auto block">\n    <source src="',
                '" type="video/mp4">\n    Trình duyệt không hỗ trợ phát video này.\n  </video>\n</div>',
                "URL_VIDEO_HOAC_LINK_DRIVE"
              )
            }
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2 py-1 text-xs font-bold text-primary shadow-neo-sm hover:bg-[#FDF1EA] dark:bg-card"
          >
            <Video className="size-3 text-primary" /> Video MP4
          </button>

          <button
            type="button"
            title="Hộp thông báo Callout"
            onClick={() =>
              insertSnippet(
                '<div class="my-4 rounded-xs border-2 border-[#1C1917] bg-[#FDF1EA] p-4 shadow-neo-sm">\n  <strong class="text-primary font-bold">Lưu ý:</strong>\n  <p class="mt-1 text-sm text-stone-800">',
                "</p>\n</div>",
                "Nội dung cần đặc biệt chú ý…"
              )
            }
            className="rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-1 text-xs font-bold text-primary shadow-neo-sm hover:bg-[#FBE5D8]"
          >
            Callout Box
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={formatHtml}
            title="Tự động thụt lề mã HTML"
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2.5 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <Wand2 className="size-3.5 text-primary" /> Thụt lề
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Sao chép toàn bộ HTML"
            className="flex items-center gap-1 rounded-xs border border-[#1C1917] bg-white px-2.5 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-muted dark:bg-card"
          >
            <Copy className="size-3.5" /> Copy
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-1 rounded-xs border border-[#1C1917] px-2.5 py-1 text-xs font-bold transition-all shadow-neo-sm",
              showPreview
                ? "bg-primary text-primary-foreground"
                : "bg-white text-foreground hover:bg-muted dark:bg-card"
            )}
          >
            {showPreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {showPreview ? "Tắt xem trước" : "Xem trước"}
          </button>
        </div>
      </div>

      {/* Editor & Preview Split */}
      <div className={cn("grid", showPreview ? "grid-cols-1 lg:grid-cols-2 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#1C1917] dark:divide-stone-800" : "grid-cols-1")}>
        {/* Source Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Viết hoặc dán mã HTML ở đây (ví dụ: <h2>Tiêu đề</h2><p>Nội dung...</p>)..."
            className="min-h-[460px] w-full resize-y bg-[#18110B] p-4 font-mono text-xs sm:text-sm text-[#FAF7F0] outline-none focus:ring-2 focus:ring-primary leading-relaxed selection:bg-primary selection:text-white"
          />
          <div className="absolute bottom-2 right-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-stone-400">
            {value.length} ký tự · Hỗ trợ Tab & Phím tắt HTML
          </div>
        </div>

        {/* Live Preview Pane */}
        {showPreview && (
          <div className="min-h-[460px] overflow-y-auto bg-white p-5 dark:bg-card">
            <div className="mb-3 pb-2 border-b border-border flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Xem trước kết quả render:</span>
              <span className="text-[10px] text-emerald-600 font-mono">● Trực tiếp</span>
            </div>
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
