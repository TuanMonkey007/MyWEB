import Link from "next/link";
import { SiteHeader } from "@/components/articles/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function MarketsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSettings(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF7F0] dark:bg-[#18110B] text-foreground">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t-2 border-[#1C1917] bg-[#140D07] py-6 text-xs text-[#FAF7F0] dark:border-stone-800">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 text-center sm:text-left">
          <span>
            {settings.platformName} · Hệ thống theo dõi biểu đồ & giá thị trường trực tiếp
          </span>
          <div className="flex items-center gap-4 text-stone-300">
            <Link href="/" className="underline-offset-2 hover:underline hover:text-primary">
              Trang chủ
            </Link>
            <Link href="/dong-ho" className="underline-offset-2 hover:underline hover:text-primary">
              Đồng hồ
            </Link>
            <Link href="/bai-viet" className="underline-offset-2 hover:underline hover:text-primary">
              Tài liệu
            </Link>
            {user ? (
              <Link href="/finance" className="font-bold text-primary underline-offset-2 hover:underline">
                Vào Workspace →
              </Link>
            ) : (
              <Link href="/login" className="font-bold text-primary underline-offset-2 hover:underline">
                Đăng nhập →
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
