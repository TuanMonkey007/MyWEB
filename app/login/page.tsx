"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Đăng nhập thất bại");
      router.push(data?.redirectTo ?? "/finance");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập thất bại");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF7F0] dark:bg-[#18110B] text-foreground">
      <header className="border-b-2 border-[#1C1917] bg-[#FAF7F0] dark:bg-[#1E140C] shadow-neo-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-xs font-black tracking-wide text-white shadow-neo-sm">
              HNF
            </div>
            <div>
              <span className="block font-editorial text-sm font-bold tracking-tight text-foreground sm:text-base">
                HỮU NGHỊ FOOD
              </span>
              <p className="hidden text-xs font-semibold text-muted-foreground sm:block">Cổng quản trị DMS & dữ liệu tập trung</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-8 items-center gap-1 rounded-xs border-2 border-[#1C1917] bg-white px-2.5 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card dark:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Trang chủ
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-sm border-2 border-[#1C1917] bg-white p-6 sm:p-8 shadow-neo-lg dark:bg-card">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-white shadow-neo-sm">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="font-editorial text-2xl font-bold uppercase tracking-tight text-foreground">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              Nhập tên tài khoản và mật khẩu đã được cấp để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-10 pl-9 text-xs font-bold sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pl-9 text-xs font-bold sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-xs font-black uppercase tracking-widest text-white shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              disabled={loading || !username || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <Lock className="size-4 mr-1.5" />
                  Xác nhận Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="border-t-2 border-[#1C1917] pt-4 text-center text-xs font-bold text-muted-foreground dark:border-stone-800">
            Hữu Nghị Food • Phòng DMS & CNTT
          </div>
        </div>
      </div>
    </div>
  );
}
