import { timingSafeEqual, createHash } from "crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { AUTH_COOKIE, AUTH_MAX_AGE, expectedToken } from "@/lib/auth";

function safeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: Request) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword)
    return jsonError("Chưa cấu hình APP_PASSWORD trong .env", 500);

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!safeCompare(password, appPassword))
    return jsonError("Mật khẩu không đúng", 401);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
