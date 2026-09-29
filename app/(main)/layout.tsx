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
      <div className="flex min-h-dvh flex-col bg-[#FAF7F0] dark:bg-[#18110B] text-foreground">
        <header className="sticky top-0 z-40 h-14 shrink-0 border-b-2 border-[#1C1917] bg-[#FAF7F0] dark:bg-[#1E140C] shadow-neo-sm">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#F25C2B] text-xs font-black tracking-wider text-white shadow-neo-sm">
                  HNF
                </div>
                <div>
                  <span className="block font-editorial text-sm sm:text-base font-bold leading-tight text-foreground tracking-tight">
                    {settings.platformName}
                  </span>
                  <span className="hidden text-[10px] font-semibold leading-tight text-muted-foreground sm:block">
                    Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="hidden min-h-8 items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white px-2.5 text-xs font-bold text-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all dark:bg-card dark:text-foreground sm:flex"
              >
                <CircleUser className="size-3.5 text-[#F25C2B]" />
                <span>{nav.userName}</span>
              </Link>
              <div className="hidden h-5 w-0.5 bg-[#1C1917] sm:block dark:bg-stone-700" />
              <ThemeToggle />
              <LogoutButton iconOnly />
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <AppSidebar
            platformName={settings.platformName}
            faviconPath={settings.faviconPath}
            {...nav}
          />
          <main className="min-w-0 flex-1 overflow-y-auto bg-[#FAF7F0] dark:bg-[#18110B] p-4 pb-24 sm:p-5 md:pb-8 lg:p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              {children}
            </div>
          </main>
          <AppBottomNav {...nav} />
        </div>
      </div>
    </PermissionsProvider>
  );
}
