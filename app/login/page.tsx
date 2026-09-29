"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2, Lock, Shield, User } from "lucide-react";
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
    <div className="relative flex min-h-dvh items-center justify-center p-4 overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border/70 bg-card/85 p-7 sm:p-9 shadow-2xl backdrop-blur-xl transition-all">
          <div className="text-center space-y-2">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground shadow-lg shadow-primary/30">
              <Shield className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Nhập thông tin tài khoản để truy cập platform cá nhân
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold text-foreground/80">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="pl-10 h-10 rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">
                Mật khẩu
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 rounded-xl h-10.5 font-semibold shadow-md shadow-primary/20"
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
                  Đăng nhập
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/50 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" /> Quay về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
