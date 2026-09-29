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
    <header className="bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#9f1239] text-white shadow-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand & HNF Badge */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-white text-[#881337] px-2.5 py-1 rounded-xl shadow font-black text-lg tracking-wider">
              HNF
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                {platformName}
              </div>
              <p className="text-[11px] text-rose-200 hidden sm:block">
                Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
              </p>
            </div>
          </Link>
        </div>

        {/* Live Status Badge */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            href="/dong-ho"
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-200 border border-rose-500/30 hover:bg-rose-950/80 transition-colors"
            title="Đồng hồ hệ thống"
          >
            <span className="w-2 h-2 mr-2 bg-emerald-400 rounded-full animate-pulse" />
            <Clock className="size-3.5 mr-1" />
            {now ? (
              <span className="tabular-nums">
                {now.toLocaleTimeString("vi-VN")} · {now.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
              </span>
            ) : (
              <span className="inline-block w-28" />
            )}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/finance"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 font-bold transition-all text-xs"
              >
                <LayoutDashboard className="size-3.5" /> Workspace
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold shadow-xs transition-all text-xs"
              >
                <PenLine className="size-3.5" /> Viết bài
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-[#881337] hover:bg-rose-50 px-3.5 py-1.5 font-bold shadow-sm transition-all text-xs"
            >
              <LogIn className="size-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
