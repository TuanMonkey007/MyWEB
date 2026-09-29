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
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-800">
      {/* Top Banner HNF */}
      <div className="bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#9f1239] py-3 px-4 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-[#881337] px-2.5 py-0.5 rounded-lg shadow font-black text-lg tracking-wider">
              HNF
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">HỮU NGHỊ FOOD (HNF)</span>
              <p className="text-[11px] text-rose-200">Cổng Quản Trị Hệ Thống DMS & Quản Lý Tập Trung</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-rose-200 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Trang chủ
          </Link>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#881337] border border-rose-100 shadow-xs">
              <ShieldCheck className="size-6 text-[#9f1239]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs text-slate-500">
              Nhập tên tài khoản và mật khẩu đã được cấp để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold text-slate-700">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-[#9f1239] text-xs sm:text-sm font-medium"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                Mật khẩu
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-[#9f1239] text-xs sm:text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 rounded-xl h-10.5 font-bold text-xs sm:text-sm bg-[#9f1239] hover:bg-[#881337] text-white shadow-sm transition-all"
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
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Hữu Nghị Food • Phòng DMS & CNTT
          </div>
        </div>
      </div>
    </div>
  );
}
