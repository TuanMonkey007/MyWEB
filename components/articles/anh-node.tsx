"use client";

import { useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Text } from "lucide-react";
import { cn } from "@/lib/utils";

const NHO_NHAT = 10; // dưới 10% thì ảnh bé đến mức không nhìn được nữa

const kep = (v: number) => Math.min(100, Math.max(NHO_NHAT, Math.round(v)));

const CANH_LE = ["trai", "giua", "phai"] as const;
type CanhLe = (typeof CANH_LE)[number];
const laCanhLe = (v: unknown): v is CanhLe => CANH_LE.includes(v as CanhLe);

/**
 * Kéo sang phải làm ảnh rộng thêm bao nhiêu phần trăm.
 *
 * Ảnh canh giữa nở đều hai bên nên mép phải chỉ đi được nửa quãng — không nhân
 * đôi thì kéo cảm giác nặng, chuột đi một đằng ảnh theo một nẻo. Ảnh canh phải
 * ghim mép phải, muốn to hơn phải kéo ngược sang trái.
 */
function heSoKeo(canhLe: CanhLe): number {
  if (canhLe === "giua") return 2;
  if (canhLe === "phai") return -1;
  return 1;
}

function NutNho({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      // Giữ ảnh ở trạng thái đang chọn: bấm nút mà mất vùng chọn thì thanh này
      // biến mất ngay trước khi kịp nhả chuột
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary-foreground text-primary"
          : "text-primary-foreground/80 hover:bg-primary-foreground/20"
      )}
    >
      {children}
    </button>
  );
}

