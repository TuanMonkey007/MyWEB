"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CircleUser,
  ArrowRightLeft,
  BookOpen,
  ClipboardList,
  HardDrive,
  Image as ImageIcon,
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
  Sparkles,
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
  {
    id: "photoid",
    label: "Ảnh thẻ 3x4",
    items: [{ href: "/anh-the", label: "Chuyển ảnh", icon: ImageIcon }],
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
      className={cn(
        "group/link relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground font-medium shadow-xs shadow-primary/25"
          : "font-normal text-muted-foreground hover:bg-accent/70 hover:text-foreground active:scale-[0.99]"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-transform duration-150",
          active ? "text-primary-foreground" : "text-muted-foreground/80 group-hover/link:text-foreground"
        )}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />
      )}
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
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar/95 backdrop-blur-xs select-none">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-4">
        {faviconPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/branding/favicon?v=${encodeURIComponent(faviconPath)}`}
            alt=""
            className="size-8 rounded-xl object-contain border border-border/60 shadow-2xs"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-400 text-primary-foreground shadow-xs shadow-primary/30">
            <Sparkles className="size-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-sm tracking-tight text-foreground">
            {platformName}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Workspace</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {mods.map((mod) => (
          <div key={mod.id} className="mt-3.5 space-y-0.5 first:mt-0">
            <div className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {mod.label}
            </div>
            {mod.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}

        {isAdmin && (
          <div className="mt-4 border-t border-border/50 pt-3 space-y-0.5">
            <div className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Quản trị hệ thống
            </div>
            {adminItems.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border/60 bg-muted/20">
        <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/60 p-1.5 shadow-2xs backdrop-blur-xs">
          <Link
            href="/account"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              pathname === "/account"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-foreground/80 hover:bg-accent/80 hover:text-foreground"
            )}
            title="Tài khoản của tôi"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleUser className="size-3.5" />
            </div>
            <span className="truncate">{userName}</span>
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            <ThemeToggle />
            <LogoutButton iconOnly />
          </div>
        </div>
      </div>
    </aside>
  );
}

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
      <nav className="md:hidden fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/10 p-1">
        {(mod?.items ?? []).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[10px] rounded-xl transition-all duration-150",
                active
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4.5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
        >
          <LayoutGrid className="size-4.5" />
          <span>Menu</span>
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl border-border/70 p-5">
          <SheetHeader className="pb-3 border-b border-border/50">
            <SheetTitle className="text-base font-semibold">Tất cả module hệ thống</SheetTitle>
          </SheetHeader>
          <div className="grid gap-5 pt-3">
            {mods.map((m) => (
              <div key={m.id} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {m.label}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {m.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-150 active:scale-95",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary shadow-2xs"
                            : "border-border/60 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="size-5 text-primary" />
                        <span className="truncate text-center">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CircleUser className="size-4" />
                </div>
                <span className="truncate">{userName}</span>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {isAdmin &&
                  adminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg border border-border/60 px-2.5 py-1.5"
                      >
                        <Icon className="size-3.5" /> {item.label}
                      </Link>
                    );
                  })}
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
