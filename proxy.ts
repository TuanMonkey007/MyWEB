import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@prisma/client";
import { AUTH_COOKIE, getUserByToken } from "@/lib/auth";
import { ADMIN_PATH_PREFIXES } from "@/lib/modules";
import { homeFor, requiredCapability, userCan } from "@/lib/permissions";

// Cổng phân quyền của platform (Next 16 proxy chạy Node runtime → dùng được Prisma):
// - Public: landing "/", /login, API đăng nhập, favicon
// - Đã đăng nhập: chặn theo QUYỀN CHI TIẾT (view/create/edit/delete + đặc biệt)
//   ứng với method+path; khu /access, /settings, /api/users chỉ ADMIN
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/" ||
    // Khu bài hướng dẫn công khai. Trang tự lọc theo quyền xem (lib/articles
    // visibleWhere): chưa đăng nhập chỉ thấy bài PUBLIC, đăng nhập rồi thấy
    // thêm bài nội bộ. Không có API công khai — trang đọc thẳng từ DB.
    pathname === "/huong-dan" ||
    pathname.startsWith("/huong-dan/") ||
    pathname.startsWith("/api/auth/login") ||
    pathname === "/api/branding/favicon"
  ) {
    return NextResponse.next();
  }

  const user = await getUserByToken(req.cookies.get(AUTH_COOKIE)?.value);

  if (pathname === "/login") {
    if (user) {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(user);
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Khu vực chỉ dành cho quản trị viên
  if (ADMIN_PATH_PREFIXES.some((p) => pathname.startsWith(p)) && user.role !== "ADMIN") {
    return deny(req, pathname, user);
  }

  // Kiểm tra quyền chi tiết theo method + path
  const req_cap = requiredCapability(req.method, pathname);
  if (req_cap && !userCan(user, req_cap.module, req_cap.cap)) {
    return deny(req, pathname, user);
  }

  return NextResponse.next();
}

function deny(req: NextRequest, pathname: string, user: User) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Tài khoản của bạn không có quyền dùng chức năng này" },
      { status: 403 }
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = homeFor(user);
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
