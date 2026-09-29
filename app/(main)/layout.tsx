import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleUser } from "lucide-react";
import { AppSidebar, AppBottomNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { clientPermissions, userModules } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { PermissionsProvider } from "@/components/permissions-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  if (!user) redirect("/login");

  const nav = {
    allowedModules: userModules(user),
    isAdmin: user.role === "ADMIN",
    userName: user.displayName || user.username,
    moduleOrder: settings.moduleOrder,
  };

  return (
    <PermissionsProvider permissions={clientPermissions(user)} isAdmin={user.role === "ADMIN"}>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        {/* BANNER HEADER XUYÊN SUỐT TOÀN BỘ MÀN HÌNH — TẠO NỀN TẢNG ĐỒNG BỘ 100% GIỮA NAV VÀ CONTENT */}
        <header className="bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#9f1239] text-white shadow-sm sticky top-0 z-40 h-13 shrink-0 border-b border-[#4c0519]">
          <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full">
            {/* Logo HNF + Tiêu đề nền tảng */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5">
                <div className="bg-white text-[#881337] px-2 py-0.5 rounded shadow font-black text-xs tracking-wider">
                  HNF
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase block leading-tight">
                    {settings.platformName}
                  </span>
                  <span className="text-[10px] text-rose-200 hidden sm:block leading-tight">
                    Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
                  </span>
                </div>
              </Link>
            </div>

            {/* Thông tin User + Theme Toggle + Logout */}
            <div className="flex items-center space-x-2">
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
                title="Tài khoản của tôi"
              >
                <CircleUser className="size-3.5" />
                <span>{nav.userName}</span>
              </Link>
              <div className="h-3.5 w-px bg-rose-400/40 hidden sm:block" />
              <ThemeToggle />
              <LogoutButton iconOnly />
            </div>
          </div>
        </header>

        {/* VÙNG THÂN CHUNG: CẢ SIDEBAR VÀ MAIN ĐỀU NẰM DƯỚI HEADER CHUNG, DÙNG CHUNG HỆ MÀU SEMANTIC */}
        <div className="flex flex-1 min-h-0">
          <AppSidebar
            platformName={settings.platformName}
            faviconPath={settings.faviconPath}
            {...nav}
          />
          <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-24 md:pb-10 bg-background">
            <div className="mx-auto w-full max-w-7xl space-y-4">
              {children}
            </div>
          </main>
          <AppBottomNav {...nav} />
        </div>
      </div>
    </PermissionsProvider>
  );
}
