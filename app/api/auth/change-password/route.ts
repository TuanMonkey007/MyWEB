import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  deleteUserSessions,
  getCurrentUser,
  hashPassword,
  isHttpsRequest,
  verifyPassword,
} from "@/lib/auth";

// Tự đổi mật khẩu (mọi user đã đăng nhập) — yêu cầu mật khẩu hiện tại
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json().catch(() => null);
  const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!verifyPassword(current, user.passwordHash))
    return jsonError("Mật khẩu hiện tại không đúng", 401);
  if (next.length < 6) return jsonError("Mật khẩu mới tối thiểu 6 ký tự");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });
  // đổi mật khẩu = hủy mọi phiên cũ, cấp phiên mới cho chính thiết bị này
  await deleteUserSessions(user.id);
  const token = await createSession(user.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(req),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
