import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { resetImei } from "@/lib/dmsimei/client";

// Clear IMEI (+ tuy chon unlock app). Proxy da chan quyen dmsimei:reset.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function overQuota(userId: string): boolean {
  const now = Date.now();
  const e = hits.get(userId);
  if (!e || now > e.resetAt) {
    hits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const code = String(body?.code ?? "").trim();
  if (!code) return jsonError("Nhập mã nhân viên");
  if (code.length > 40) return jsonError("Mã quá dài");
  const unlock = body?.unlock === true;
  if (overQuota(user.id)) return jsonError(`Quá ${MAX_PER_WINDOW} lượt/giờ — thử lại sau`, 429);
  try {
    const r = await resetImei(code, unlock);
    return NextResponse.json({
      staffCode: r.staff.staffCode,
      staffName: r.staff.staffName,
      imeiBefore: r.imeiBefore,
      imeiAfter: r.imeiAfter,
      unlocked: r.unlocked,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Reset thất bại");
  }
}
