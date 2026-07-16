import { redirect } from "next/navigation";
import { AppSidebar, AppBottomNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { userModuleIds } from "@/lib/modules";
import { getSettings } from "@/lib/settings";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  if (!user) redirect("/login"); // proxy đã chặn — lớp bảo hiểm thứ hai

  const nav = {
    allowedModules: userModuleIds(user),
    isAdmin: user.role === "ADMIN",
    userName: user.displayName || user.username,
    moduleOrder: settings.moduleOrder,
  };

  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar
        platformName={settings.platformName}
        faviconPath={settings.faviconPath}
        {...nav}
      />
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
      <AppBottomNav {...nav} />
    </div>
  );
}
