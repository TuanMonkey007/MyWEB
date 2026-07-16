"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CircleUser,
  ClipboardList,
  HardDrive,
  LayoutDashboard,
  LayoutGrid,
  PiggyBank,
  FileText,
  ScanFace,
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

type ModuleGroup = { id: string; label: string; items: NavItem[] };

// Platform module hóa — id khớp lib/modules.ts, nav chỉ hiện module user được cấp
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
];

const settingsItem: NavItem = { href: "/settings", label: "Cài đặt", icon: Settings };

type NavProps = {
  allowedModules: string[];
  isAdmin: boolean;
  userName: string;
  moduleOrder?: string[];
};

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

// Lọc module theo quyền + sắp theo thứ tự admin cấu hình
function visibleModules(allowed: string[], order?: string[]): ModuleGroup[] {
  const shown = MODULES.filter((m) => allowed.includes(m.id));
  if (!order?.length) return shown;
  return [...shown].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

// Nhóm module đang mở theo URL (mặc định: nhóm đầu được cấp)
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
  allowedModules,
  isAdmin,
  userName,
  moduleOrder,
}: NavProps & {
  platformName?: string;
  faviconPath?: string | null;
}) {
  const pathname = usePathname();
  const mods = visibleModules(allowedModules, moduleOrder);

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
        {mods.map((mod) => (
          <div key={mod.id} className="contents">
            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {mod.label}
            </div>
            {mod.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
        {isAdmin && (
          <div className="mt-4 border-t pt-2">
            <SidebarLink item={settingsItem} pathname={pathname} />
          </div>
        )}
      </nav>
      <div className="flex items-center gap-1 border-t p-2">
        <Link
          href="/account"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm",
            pathname === "/account"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
          title="Tài khoản của tôi"
        >
          <CircleUser className="size-4 shrink-0" />
          <span className="truncate">{userName}</span>
        </Link>
        <ThemeToggle />
        <LogoutButton iconOnly />
      </div>
    </aside>
  );
}

// Bottom nav mobile: các mục của module đang dùng + nút Menu mở danh sách module
export function AppBottomNav({
  allowedModules,
  isAdmin,
  userName,
  moduleOrder,
}: NavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mods = visibleModules(allowedModules, moduleOrder);
  const mod = currentModule(pathname, mods);

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t bg-background">
        {(mod?.items ?? []).map((item) => {
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
            {mods.map((m) => (
              <div key={m.id}>
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
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
              >
                <CircleUser className="size-4 shrink-0" />
                <span className="truncate">{userName}</span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                {isAdmin && (
                  <Link
                    href={settingsItem.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Settings className="size-4" /> Cài đặt
                  </Link>
                )}
                <ThemeToggle />
                <LogoutButton iconOnly />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
