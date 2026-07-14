import { AppSidebar, AppBottomNav } from "@/components/app-nav";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
      <AppBottomNav />
    </div>
  );
}
