"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Option } from "@/components/forms/transaction-form";

const ALL = "__all__";

// FR-6: lọc theo loại/thời gian/ví/danh mục + tìm theo tên (qua URL params)
export function TransactionFilters({
  wallets,
  categories,
}: {
  wallets: Option[];
  categories: (Option & { kind: string })[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  // debounce ô tìm kiếm
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => set("q", q || null), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const hasFilters = ["type", "q", "walletId", "categoryId", "from", "to"].some(
    (k) => params.get(k)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-44 flex-1 sm:max-w-56">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên..."
          className="pl-8"
        />
      </div>

      <Select
        value={params.get("type") ?? ALL}
        onValueChange={(v) => set("type", v === ALL ? null : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả loại</SelectItem>
          <SelectItem value="expense">Khoản chi</SelectItem>
          <SelectItem value="income">Khoản thu</SelectItem>
          <SelectItem value="transfer">Chuyển khoản</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.get("walletId") ?? ALL}
        onValueChange={(v) => set("walletId", v === ALL ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả ví</SelectItem>
          {wallets.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("categoryId") ?? ALL}
        onValueChange={(v) => set("categoryId", v === ALL ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả danh mục</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.kind === "EXPENSE" ? "Chi · " : "Thu · "}
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={params.get("from") ?? ""}
          onChange={(e) => set("from", e.target.value || null)}
          className="w-36"
          aria-label="Từ ngày"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="date"
          value={params.get("to") ?? ""}
          onChange={(e) => set("to", e.target.value || null)}
          className="w-36"
          aria-label="Đến ngày"
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <X className="size-4" /> Xóa lọc
        </Button>
      )}
    </div>
  );
}
