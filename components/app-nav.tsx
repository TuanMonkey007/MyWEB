"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRightLeft,
  BookOpen,
  ClipboardList,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  PiggyBank,
  FileText,
  ScanFace,
  Settings,
  ShieldCheck,
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

type NavItem = {
  href: string;
  label: string;
  icon: typeof Wallet;
  exact?: boolean;
};

type ModuleGroup = { id: string; label: string; items: NavItem[] };

const MODULES: ModuleGroup[] = [
  {
    id: "finance",
    label: "Tài chính cá nhân",
    items: [
      { href: "/finance", label: "Tổng quan", icon: LayoutDashboard, exact: true },
      { href: "/finance/wallets", label: "Ví tiền", icon: Wallet },
      { href: "/finance/transactions", label: "Giao dịch", icon: ArrowLeftRight },
    ],
  },
  {
    id: "procurement",
    label: "Đề xuất mua hàng",
    items: [
      { href: "/procurement", label: "Ngân sách", icon: PiggyBank, exact: true },
      { href: "/procurement/proposals", label: "Đề xuất", icon: FileText },
      { href: "/procurement/budget", label: "Thiết lập quỹ", icon: SlidersHorizontal },
    ],
  },
  {
    id: "todos",
    label: "Công việc",
    items: [{ href: "/todos", label: "Việc cần làm", icon: ClipboardList }],
  },
  {
    id: "drive",
    label: "Kho file",
    items: [{ href: "/drive", label: "Tất cả file", icon: HardDrive }],
  },
  {
    id: "faceid",
    label: "Lọc dữ liệu FaceID",
    items: [{ href: "/faceid", label: "Xử lý dữ liệu", icon: ScanFace }],
  },
  {
    id: "passwords",
    label: "Kho mật khẩu",
    items: [{ href: "/passwords", label: "Mật khẩu", icon: KeyRound }],
  },
  {
    id: "dms",
    label: "DMS",
    items: [{ href: "/dms", label: "Chuyển tuyến NPP", icon: ArrowRightLeft }],
  },
  {
    id: "mailtest",
    label: "Test Mail Relay",
    items: [{ href: "/mailtest", label: "Gửi mail thử", icon: Mail }],
  },
  {
    id: "articles",
    label: "Bài hướng dẫn",
    items: [{ href: "/articles", label: "Quản lý bài viết", icon: BookOpen }],
  },
];

const adminItems: NavItem[] = [
  { href: "/access", label: "Phân quyền", icon: ShieldCheck },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

type NavProps = {
  allowedModules: string[];
  isAdmin: boolean;
  userName: string;
  moduleOrder?: string[];
};

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function visibleModules(allowed: string[], order?: string[]): ModuleGroup[] {
  const shown = MODULES.filter((m) => allowed.includes(m.id));
  if (!order?.length) return shown;
  return [...shown].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

function currentModule(pathname: string, mods: ModuleGroup[]): ModuleGroup | null {
  return (
    mods.find((m) =>
      m.items.some((it) => pathname.startsWith(it.href.split("/").slice(0, 2).join("/")))
    ) ??
    mods[0] ??
    null
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-9 items-center gap-3 rounded-xs px-3 py-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer",
        active
          ? "border-2 border-[#1C1917] bg-primary font-bold text-primary-foreground shadow-neo-sm dark:border-white/80"
          : "border-2 border-transparent font-bold text-stone-700 hover:border-[#1C1917] hover:bg-white hover:text-[#1C1917] hover:shadow-neo-sm dark:text-stone-300 dark:hover:border-white/80 dark:hover:bg-card dark:hover:text-white"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-stone-600 group-hover:text-[#1C1917] dark:text-stone-400 dark:group-hover:text-white")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AppSidebar({
  allowedModules,
  isAdmin,
  moduleOrder,
}: NavProps & {
  platformName?: string;
  faviconPath?: string | null;
}) {
  const pathname = usePathname();
  const mods = visibleModules(allowedModules, moduleOrder);

  return (
    <aside className="hidden w-64 shrink-0 select-none flex-col border-r-2 border-[#1C1917] bg-[#F5EFEB] text-foreground dark:border-stone-800 dark:bg-[#140D07] md:flex">
      <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {mods.map((mod) => (
          <div key={mod.id} className="mt-3 space-y-1 first:mt-0">
            <div className="px-3 pb-0.5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {mod.label}
            </div>
            {mod.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}

        {isAdmin && (
          <div className="mt-4 space-y-1 border-t-2 border-[#1C1917] pt-4 dark:border-stone-800">
            <div className="px-3 pb-0.5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Quản trị
            </div>
            {adminItems.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

export function AppBottomNav({
  allowedModules,
  moduleOrder,
}: NavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mods = visibleModules(allowedModules, moduleOrder);
  const mod = currentModule(pathname, mods);

  return (
    <>
      <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar/95 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] backdrop-blur md:hidden">
        {(mod?.items ?? []).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-15 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-muted-foreground hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Mở tất cả module"
          className="flex min-h-15 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] text-muted-foreground transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring"
        >
          <LayoutGrid className="size-4" />
          <span>Menu</span>
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-lg p-4">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-base font-bold text-foreground">Tất cả module</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 pt-3">
            {mods.map((m) => (
              <div key={m.id}>
                <div className="pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {m.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="truncate text-center">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
