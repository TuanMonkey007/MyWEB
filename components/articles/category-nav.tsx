"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Thanh chuyên mục ngang kiểu trang báo. Trên màn hẹp cuộn ngang được thay vì
// xuống dòng lộn xộn — nhưng CHỈ thanh này cuộn, cả trang vẫn đứng yên.
export function CategoryNav({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const dangChon = params.get("chuyen-muc");
  const oTrangChu = pathname === "/";

  return (
    <nav aria-label="Chuyên mục" className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/"
          aria-label="Trang chủ"
          aria-current={oTrangChu && !dangChon ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center border-b-2 px-3 py-2.5 transition-colors",
            oTrangChu && !dangChon
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-4" />
        </Link>
        <Link
          href="/huong-dan"
          aria-current={pathname === "/huong-dan" && !dangChon ? "page" : undefined}
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium uppercase tracking-wide transition-colors",
            pathname === "/huong-dan" && !dangChon
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Tất cả
        </Link>
        {categories.map((c) => {
          const active = dangChon === c.slug;
          return (
            <Link
              key={c.id}
              href={`/huong-dan?chuyen-muc=${encodeURIComponent(c.slug)}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium uppercase tracking-wide transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
