import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { currentDriver, missingMailEnv, sendMail } from "@/lib/mail";

// Gửi mail thử qua nhà cung cấp đang cấu hình (MAIL_DRIVER).
// Proxy đã chặn quyền mailtest:send trước khi tới đây.

// Chặn tần suất trong bộ nhớ: mỗi user chỉ gửi có hạn, tránh đốt quota
// miễn phí của nhà cung cấp khi bấm nhầm / bấm liên tục.
const WINDOW_MS = 60 * 60 * 1000; // 1 giờ
const MAX_PER_WINDOW = 20;
const sent = new Map<string, { count: number; resetAt: number }>();

function overQuota(userId: string): boolean {
  const now = Date.now();
  const entry = sent.get(userId);
  if (!entry || now > entry.resetAt) {
    sent.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const missing = missingMailEnv();
  if (missing.length)
    return jsonError(`Chưa cấu hình mail — thiếu biến: ${missing.join(", ")}`, 503);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const to = String(body.to ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const content = String(body.content ?? "").trim();
  const asHtml = body.asHtml === true;

  if (!to) return jsonError("Nhập địa chỉ người nhận");
  // Cho phép nhiều người nhận, cách nhau bởi dấu phẩy
  const recipients = to.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  if (recipients.length > 5) return jsonError("Tối đa 5 người nhận mỗi lần gửi");
  const bad = recipients.find((r) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));
  if (bad) return jsonError(`Địa chỉ không hợp lệ: ${bad}`);

  if (!subject) return jsonError("Nhập tiêu đề");
  if (!content) return jsonError("Nhập nội dung");
  if (content.length > 50_000) return jsonError("Nội dung quá dài (tối đa 50.000 ký tự)");

  if (overQuota(user.id))
    return jsonError(`Đã gửi quá ${MAX_PER_WINDOW} mail trong 1 giờ — thử lại sau`, 429);

  try {
    const result = await sendMail({
      to: recipients,
      subject,
      // Gửi text thuần thì để nguyên; nhà cung cấp tự bọc phần html.
      ...(asHtml ? { html: content } : { text: content }),
    });
    return NextResponse.json({
      id: result.id,
      driver: result.driver,
      to: recipients,
      sentAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gửi thất bại";
    console.error(`[mailtest] ${user.username} gửi thất bại:`, msg);
    return jsonError(msg, 502);
  }
}

// Trạng thái cấu hình mail — để UI hiện đang dùng nhà nào, gửi từ địa chỉ nào.
export async function GET() {
  return NextResponse.json({
    driver: currentDriver(),
    from: process.env.MAIL_FROM ?? null,
    ready: missingMailEnv().length === 0,
    missing: missingMailEnv(),
  });
}
