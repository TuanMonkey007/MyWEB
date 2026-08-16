"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock, LogIn, Newspaper, PenLine } from "lucide-react";

// Đồng hồ là nguồn dữ liệu NGOÀI React, nên dùng useSyncExternalStore thay vì
// setState trong useEffect (kiểu đó gây render dây chuyền và bị lint chặn).
// Ảnh chụp phía server trả null → render chỗ giữ chỗ, tránh lệch hydration do
// máy chủ và trình duyệt khác múi giờ.
function dangKy(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const giayHienTai = () => Math.floor(Date.now() / 1000);
const khongCoOServer = () => null;

// Thanh đầu trang công khai. Giống trang báo: thương hiệu bên trái, ngày giờ ở
// giữa, lối đăng nhập bên phải. Đồng hồ thu gọn dẫn sang trang đồng hồ thế giới
// đầy đủ ở /dong-ho.
export function SiteHeader({
  platformName,
  isLoggedIn,
}: {
  platformName: string;
  isLoggedIn: boolean;
}) {
  const giay = useSyncExternalStore(dangKy, giayHienTai, khongCoOServer);
  const now = giay === null ? null : new Date(giay * 1000);

  return (
    <div className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Newspaper className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">{platformName}</span>
        </Link>

        <Link
          href="/dong-ho"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          title="Xem đồng hồ thế giới"
        >
          <Clock className="size-4" />
          {now ? (
            <span className="tabular-nums">
              {now.toLocaleTimeString("vi-VN")} ·{" "}
              {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
            </span>
          ) : (
            // giữ chỗ đúng bề ngang để không giật layout khi giờ hiện ra
            <span className="inline-block w-44" />
          )}
        </Link>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <Link
              href="/articles"
              className="flex items-center gap-1.5 text-primary underline-offset-2 hover:underline"
            >
              <PenLine className="size-4" /> Viết bài
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogIn className="size-4" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
