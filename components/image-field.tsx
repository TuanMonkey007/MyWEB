"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Trạng thái ảnh của form (FR-5: tối đa 1 ảnh, tùy chọn)
export type ImageValue = {
  file: File | null; // ảnh mới chọn (chưa upload)
  removeExisting: boolean; // người dùng bấm gỡ ảnh đang có
};

export const emptyImageValue: ImageValue = { file: null, removeExisting: false };

// Chốt imagePath cuối cùng trước khi lưu giao dịch:
// ảnh mới -> upload lấy tên file; gỡ -> null; giữ nguyên -> existingPath
export async function resolveImagePath(
  value: ImageValue,
  existingPath: string | null
): Promise<string | null> {
  if (value.file) {
    const form = new FormData();
    form.append("file", value.file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Upload ảnh thất bại");
    }
    return (await res.json()).imagePath as string;
  }
  if (value.removeExisting) return null;
  return existingPath;
}

export function ImageField({
  value,
  onChange,
  existingPath,
}: {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  existingPath: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const showExisting = existingPath && !value.removeExisting && !value.file;
  const shownUrl = previewUrl ?? (showExisting ? `/api/images/${existingPath}` : null);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) onChange({ file, removeExisting: false });
          e.target.value = "";
        }}
      />
      {shownUrl ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shownUrl}
            alt="Ảnh hóa đơn"
            className="max-h-40 rounded-md border object-contain"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" /> Thay ảnh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ file: null, removeExisting: true })}
            >
              <X className="size-4" /> Gỡ ảnh
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" /> Đính ảnh hóa đơn
        </Button>
      )}
    </div>
  );
}
