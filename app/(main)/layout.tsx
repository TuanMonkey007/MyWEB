import { AppSidebar, AppBottomNav } from "@/components/app-nav";
import { getSettings } from "@/lib/settings";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar
        platformName={settings.platformName}
        faviconPath={settings.faviconPath}
      />
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
      <AppBottomNav />
    </div>
  );
}
