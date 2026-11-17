"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { toast } from "sonner";
import { EditorToolbar } from "@/components/articles/editor-toolbar";
import { AnhBaiViet } from "@/components/articles/anh-node";
import { locFileAnh, taiAnhLen } from "@/components/articles/upload-anh";

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
  // Các hàm xử lý dán/thả được TipTap giữ lại từ lần dựng đầu, lúc đó biến
  // `editor` còn là null. Đi qua ref thì lúc chạy mới đọc, nên luôn đúng.
  const editorRef = useRef<Editor | null>(null);

  /** Tải lần lượt rồi chèn nối tiếp nhau; ảnh nào lỗi chỉ báo riêng ảnh đó */
  const chenNhieuAnh = useCallback(async (files: File[], viTri: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    let vt = viTri;
    for (const f of files) {
      try {
        const src = await taiAnhLen(f);
        ed.chain().insertContentAt(vt, { type: "image", attrs: { src, alt: "" } }).run();
        vt = ed.state.selection.to;
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "tải ảnh thất bại"}`);
      }
    }
    ed.commands.focus();
  }, []);

  const editor = useEditor({
    // Next render trước ở server; để true sẽ lệch hydration
    immediatelyRender: false,
    // Thiếu cờ này thì TipTap v3 không render lại khi con trỏ di chuyển, nên
    // các nút trên thanh công cụ không sáng/tắt theo định dạng tại chỗ đang gõ.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }, // h1 dành cho tiêu đề bài, trong nội dung bắt đầu từ h2
      }),
      Link.configure({
        openOnClick: false, // đang soạn thì bấm link là để sửa, không phải mở
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      AnhBaiViet.configure({ HTMLAttributes: { loading: "lazy" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Bắt đầu viết bài ở đây…" }),
    ],
    content: value,
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // prose-article: dùng lại đúng bộ kiểu chữ của trang đọc, nên nhìn lúc
        // soạn giống hệt lúc đăng
        class: "prose-article min-h-[420px] px-4 py-3 focus:outline-none",
      },
      // Chụp màn hình rồi Ctrl+V thẳng vào bài — nhanh hơn hẳn lưu file ra
      // Desktop rồi bấm nút chèn ảnh
      handlePaste: (view, event) => {
        const anh = locFileAnh(event.clipboardData?.files);
        if (anh.length === 0) return false;
        event.preventDefault();
        chenNhieuAnh(anh, view.state.selection.from);
        return true;
      },
      handleDrop: (view, event) => {
        const e = event as DragEvent;
        const anh = locFileAnh(e.dataTransfer?.files);
        if (anh.length === 0) return false;
        event.preventDefault();
        // Thả ở đâu chèn ở đó, không nhảy về chỗ con trỏ cũ
        const diem = view.posAtCoords({ left: e.clientX, top: e.clientY });
        chenNhieuAnh(anh, diem?.pos ?? view.state.selection.from);
        return true;
      },
    },
  });

  // Đồng bộ nội dung khi giá trị value thay đổi từ chế độ HTML
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

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
