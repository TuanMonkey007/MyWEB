// Lõi gửi mail — trung lập với nhà cung cấp.
//
// Code nghiệp vụ chỉ gọi sendMail({ to, subject, html }). Dùng nhà nào là việc
// của CẤU HÌNH, không phải của code: admin chỉnh trên giao diện (lưu DB) hoặc
// đặt biến trong .env. DB được ưu tiên, .env là dự phòng.
//
// CHỈ dùng phía server (route handler / server action / script) vì chứa API key.
import type { MailDriver, MailMessage, MailResult, NormalizedMail } from "./types";
import { MailError } from "./types";
import { formatAddress, parseAddress, parseList } from "./address";
import { getMailConfig, isConfigured, missingFields, type MailConfig } from "./config";
import { FIELD_META, type DriverName } from "./constants";

export * from "./types";
export * from "./address";
export * from "./config";

function normalize(msg: MailMessage, cfg: MailConfig): NormalizedMail {
  const fromRaw = msg.from ?? cfg.values.from;
  if (!fromRaw) throw new MailError(cfg.driver, "Chưa đặt địa chỉ gửi (from)");

  const to = parseList(msg.to);
  if (to.length === 0) throw new MailError(cfg.driver, "Thiếu người nhận (to)");
  if (!msg.subject?.trim()) throw new MailError(cfg.driver, "Thiếu tiêu đề (subject)");
  if (!msg.html && !msg.text) throw new MailError(cfg.driver, "Thiếu nội dung (html hoặc text)");

  const replyToRaw = msg.replyTo ?? cfg.values.replyTo;

  return {
    from: parseAddress(fromRaw),
    to,
    cc: parseList(msg.cc),
    bcc: parseList(msg.bcc),
    replyTo: replyToRaw ? parseAddress(replyToRaw) : undefined,
    subject: msg.subject.trim(),
    html: msg.html,
    // Không có bản text thì suy ra từ html để mail client cũ vẫn đọc được.
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
 * Gửi một email. Ném MailError nếu cấu hình sai hoặc nhà cung cấp trả lỗi.
 * Truyền sẵn `cfg` nếu nơi gọi đã đọc cấu hình rồi (đỡ một lượt truy vấn DB).
 */
export async function sendMail(msg: MailMessage, cfg?: MailConfig): Promise<MailResult> {
  const config = cfg ?? (await getMailConfig());
  const mail = normalize(msg, config);

  const missing = missingFields(config);
  if (missing.length) {
    const labels = missing.map((f) => FIELD_META[f].label).join(", ");
    throw new MailError(config.driver, `Chưa cấu hình đủ: ${labels}`);
  }

  const driver = await loadDriver(config.driver);
  return driver.send(mail, config);
}

/**
 * Bản "không ném lỗi" — dùng cho mail phụ trợ (thông báo, nhắc việc) khi không
 * muốn một lỗi gửi mail làm hỏng cả request chính.
 */
export async function trySendMail(
  msg: MailMessage,
  cfg?: MailConfig
): Promise<{ ok: true; result: MailResult } | { ok: false; error: string }> {
  try {
    return { ok: true, result: await sendMail(msg, cfg) };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[mail] gửi thất bại:", error);
    return { ok: false, error };
  }
}

export { formatAddress, isConfigured, missingFields };
