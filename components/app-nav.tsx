"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  FileText,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Wallet;
  exact?: boolean;
};

// Platform module hóa: mỗi nhóm là một module
const financeItems: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/wallets", label: "Ví tiền", icon: Wallet },
  { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
];

const procurementItems: NavItem[] = [
  { href: "/procurement", label: "Ngân sách", icon: PiggyBank, exact: true },
  { href: "/procurement/proposals", label: "Đề xuất", icon: FileText },
  { href: "/procurement/budget", label: "Thiết lập quỹ", icon: SlidersHorizontal },
];

const settingsItem: NavItem = { href: "/settings", label: "Cài đặt", icon: Settings };

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
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

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <LayoutDashboard className="size-5 text-primary" />
        Platform cá nhân
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tài chính cá nhân
        </div>
        {financeItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Đề xuất mua hàng
        </div>
        {procurementItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="mt-4 border-t pt-2">
          <SidebarLink item={settingsItem} pathname={pathname} />
        </div>
      </nav>
      <div className="border-t p-2">
        <LogoutButton className="w-full justify-start text-muted-foreground" />
      </div>
    </aside>
  );
}

// Bottom nav mobile: hiện các mục của module đang dùng + nút nhảy module kia
export function AppBottomNav() {
  const pathname = usePathname();
  const inProcurement = pathname.startsWith("/procurement");
  const items: NavItem[] = inProcurement
    ? [
        ...procurementItems,
        { href: "/", label: "Tài chính", icon: Wallet, exact: true },
        settingsItem,
      ]
    : [
        ...financeItems,
        { href: "/procurement", label: "Mua hàng", icon: ShoppingCart },
        settingsItem,
      ];

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex border-t bg-background">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item) && !(item.label === "Tài chính");
        return (
          <Link
            key={item.href + item.label}
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
    </nav>
  );
}
