import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  hashPassword,
  isHttpsRequest,
  verifyPassword,
} from "@/lib/auth";
import { homeFor } from "@/lib/modules";

// Chống dò mật khẩu: tối đa 5 lần sai / 5 phút cho mỗi IP+username (in-memory)
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function limiterKey(req: Request, username: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : "local";
  return `${ip}:${username}`;
}

function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  return !!entry && Date.now() <= entry.resetAt && entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

// Lần chạy đầu sau khi nâng cấp: bảng User trống → tạo admin từ APP_PASSWORD cũ
async function bootstrapAdmin(username: string, password: string) {
  if ((await prisma.user.count()) > 0) return null;
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword || username !== "admin" || password !== appPassword) return null;
  return prisma.user.create({
    data: {
      username: "admin",
      displayName: "Quản trị viên",
      passwordHash: hashPassword(password),
      role: "ADMIN",
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username =
    typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return jsonError("Nhập tên đăng nhập và mật khẩu");

  const key = limiterKey(req, username);
  if (isRateLimited(key))
    return jsonError("Sai quá nhiều lần — thử lại sau 5 phút", 429);

  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) user = await bootstrapAdmin(username, password);

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    recordFailure(key);
    return jsonError("Sai tên đăng nhập hoặc mật khẩu", 401);
  }

  attempts.delete(key);
  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, redirectTo: homeFor(user) });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(req),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
