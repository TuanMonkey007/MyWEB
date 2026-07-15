import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, getUserByToken } from "@/lib/auth";
import {
  ADMIN_PATH_PREFIXES,
  MODULE_PATH_PREFIXES,
  homeFor,
  userModuleIds,
} from "@/lib/modules";

// Cổng phân quyền của platform (Next 16 proxy chạy Node runtime → dùng được Prisma):
// - Public: landing "/", /login, API đăng nhập, favicon
// - Đã đăng nhập: chỉ vào được module mình được cấp; /settings + /api/users chỉ ADMIN
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/" ||
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

  // Kiểm tra quyền module theo path
  const owned = MODULE_PATH_PREFIXES.find(([prefix]) => pathname.startsWith(prefix));
  if (owned && !userModuleIds(user).includes(owned[1])) {
    return deny(req, pathname, user);
  }

  return NextResponse.next();
}

function deny(req: NextRequest, pathname: string, user: { role: string; modules: string }) {
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
