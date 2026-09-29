"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        title="Đăng xuất"
        aria-label="Đăng xuất"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" className={className} onClick={handleLogout}>
      <LogOut className="size-4" /> Đăng xuất
    </Button>
  );
}
