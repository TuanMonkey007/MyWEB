import { timingSafeEqual, createHash } from "crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { AUTH_COOKIE, AUTH_MAX_AGE, expectedToken } from "@/lib/auth";

function safeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// Chống dò mật khẩu: tối đa 5 lần sai / 5 phút cho mỗi IP (in-memory)
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

// Cookie Secure khi truy cập qua HTTPS (IIS/ARR đứng trước gửi X-ARR-SSL;
// reverse proxy khác gửi X-Forwarded-Proto). Localhost http vẫn login được.
function isHttps(req: Request): boolean {
  return (
    req.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" ||
    req.headers.has("x-arr-ssl") ||
    new URL(req.url).protocol === "https:"
  );
}

export async function POST(req: Request) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword)
    return jsonError("Chưa cấu hình APP_PASSWORD trong .env", 500);

  const ip = clientIp(req);
  if (isRateLimited(ip))
    return jsonError("Sai mật khẩu quá nhiều lần — thử lại sau 5 phút", 429);

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!safeCompare(password, appPassword)) {
    recordFailure(ip);
    return jsonError("Mật khẩu không đúng", 401);
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