function AnhView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const boc = useRef<HTMLDivElement>(null);
  // Trong lúc kéo thì hiện kích thước tạm ở đây, nhả chuột mới ghi vào tài liệu
  // — nếu ghi liên tục thì mỗi lần kéo sinh cả trăm bước hoàn tác.
  const [dangKeo, setDangKeo] = useState<number | null>(null);

  const canhLe: CanhLe = laCanhLe(node.attrs.canhLe) ? node.attrs.canhLe : "trai";
  const rong: number | null = dangKeo ?? (node.attrs.width as number | null);
  const suaDuoc = editor.isEditable;

  function batDauKeo(e: React.PointerEvent<HTMLButtonElement>) {
    if (!suaDuoc) return;
    e.preventDefault();
    const anh = boc.current?.querySelector("img");
    const khung = boc.current?.parentElement;
    if (!anh || !khung) return;

    const khungRong = khung.getBoundingClientRect().width;
    if (khungRong <= 0) return;
    const batDauX = e.clientX;
    const banDau = rong ?? (anh.getBoundingClientRect().width / khungRong) * 100;
    const heSo = heSoKeo(canhLe);
    const nut = e.currentTarget;
    nut.setPointerCapture(e.pointerId);

    let cuoi = kep(banDau);
    const keo = (ev: PointerEvent) => {
      cuoi = kep(banDau + ((ev.clientX - batDauX) / khungRong) * 100 * heSo);
      setDangKeo(cuoi);
    };
    const xong = () => {
      nut.removeEventListener("pointermove", keo);
      nut.removeEventListener("pointerup", xong);
      nut.removeEventListener("pointercancel", xong);
      updateAttributes({ width: cuoi });
      setDangKeo(null);
    };
    nut.addEventListener("pointermove", keo);
    nut.addEventListener("pointerup", xong);
    nut.addEventListener("pointercancel", xong);
  }

  // Không dùng chuột được thì vẫn đổi kích thước bằng phím mũi tên trên tay nắm
  function phimKeo(e: React.KeyboardEvent) {
    const buoc = e.key === "ArrowLeft" ? -5 : e.key === "ArrowRight" ? 5 : 0;
    if (!buoc) return;
    e.preventDefault();
    const anh = boc.current?.querySelector("img");
    const khungRong = boc.current?.parentElement?.getBoundingClientRect().width ?? 0;
    const banDau =
      rong ?? (anh && khungRong > 0 ? (anh.getBoundingClientRect().width / khungRong) * 100 : 100);
    updateAttributes({ width: kep(banDau + buoc) });
  }

  function suaMoTa() {
    const cu = (node.attrs.alt as string) ?? "";
    const moi = window.prompt("Mô tả ngắn cho ảnh (giúp người khiếm thị hiểu ảnh):", cu);
    if (moi !== null) updateAttributes({ alt: moi });
  }

  return (
    <NodeViewWrapper
      ref={boc}
      className={cn(
        "anh-boc relative my-4 flex",
        canhLe === "giua" && "justify-center",
        canhLe === "phai" && "justify-end"
      )}
    >
      <div className="relative inline-block max-w-full" style={rong ? { width: `${rong}%` } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? undefined}
          draggable={false}
          className={cn(
            "block h-auto w-full rounded-lg border",
            selected && "outline outline-2 outline-offset-2 outline-primary"
          )}
        />

        {suaDuoc && selected && (
          <>
            <div className="absolute -top-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-md bg-primary px-1 py-1 shadow-md">
              {[25, 50, 75, 100].map((p) => (
                <NutNho
                  key={p}
                  label={`Rộng ${p}%`}
                  active={rong === p}
                  onClick={() => updateAttributes({ width: p })}
                >
                  {p}%
                </NutNho>
              ))}
              <span aria-hidden className="mx-0.5 h-4 w-px bg-primary-foreground/30" />
              <NutNho label="Canh trái" active={canhLe === "trai"} onClick={() => updateAttributes({ canhLe: "trai" })}>
                <AlignLeft className="size-3.5" />
              </NutNho>
              <NutNho label="Canh giữa" active={canhLe === "giua"} onClick={() => updateAttributes({ canhLe: "giua" })}>
                <AlignCenter className="size-3.5" />
              </NutNho>
              <NutNho label="Canh phải" active={canhLe === "phai"} onClick={() => updateAttributes({ canhLe: "phai" })}>
                <AlignRight className="size-3.5" />
              </NutNho>
              <span aria-hidden className="mx-0.5 h-4 w-px bg-primary-foreground/30" />
              <NutNho label="Sửa mô tả ảnh" onClick={suaMoTa}>
                <Text className="size-3.5" />
              </NutNho>
            </div>

            <button
              type="button"
              aria-label={`Kéo để đổi kích thước ảnh (đang ${rong ?? 100}%). Dùng phím mũi tên trái/phải để chỉnh.`}
              onPointerDown={batDauKeo}
              onKeyDown={phimKeo}
              className="absolute -bottom-1.5 -right-1.5 z-10 size-4 cursor-nwse-resize rounded-full border-2 border-background bg-primary shadow"
            />

            {dangKeo !== null && (
              <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                {dangKeo}%
              </span>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Ảnh trong bài viết — thêm kích thước và canh lề so với extension gốc.
 *
 * Kích thước lưu theo PHẦN TRĂM chứ không phải pixel: bài đọc trên điện thoại
 * thì ảnh co theo bề rộng bài, đặt 600px là tràn màn hình. Canh lề lưu bằng
 * class (`anh-giua`) chứ không bằng style, vì bộ lọc HTML ở
 * lib/markdown-sanitize.ts chỉ cho `style` mang đúng vài giá trị định sẵn.
 */
export const AnhBaiViet = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const m = /width:\s*(\d{1,3})%/.exec(el.getAttribute("style") ?? "");
          return m ? kep(Number(m[1])) : null;
        },
        renderHTML: (attrs) =>
          attrs.width ? { style: `width: ${attrs.width}%` } : {},
      },
      canhLe: {
        default: "trai",
        parseHTML: (el) =>
          el.classList.contains("anh-giua")
            ? "giua"
            : el.classList.contains("anh-phai")
              ? "phai"
              : "trai",
        renderHTML: (attrs) => ({
          class: `anh-${laCanhLe(attrs.canhLe) ? attrs.canhLe : "trai"}`,
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(AnhView);
  },
});
