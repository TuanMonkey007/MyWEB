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
    <div className="flex min-h-dvh flex-col bg-muted/35 text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-extrabold tracking-wide text-primary-foreground shadow-xs">
              HNF
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">HỮU NGHỊ FOOD</span>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Cổng quản trị DMS và dữ liệu tập trung</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" /> Trang chủ
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nhập tên tài khoản và mật khẩu đã được cấp để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-foreground">
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
                  className="h-10 pl-9 text-xs font-medium sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
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
                  className="h-10 pl-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 h-10.5 w-full text-xs font-semibold sm:text-sm"
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

          <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Hữu Nghị Food • Phòng DMS & CNTT
          </div>
        </div>
      </div>
    </div>
  );
}
