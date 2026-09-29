import { redirect } from "next/navigation";
import { AppSidebar, AppBottomNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { clientPermissions, userModules } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { PermissionsProvider } from "@/components/permissions-provider";

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
      <div className="flex min-h-dvh w-full bg-background relative overflow-x-hidden selection:bg-primary/20 selection:text-primary">
        <div className="pointer-events-none fixed -top-32 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none fixed top-1/3 -left-32 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

        <AppSidebar
          platformName={settings.platformName}
          faviconPath={settings.faviconPath}
          {...nav}
        />
        <main className="flex-1 min-w-0 pb-24 md:pb-10 relative">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
        <AppBottomNav {...nav} />
      </div>
    </PermissionsProvider>
  );
}
