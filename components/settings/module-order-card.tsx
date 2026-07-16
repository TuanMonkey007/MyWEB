"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULE_REGISTRY } from "@/lib/modules";

// Admin sắp thứ tự module hiển thị trên sidebar (lên/xuống, lưu ngay)
export function ModuleOrderCard({ order }: { order: string[] }) {
  const router = useRouter();
  const [ids, setIds] = useState(order);
  const [saving, setSaving] = useState(false);

  const label = (id: string) =>
    MODULE_REGISTRY.find((m) => m.id === id)?.label ?? id;

  async function save(next: string[]) {
    setIds(next);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleOrder: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Lưu thứ tự thất bại");
      setIds(order);
    } finally {
      setSaving(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thứ tự module trên sidebar</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {ids.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
            >
              <GripVertical className="size-4 text-muted-foreground" />
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">{label(id)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={i === 0 || saving}
                onClick={() => move(i, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={i === ids.length - 1 || saving}
                onClick={() => move(i, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Áp dụng cho mọi tài khoản (chỉ hiện những module tài khoản đó được cấp).
        </p>
      </CardContent>
    </Card>
  );
}
