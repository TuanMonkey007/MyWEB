// Lõi gửi mail — trung lập với nhà cung cấp.
//
// Ý tưởng: code nghiệp vụ chỉ gọi sendMail({ to, subject, html }). Chọn nhà nào
// là việc của biến môi trường MAIL_DRIVER, KHÔNG phải việc của code. Đổi từ
// Resend sang Brevo/Mailgun = sửa .env rồi restart, không đụng một dòng code.
//
// CHỈ dùng phía server (route handler / server action / script) vì có API key.
import type {
  Address,
  MailAddress,
  MailDriver,
  MailMessage,
  MailResult,
  NormalizedMail,
} from "./types";
import { MailError } from "./types";

export * from "./types";

const DRIVERS = ["log", "resend", "brevo", "mailgun", "smtp"] as const;
export type DriverName = (typeof DRIVERS)[number];

// Mặc định "log": chưa cấu hình gì thì mail chỉ in ra console, không gửi thật,
// không văng lỗi — an toàn cho môi trường dev và cho lần deploy đầu.
export function currentDriver(): DriverName {
  const raw = (process.env.MAIL_DRIVER || "log").trim().toLowerCase();
  return (DRIVERS as readonly string[]).includes(raw) ? (raw as DriverName) : "log";
}

// Biến môi trường bắt buộc của từng nhà — dùng để kiểm tra cấu hình sớm.
const REQUIRED_ENV: Record<DriverName, string[]> = {
  log: [],
  resend: ["RESEND_API_KEY"],
  brevo: ["BREVO_API_KEY"],
  mailgun: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
  smtp: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
};

// Đã sẵn sàng gửi mail thật chưa? UI có thể dùng để ẩn/khóa tính năng gửi mail.
export function isMailConfigured(): boolean {
  const driver = currentDriver();
  if (driver === "log") return false;
  if (!process.env.MAIL_FROM) return false;
  return REQUIRED_ENV[driver].every((k) => !!process.env[k]);
}

// Liệt kê biến còn thiếu — để báo lỗi cho người cấu hình biết thiếu đúng cái gì.
export function missingMailEnv(): string[] {
  const driver = currentDriver();
  if (driver === "log") return [];
  const need = [...REQUIRED_ENV[driver], "MAIL_FROM"];
  return need.filter((k) => !process.env[k]);
}

// Chấp nhận cả "a@b.com" lẫn "Tên hiển thị <a@b.com>" lẫn { email, name }.
export function parseAddress(value: MailAddress): Address {
  if (typeof value !== "string") return { email: value.email.trim(), name: value.name?.trim() };
  const m = value.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { email: m[2].trim(), name: m[1].replace(/^["']|["']$/g, "").trim() || undefined };
  return { email: value.trim() };
}

function parseList(value: MailAddress | MailAddress[] | undefined): Address[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(parseAddress).filter((a) => a.email);
}

// Dạng chuỗi chuẩn RFC "Tên <a@b.com>" — Resend/Mailgun/SMTP đều nhận dạng này.
export function formatAddress(a: Address): string {
  return a.name ? `${a.name} <${a.email}>` : a.email;
}

function normalize(msg: MailMessage): NormalizedMail {
  const driver = currentDriver();
  const fromRaw = msg.from ?? process.env.MAIL_FROM;
  if (!fromRaw) throw new MailError(driver, "Thiếu địa chỉ gửi: đặt MAIL_FROM trong .env");

  const to = parseList(msg.to);
  if (to.length === 0) throw new MailError(driver, "Thiếu người nhận (to)");
  if (!msg.subject?.trim()) throw new MailError(driver, "Thiếu tiêu đề (subject)");
  if (!msg.html && !msg.text) throw new MailError(driver, "Thiếu nội dung (html hoặc text)");

  const replyToRaw = msg.replyTo ?? process.env.MAIL_REPLY_TO;

  return {
    from: parseAddress(fromRaw),
    to,
    cc: parseList(msg.cc),
    bcc: parseList(msg.bcc),
    replyTo: replyToRaw ? parseAddress(replyToRaw) : undefined,
    subject: msg.subject.trim(),
    html: msg.html,
    // Không có bản text thì tạm suy ra từ html để mail client cũ vẫn đọc được.
    text: msg.text ?? (msg.html ? htmlToText(msg.html) : undefined),
    attachments: msg.attachments ?? [],
  };
}

// Rút gọn html → text thuần (đủ dùng cho phần text/plain đi kèm).
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Nạp driver theo kiểu lazy: chỉ code của nhà đang dùng mới được load.
async function loadDriver(name: DriverName): Promise<MailDriver> {
  switch (name) {
    case "resend":
      return (await import("./drivers/resend")).default;
    case "brevo":
      return (await import("./drivers/brevo")).default;
    case "mailgun":
      return (await import("./drivers/mailgun")).default;
    case "smtp":
      return (await import("./drivers/smtp")).default;
    default:
      return (await import("./drivers/log")).default;
  }
}

/**
 * Gửi một email. Ném MailError nếu cấu hình sai hoặc nhà cung cấp trả lỗi —
 * nơi gọi tự quyết định bắt lỗi hay để nổi lên.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  const name = currentDriver();
  const mail = normalize(msg);

  const missing = missingMailEnv();
  if (missing.length) {
    throw new MailError(name, `Thiếu biến môi trường: ${missing.join(", ")}`);
  }

  const driver = await loadDriver(name);
  return driver.send(mail);
}

/**
 * Bản "không ném lỗi" — dùng cho mail phụ trợ (thông báo, nhắc việc) khi không
 * muốn một lỗi gửi mail làm hỏng cả request chính.
 */
export async function trySendMail(
  msg: MailMessage
): Promise<{ ok: true; result: MailResult } | { ok: false; error: string }> {
  try {
    return { ok: true, result: await sendMail(msg) };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[mail] gửi thất bại:", error);
    return { ok: false, error };
  }
}
