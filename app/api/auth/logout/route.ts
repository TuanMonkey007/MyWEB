import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, deleteSession } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token) await deleteSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
