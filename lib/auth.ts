// Xác thực đa tài khoản: mật khẩu băm scrypt, phiên đăng nhập lưu DB.
// Cookie chỉ chứa token ngẫu nhiên — thu hồi phiên = xóa dòng Session.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";

export const AUTH_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

// ---- Mật khẩu (scrypt, node:crypto — không thêm dependency) ----
const SCRYPT_N = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N }).toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, nStr, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !nStr || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64, { N: Number(nStr) });
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ---- Phiên đăng nhập ----
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });
  return token;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

// Xóa mọi phiên của user (đổi mật khẩu / khóa tài khoản)
export async function deleteUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getUserByToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.active) return null;
  return session.user;
}

// User hiện tại trong server component / route handler (cache theo request)
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  return getUserByToken(store.get(AUTH_COOKIE)?.value);
});

// Guard cho route handler admin (lớp thứ hai sau proxy)
export async function requireAdmin(): Promise<User | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Chưa đăng nhập", status: 401 };
  if (user.role !== "ADMIN") return { error: "Chỉ quản trị viên được phép", status: 403 };
  return user;
}

// Cookie Secure khi truy cập qua HTTPS (IIS/ARR gửi X-ARR-SSL)
export function isHttpsRequest(req: Request): boolean {
  return (
    req.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" ||
    req.headers.has("x-arr-ssl") ||
    new URL(req.url).protocol === "https:"
  );
}
