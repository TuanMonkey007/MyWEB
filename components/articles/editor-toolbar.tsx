"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Nút chỉ có icon: bắt buộc aria-label để đọc màn hình biết nút làm gì, và
// aria-pressed để biết định dạng đang bật hay tắt.
function NutCongCu({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      // onMouseDown + preventDefault: giữ con trỏ trong bài, không thì bấm nút
      // là mất vùng bôi đen
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}

function VachNgan() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const anhRef = useRef<HTMLInputElement>(null);
  const [dangTai, setDangTai] = useState(false);

  async function chenAnh(file: File) {
    setDangTai(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/articles/cover", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Tải ảnh thất bại");
      // Ảnh mang thông tin thì cần mô tả — hỏi ngay lúc chèn, sau này khó nhớ
      const alt = window.prompt("Mô tả ngắn cho ảnh (giúp người khiếm thị hiểu ảnh):") ?? "";
      editor.chain().focus().setImage({ src: `/api/anh-bai-viet/${data.name}`, alt }).run();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setDangTai(false);
    }
  }

  function datLink() {
    const cu = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Địa chỉ liên kết:", cu ?? "https://");
    if (url === null) return;
    if (!url.trim()) return editor.chain().focus().unsetLink().run();
    if (!/^https?:\/\/|^mailto:|^\//i.test(url.trim()))
      return toast.error("Liên kết phải bắt đầu bằng http://, https://, mailto: hoặc /");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
      <NutCongCu label="Hoàn tác" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="size-4" />
      </NutCongCu>
      <NutCongCu label="Làm lại" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="size-4" />
      </NutCongCu>
      <VachNgan />

      <NutCongCu label="Tiêu đề mục" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </NutCongCu>
      <NutCongCu label="Tiêu đề phụ" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </NutCongCu>
      <VachNgan />

      <NutCongCu label="In đậm" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </NutCongCu>
      <NutCongCu label="In nghiêng" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </NutCongCu>
      <NutCongCu label="Gạch ngang" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </NutCongCu>
      <VachNgan />

      <NutCongCu label="Danh sách gạch đầu dòng" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </NutCongCu>
      <NutCongCu label="Danh sách đánh số" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </NutCongCu>
      <NutCongCu label="Trích dẫn" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </NutCongCu>
      <NutCongCu label="Khối lệnh" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className="size-4" />
      </NutCongCu>
      <VachNgan />

      <NutCongCu label="Canh trái" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="size-4" />
      </NutCongCu>
      <NutCongCu label="Canh giữa" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="size-4" />
      </NutCongCu>
      <NutCongCu label="Canh phải" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="size-4" />
      </NutCongCu>
      <VachNgan />

      <NutCongCu label="Chèn liên kết" active={editor.isActive("link")} onClick={datLink}>
        <Link2 className="size-4" />
      </NutCongCu>
      <NutCongCu label="Bỏ liên kết" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}>
        <Link2Off className="size-4" />
      </NutCongCu>
      <NutCongCu label="Chèn ảnh" disabled={dangTai} onClick={() => anhRef.current?.click()}>
        {dangTai ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
      </NutCongCu>
      <NutCongCu label="Chèn bảng 3x3" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon className="size-4" />
      </NutCongCu>
      <NutCongCu label="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </NutCongCu>

      <input
        ref={anhRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) chenAnh(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
