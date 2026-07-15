"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  PiggyBank,
  FileText,
  Settings,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Wallet;
  exact?: boolean;
};

type ModuleGroup = { label: string; items: NavItem[] };

// Platform module hóa: mỗi nhóm là một module (landing "/" là public, ngoài nav)
const MODULES: ModuleGroup[] = [
  {
    label: "Tài chính cá nhân",
    items: [
      { href: "/finance", label: "Tổng quan", icon: LayoutDashboard, exact: true },
      { href: "/finance/wallets", label: "Ví tiền", icon: Wallet },
      { href: "/finance/transactions", label: "Giao dịch", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Đề xuất mua hàng",
    items: [
      { href: "/procurement", label: "Ngân sách", icon: PiggyBank, exact: true },
      { href: "/procurement/proposals", label: "Đề xuất", icon: FileText },
      { href: "/procurement/budget", label: "Thiết lập quỹ", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Công việc",
    items: [{ href: "/todos", label: "Việc cần làm", icon: ClipboardList }],
  },
];

const settingsItem: NavItem = { href: "/settings", label: "Cài đặt", icon: Settings };

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

// Nhóm module đang mở theo URL (mặc định: nhóm đầu — Tài chính)
function currentModule(pathname: string): ModuleGroup {
  return (
    MODULES.find((m) =>
      m.items.some((it) => pathname.startsWith(it.href.split("/").slice(0, 2).join("/")))
    ) ?? MODULES[0]
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

export function AppSidebar({
  platformName = "Platform cá nhân",
  faviconPath = null,
}: {
  platformName?: string;
  faviconPath?: string | null;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        {faviconPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/branding/favicon?v=${encodeURIComponent(faviconPath)}`}
            alt=""
            className="size-5 rounded object-contain"
          />
        ) : (
          <LayoutDashboard className="size-5 text-primary" />
        )}
        <span className="truncate">{platformName}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {MODULES.map((mod) => (
          <div key={mod.label} className="contents">
            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {mod.label}
            </div>
            {mod.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
        <div className="mt-4 border-t pt-2">
          <SidebarLink item={settingsItem} pathname={pathname} />
        </div>
      </nav>
      <div className="flex items-center gap-1 border-t p-2">
        <LogoutButton className="flex-1 justify-start text-muted-foreground" />
        <ThemeToggle />
      </div>
    </aside>
  );
}

// Bottom nav mobile: các mục của module đang dùng + nút Menu mở danh sách module
export function AppBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mod = currentModule(pathname);

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t bg-background">
        {mod.items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
        >
          <LayoutGrid className="size-5" />
          <span>Menu</span>
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="pb-0">
            <SheetTitle>Tất cả module</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 p-4 pt-2">
            {MODULES.map((m) => (
              <div key={m.label}>
                <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {m.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs",
                          isActive(pathname, item)
                            ? "border-primary bg-primary/5 text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3">
              <Link
                href={settingsItem.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Settings className="size-4" /> Cài đặt
              </Link>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <LogoutButton className="text-muted-foreground" />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
