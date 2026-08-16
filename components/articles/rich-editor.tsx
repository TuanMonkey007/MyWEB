"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { EditorToolbar } from "@/components/articles/editor-toolbar";

// Trình soạn thảo trực quan — gõ đâu thấy đó, không phải học cú pháp.
// Kết quả lưu ra HTML; lúc hiển thị vẫn đi qua bộ lọc ở lib/markdown-sanitize.ts
// nên dù có ai sửa HTML thẳng trong DB cũng không chèn được mã độc.
export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    // Next render trước ở server; để true sẽ lệch hydration
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // h1 dành cho tiêu đề bài, trong nội dung bắt đầu từ h2
      }),
      Link.configure({
        openOnClick: false, // đang soạn thì bấm link là để sửa, không phải mở
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Bắt đầu viết bài ở đây…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // prose-article: dùng lại đúng bộ kiểu chữ của trang đọc, nên nhìn lúc
        // soạn giống hệt lúc đăng
        class: "prose-article min-h-[420px] px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return <div className="min-h-[480px] animate-pulse rounded-lg border bg-muted/40" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring/50">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
