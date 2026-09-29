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
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & HNF Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-extrabold tracking-wide text-primary-foreground shadow-xs">
              HNF
            </div>
            <div>
              <span className="block text-xs font-semibold leading-tight text-foreground sm:text-sm">
                {platformName}
              </span>
              <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">
                Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
              </span>
            </div>
          </Link>
        </div>

        {/* Live Status Badge */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            href="/dong-ho"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Đồng hồ hệ thống"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Clock className="size-3.5" />
            {now ? (
              <span className="tabular-nums">
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
          <div className="hidden h-5 w-px bg-border sm:block" />
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/finance"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="size-3.5" /> Workspace
              </Link>
              <Link
                href="/articles"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <PenLine className="size-3.5" /> Viết bài
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <LogIn className="size-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
