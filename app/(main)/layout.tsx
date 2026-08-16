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
  if (!user) redirect("/login"); // proxy đã chặn — lớp bảo hiểm thứ hai

  const nav = {
    allowedModules: userModules(user),
    isAdmin: user.role === "ADMIN",
    userName: user.displayName || user.username,
    moduleOrder: settings.moduleOrder,
  };

  return (
    <PermissionsProvider permissions={clientPermissions(user)} isAdmin={user.role === "ADMIN"}>
      <div className="flex min-h-dvh w-full">
        <AppSidebar
          platformName={settings.platformName}
          faviconPath={settings.faviconPath}
          {...nav}
        />
        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          {/* max-w-7xl thay 6xl: bảng ngân sách 11 cột trước đây phải cuộn ngang
              trong khi hai bên còn thừa chỗ. Nội dung chữ vẫn nằm trong thẻ nên
              không bị dài quá tầm mắt. */}
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
        <AppBottomNav {...nav} />
      </div>
    </PermissionsProvider>
  );
}
