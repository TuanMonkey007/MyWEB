"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_THEME_COLOR,
  THEME_PRESETS,
  deriveTheme,
  isValidHex,
  themeContrast,
} from "@/lib/theme-color";
import { cn } from "@/lib/utils";

export function ThemeColorPicker({ current }: { current: string }) {
  const router = useRouter();
  const [color, setColor] = useState(current);
  const [saving, setSaving] = useState(false);

  const valid = isValidHex(color);
  // Xem trước ngay tại chỗ — không phải lưu rồi mới biết màu ra sao
  const preview = valid ? deriveTheme(color) : null;
  const ratio = valid ? themeContrast(color) : null;

  async function save() {
    if (!valid) return toast.error("Mã màu phải dạng #RRGGBB");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeColor: color.toUpperCase() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Lưu thất bại");
      toast.success("Đã đổi màu giao diện");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5 text-xs">
        <Palette className="size-3.5" /> Màu nhấn
      </Label>

      <div className="flex flex-wrap gap-2">
        {THEME_PRESETS.map((p) => {
          const active = color.toUpperCase() === p.hex.toUpperCase();
          return (
            <button
              key={p.id}
              type="button"
              title={p.label}
              aria-label={p.label}
              aria-pressed={active}
              onClick={() => setColor(p.hex)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                active && "ring-2 ring-offset-2 ring-ring ring-offset-background"
              )}
              style={{ backgroundColor: p.hex }}
            >
              {active && <Check className="size-4 text-white drop-shadow" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="theme-hex" className="text-xs text-muted-foreground">
            Hoặc tự nhập mã màu
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={valid ? color : DEFAULT_THEME_COLOR}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="size-9 cursor-pointer rounded border bg-transparent p-0.5"
              aria-label="Bảng chọn màu"
            />
            <Input
              id="theme-hex"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#4F46E5"
              className={cn("w-32 font-mono", !valid && "border-destructive")}
            />
          </div>
        </div>
        <Button onClick={save} disabled={saving || !valid || color.toUpperCase() === current.toUpperCase()}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null} Áp dụng
        </Button>
        {color.toUpperCase() !== DEFAULT_THEME_COLOR && (
          <Button variant="ghost" size="sm" onClick={() => setColor(DEFAULT_THEME_COLOR)}>
            <RotateCcw className="size-3.5" /> Mặc định
          </Button>
        )}
      </div>

      {preview && ratio && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Xem trước</p>
          <div className="flex flex-wrap gap-2">
            {/* Nền sáng */}
            <div
              className="flex items-center gap-2 rounded-md border px-3 py-2"
              style={{ background: "#F8FAFC" }}
            >
              <span
                className="rounded px-2.5 py-1 text-xs font-medium"
                style={{ background: preview.light["--primary"], color: "#fff" }}
              >
                Nút chính
              </span>
              <span className="text-xs" style={{ color: preview.light["--accent-foreground"] }}>
                Chữ nhấn
              </span>
            </div>
            {/* Nền tối */}
            <div
              className="flex items-center gap-2 rounded-md border px-3 py-2"
              style={{ background: "#0B1120", borderColor: "#2A3648" }}
            >
              <span
                className="rounded px-2.5 py-1 text-xs font-medium"
                style={{ background: preview.dark["--primary"], color: "#0B1120" }}
              >
                Nút chính
              </span>
              <span className="text-xs" style={{ color: preview.dark["--accent-foreground"] }}>
                Chữ nhấn
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Độ tương phản: nền sáng <b>{ratio.lightOnWhite.toFixed(1)}:1</b> · nền tối{" "}
            <b>{ratio.darkOnBg.toFixed(1)}:1</b> — hệ thống tự chỉnh độ sáng để luôn
            đạt chuẩn 4.5:1, nên chọn màu nào cũng đọc được.
          </p>
        </div>
      )}
    </div>
  );
}
