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
    <nav aria-label="Chuyên mục" className="border-b-2 border-[#1C1917] bg-[#FAF7F0] dark:bg-[#1E140C] dark:border-stone-800">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/"
          aria-label="Trang chủ"
          aria-current={oTrangChu && !dangChon ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center justify-center size-8 rounded-xs border-2 transition-all duration-150",
            oTrangChu && !dangChon
              ? "border-[#1C1917] bg-primary text-primary-foreground font-semibold shadow-neo-sm"
              : "border-transparent text-muted-foreground hover:border-[#1C1917] hover:bg-white hover:text-foreground"
          )}
        >
          <Home className="size-4" />
        </Link>

        <Link
          href="/bai-viet"
          aria-current={pathname === "/bai-viet" && !dangChon ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xs border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all duration-150",
            pathname === "/bai-viet" && !dangChon
              ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm"
              : "border-transparent text-muted-foreground hover:border-[#1C1917] hover:bg-white hover:text-foreground"
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
              href={`/bai-viet?chuyen-muc=${encodeURIComponent(c.slug)}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xs border-2 px-3 py-1 text-xs font-bold transition-all duration-150",
                active
                  ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm"
                  : "border-transparent text-muted-foreground hover:border-[#1C1917] hover:bg-white hover:text-foreground"
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
