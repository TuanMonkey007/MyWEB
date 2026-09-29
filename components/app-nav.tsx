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
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
        active
          ? "bg-[#9f1239] text-white font-bold shadow-sm"
          : "font-medium text-slate-600 hover:bg-rose-50 hover:text-[#9f1239] dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-[#9f1239]")} />
      <span className="truncate">{item.label}</span>
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
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 select-none">
      {/* Brand Header — HNF Deep Red Gradient */}
      <div className="flex h-15 items-center gap-2.5 bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#9f1239] px-4 text-white shadow-sm">
        {faviconPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/branding/favicon?v=${encodeURIComponent(faviconPath)}`}
            alt=""
            className="size-7 rounded-lg object-contain bg-white p-0.5"
          />
        ) : (
          <div className="bg-white text-[#881337] px-2 py-0.5 rounded-lg shadow font-black text-sm tracking-wider">
            HNF
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-sm tracking-tight text-white">
            {platformName}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-rose-200">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống Quản trị</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {mods.map((mod) => (
          <div key={mod.id} className="mt-3 space-y-0.5 first:mt-0">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {mod.label}
            </div>
            {mod.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}

        {isAdmin && (
          <div className="mt-4 border-t border-slate-200 pt-3 space-y-0.5 dark:border-slate-800">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quản trị
            </div>
            {adminItems.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-200 p-2.5 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Link
            href="/account"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
              pathname === "/account"
                ? "bg-rose-100 text-[#9f1239]"
                : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300"
            )}
            title="Tài khoản của tôi"
          >
            <CircleUser className="size-4 shrink-0 text-[#9f1239]" />
            <span className="truncate">{userName}</span>
          </Link>
          <ThemeToggle />
          <LogoutButton iconOnly />
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
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white shadow-lg dark:bg-slate-900 dark:border-slate-800">
        {(mod?.items ?? []).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active ? "text-[#9f1239] font-bold bg-rose-50/60" : "text-slate-600 hover:text-[#9f1239]"
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
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-slate-600 hover:text-[#9f1239]"
        >
          <LayoutGrid className="size-4.5" />
          <span>Menu</span>
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-2xl p-4">
          <SheetHeader className="pb-3 border-b border-slate-100">
            <SheetTitle className="text-base font-bold text-slate-800">Tất cả module</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 pt-3">
            {mods.map((m) => (
              <div key={m.id}>
                <div className="pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {m.label}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {m.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all",
                          active
                            ? "border-[#9f1239] bg-rose-50 text-[#9f1239]"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
