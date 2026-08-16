"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Check, ImagePlus, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  type AppSettings,
} from "@/lib/settings-constants";
import { ThemeColorPicker } from "@/components/settings/theme-color-picker";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Sáng", icon: Sun },
  { id: "dark", label: "Tối", icon: Moon },
  { id: "system", label: "Theo máy", icon: Monitor },
];

export function AppearanceSettings({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(settings.platformName);
  const [savingName, setSavingName] = useState(false);
  const faviconRef = useRef<HTMLInputElement>(null);
  // theme chỉ biết được ở client — tránh hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function put(payload: Record<string, string>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Lưu thất bại");
    }
  }

  async function handleFont(v: string) {
    try {
      await put({ fontFamily: v });
      toast.success("Đã đổi font chữ");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function handleSize(v: string) {
    try {
      await put({ fontSize: v });
      toast.success("Đã đổi cỡ chữ");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function handleSaveName() {
    setSavingName(true);
    try {
      await put({ platformName: name });
      toast.success("Đã đổi tên platform");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setSavingName(false);
    }
  }

  async function handleFavicon(file: File | null) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/settings/favicon", { method: "POST", body: form });
    if (res.ok) {
      toast.success("Đã đổi favicon — tải lại trang để thấy trên tab trình duyệt");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Upload thất bại");
    }
  }

  async function handleRemoveFavicon() {
    await fetch("/api/settings/favicon", { method: "DELETE" });
    toast.success("Đã gỡ favicon");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Giao diện</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Chế độ màu</Label>
          <div className="flex gap-2">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const active = mounted && theme === id;
              return (
                <Button
                  key={id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(id)}
                  className={cn(active && "pointer-events-none")}
                >
                  <Icon className="size-4" /> {label}
                </Button>
              );
            })}
          </div>
        </div>

        <ThemeColorPicker current={settings.themeColor} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Font chữ</Label>
            <Select defaultValue={settings.fontFamily} onValueChange={handleFont}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cỡ chữ</Label>
            <Select defaultValue={settings.fontSize} onValueChange={handleSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pf-name">Tên platform (hiện trên sidebar & tab trình duyệt)</Label>
          <div className="flex gap-2">
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
            <Button onClick={handleSaveName} disabled={savingName || !name.trim()}>
              <Check className="size-4" /> Lưu
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Favicon / icon platform</Label>
          <input
            ref={faviconRef}
            type="file"
            accept=".ico,.png,.svg,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              handleFavicon(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-3">
            {settings.faviconPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/branding/favicon?v=${encodeURIComponent(settings.faviconPath)}`}
                alt="favicon"
                className="size-8 rounded border object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Chưa có — dùng mặc định</span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => faviconRef.current?.click()}
            >
              <ImagePlus className="size-4" /> {settings.faviconPath ? "Thay" : "Tải lên"}
            </Button>
            {settings.faviconPath && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRemoveFavicon}
              >
                <Trash2 className="size-4" /> Gỡ
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
