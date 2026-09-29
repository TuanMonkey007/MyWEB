import Link from "next/link";
import { CategoryNav } from "@/components/articles/category-nav";
import { SiteHeader } from "@/components/articles/site-header";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";

// Khu công khai — dùng chung header + thanh chuyên mục với trang chủ
export default async function BaiVietLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, settings, categories] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    listCategories(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF7F0] dark:bg-[#18110B] text-foreground">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <CategoryNav categories={categories} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t-2 border-[#1C1917] bg-[#140D07] py-6 text-center text-xs text-[#FAF7F0] dark:border-stone-800">
        {settings.platformName} ·{" "}
        <Link href="/dong-ho" className="underline-offset-2 hover:underline text-primary font-bold">
          Đồng hồ thế giới
        </Link>
      </footer>
    </div>
  );
}
