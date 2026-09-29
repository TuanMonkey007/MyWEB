"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock, LayoutDashboard, LogIn, PenLine, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground shadow-sm shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="size-4.5" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            {platformName}
          </span>
        </Link>

        {/* World Clock Pill */}
        <Link
          href="/dong-ho"
          className="hidden sm:flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground shadow-2xs hover:border-border hover:bg-accent/60 hover:text-foreground transition-all duration-150"
          title="Xem đồng hồ thế giới"
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <Clock className="size-3.5" />
          {now ? (
            <span className="tabular-nums font-medium">
              {now.toLocaleTimeString("vi-VN")} ·{" "}
              {now.toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          ) : (
            <span className="inline-block w-36" />
          )}
        </Link>

        {/* Actions & Theme */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/finance"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="size-3.5" />
                <span className="hidden sm:inline">Workspace</span>
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                <PenLine className="size-3.5" /> Viết bài
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <LogIn className="size-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
