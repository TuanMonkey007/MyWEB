import Link from "next/link";
import { BookOpen, LogIn } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

// Khu công khai — KHÔNG dùng layout (main) vì đây là trang ai cũng vào được,
// không có sidebar module.
export default async function HuongDanLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/huong-dan" className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-5 text-primary" />
            Hướng dẫn kỹ thuật
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            {settings.platformName}
          </Link>
          <div className="ml-auto text-sm">
            {user ? (
              <Link href="/articles" className="text-primary underline-offset-2 hover:underline">
                Quản lý bài viết
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogIn className="size-4" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {settings.platformName}
      </footer>
    </div>
  );
}
