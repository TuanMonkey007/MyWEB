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
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-extrabold tracking-wide text-primary-foreground shadow-xs">
                  HNF
                </div>
                <div>
                  <span className="block text-xs font-semibold leading-tight text-foreground sm:text-sm">
                    {settings.platformName}
                  </span>
                  <span className="hidden text-[10px] leading-tight text-muted-foreground sm:block">
                    Hệ thống Quản trị & Điều hành Dữ liệu Tập trung
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href="/account"
                className="hidden min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
              >
                <CircleUser className="size-3.5" />
                <span>{nav.userName}</span>
              </Link>
              <div className="hidden h-5 w-px bg-border sm:block" />
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
          <main className="min-w-0 flex-1 overflow-y-auto bg-muted/35 p-4 pb-24 sm:p-5 md:pb-8 lg:p-6">
            <div className="mx-auto w-full max-w-7xl space-y-5">
              {children}
            </div>
          </main>
          <AppBottomNav {...nav} />
        </div>
      </div>
    </PermissionsProvider>
  );
}
