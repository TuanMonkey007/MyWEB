import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { maskSecret } from "@/lib/secret-box";
import {
  DEFAULT_BASE_URL,
  getDmsImeiConfig,
  missingDmsImei,
  saveDmsImeiConfig,
} from "@/lib/dmsimei/config";

// Cau hinh tai khoan IT DMS. Nam duoi /api/settings -> proxy chi cho ADMIN.
// Mat khau khong bao gio tra ve: chi ban che + co da luu hay chua.
export async function GET() {
  const cfg = await getDmsImeiConfig();
  return NextResponse.json({
    baseUrl: cfg.baseUrl,
    username: cfg.username,
    hasPassword: !!cfg.password,
    masked: cfg.password ? maskSecret(cfg.password) : null,
    broken: cfg.broken,
    missing: missingDmsImei(cfg),
  });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");
  const patch: { baseUrl?: string | null; username?: string | null; password?: string | null } = {};
  if ("baseUrl" in body) {
    const v = String(body.baseUrl ?? "").trim();
    if (v && !/^https?:\/\//i.test(v)) return jsonError("Base URL phải bắt đầu http(s)://");
    patch.baseUrl = v || null;
  }
  if ("username" in body) patch.username = String(body.username ?? "").trim() || null;
  // Mat khau rong = giu nguyen key cu
  if ("password" in body) {
    const v = String(body.password ?? "");
    if (v.trim()) patch.password = v;
  }
  if (Object.keys(patch).length === 0) return jsonError("Không có gì để lưu");
  await saveDmsImeiConfig(patch);
  const cfg = await getDmsImeiConfig();
  return NextResponse.json({
    baseUrl: cfg.baseUrl || DEFAULT_BASE_URL,
    username: cfg.username,
    hasPassword: !!cfg.password,
    masked: cfg.password ? maskSecret(cfg.password) : null,
    broken: cfg.broken,
    missing: missingDmsImei(cfg),
  });
}
