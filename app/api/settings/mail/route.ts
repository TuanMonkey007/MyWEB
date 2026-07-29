import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { maskSecret } from "@/lib/secret-box";
import {
  DRIVERS,
  FIELD_META,
  MAIL_FIELDS,
  getMailConfig,
  isConfigured,
  missingFields,
  saveMailConfig,
  type MailField,
} from "@/lib/mail";

// Cấu hình mail cho toàn platform. Nằm dưới /api/settings nên proxy đã chặn
// chỉ ADMIN mới vào được — API key không lộ ra cho user thường.
//
// Bí mật (API key, mật khẩu SMTP) KHÔNG BAO GIỜ trả về nguyên vẹn: chỉ trả bản
// che (re_a••••••WXYZ) để admin nhận ra mình đang dùng key nào.

export async function GET() {
  return NextResponse.json(await describe());
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const patch: Partial<Record<MailField, string | null>> = {};

  for (const field of MAIL_FIELDS) {
    if (!(field in body)) continue;
    const raw = body[field];
    // null = xóa khỏi DB (rơi lại về .env nếu có)
    if (raw === null) {
      patch[field] = null;
      continue;
    }
    const value = String(raw).trim();
    // Bí mật: chuỗi rỗng nghĩa là "giữ nguyên key cũ", không phải "xóa"
    if (FIELD_META[field].secret && value === "") continue;
    patch[field] = value;
  }

  if (patch.driver && !(DRIVERS as readonly string[]).includes(patch.driver))
    return jsonError("Nhà cung cấp không hợp lệ");

  if (patch.mailgunRegion && !["us", "eu"].includes(patch.mailgunRegion.toLowerCase()))
    return jsonError("Vùng Mailgun chỉ nhận us hoặc eu");

  if (patch.smtpPort && !/^\d{1,5}$/.test(patch.smtpPort))
    return jsonError("Cổng SMTP phải là số");

  if (Object.keys(patch).length === 0) return jsonError("Không có gì để lưu");

  await saveMailConfig(patch);
  return NextResponse.json(await describe());
}

// Bản mô tả an toàn để gửi xuống giao diện
async function describe() {
  const cfg = await getMailConfig();
  const values: Record<string, string | null> = {};
  const hasSecret: Record<string, boolean> = {};

  for (const field of MAIL_FIELDS) {
    const v = cfg.values[field];
    if (FIELD_META[field].secret) {
      hasSecret[field] = !!v;
      values[field] = v ? maskSecret(v) : null;
    } else {
      values[field] = v;
    }
  }

  return {
    driver: cfg.driver,
    values,
    hasSecret,
    sources: cfg.sources,
    broken: cfg.broken,
    ready: isConfigured(cfg),
    missing: missingFields(cfg).map((f) => FIELD_META[f].label),
  };
}
