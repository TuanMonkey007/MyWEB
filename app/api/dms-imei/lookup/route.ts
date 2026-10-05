import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { lookupStaff } from "@/lib/dmsimei/client";

// Tra cuu NV theo ma + IMEI hien tai. Proxy da chan quyen dmsimei:view.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const code = String(body?.code ?? "").trim();
  if (!code) return jsonError("Nhập mã nhân viên");
  if (code.length > 40) return jsonError("Mã quá dài");
  try {
    return NextResponse.json({ staff: await lookupStaff(code) });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Tra cứu thất bại");
  }
}
