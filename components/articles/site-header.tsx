"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock, LayoutDashboard, LogIn, PenLine } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function dangKy(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const giayHienTai = () => Math.floor(Date.now() / 1000);
const khongCoOServer = () => null;

export function SiteHeader({
  platformName,
  isLoggedIn,
}: {
  platformName: string;
  isLoggedIn: boolean;
}) {
  const giay = useSyncExternalStore(dangKy, giayHienTai, khongCoOServer);
  const now = giay === null ? null : new Date(giay * 1000);

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b-2 border-[#1C1917] bg-[#FAF7F0] dark:bg-[#1E140C] shadow-neo-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & HNF Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-xs font-black tracking-wide text-primary-foreground shadow-neo-sm">
              HNF
            </div>
            <div>
              <span className="block font-editorial text-sm sm:text-base font-bold leading-tight text-foreground tracking-tight">
                {platformName}
              </span>
              <span className="hidden text-[10px] font-semibold leading-tight text-muted-foreground sm:block">
                Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
              </span>
            </div>
          </Link>
        </div>

        {/* Live Status Badge */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            href="/dong-ho"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white px-2.5 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card dark:text-foreground"
            title="Đồng hồ hệ thống"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-[#1C1917]" />
            <Clock className="size-3.5 text-primary" />
            {now ? (
              <span className="tabular-nums font-mono">
                {now.toLocaleTimeString("vi-VN")} ·{" "}
                {now.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            ) : (
              <span className="inline-block w-28" />
            )}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden h-5 w-0.5 bg-[#1C1917] sm:block dark:bg-stone-700" />
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/finance"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white px-3 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card dark:text-foreground"
              >
                <LayoutDashboard className="size-3.5 text-primary" /> Workspace
              </Link>
              <Link
                href="/articles"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-primary px-3 text-xs font-bold text-primary-foreground shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <PenLine className="size-3.5" /> Viết bài
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <LogIn className="size-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
