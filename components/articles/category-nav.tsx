"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Home } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav aria-label="Chuyên mục" className="border-b border-border/60 bg-card/40 backdrop-blur-xs">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/"
          aria-label="Trang chủ"
          aria-current={oTrangChu && !dangChon ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center justify-center size-8 rounded-xl transition-all duration-150",
            oTrangChu && !dangChon
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          <Home className="size-4" />
        </Link>

        <Link
          href="/huong-dan"
          aria-current={pathname === "/huong-dan" && !dangChon ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150",
            pathname === "/huong-dan" && !dangChon
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          <Compass className="size-3.5" />
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
                "shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
