// Driver SMTP — đường đi "phổ quát": dùng được với BẤT KỲ nhà nào (Resend,
// Brevo, Mailgun, SES... đều có endpoint SMTP), kể cả mail server nội bộ công ty.
// Đây là driver duy nhất cần thêm thư viện:  npm i nodemailer
//
// Lưu ý khi chạy trên VPS: SMTP đi qua cổng 587/465, nhiều nhà cung cấp VPS
// chặn sẵn các cổng này. Nếu bị chặn, dùng driver HTTP API (cổng 443) thay thế.
import type { MailDriver } from "../types";
import { MailError } from "../types";
import { formatAddress } from "../address";

type Transport = {
  sendMail(opts: Record<string, unknown>): Promise<{ messageId?: string }>;
};
type Nodemailer = { createTransport(opts: Record<string, unknown>): Transport };

// Import động + báo lỗi rõ ràng nếu chưa cài, để không bắt cả project phụ thuộc
// nodemailer chỉ vì một driver tùy chọn.
async function loadNodemailer(): Promise<Nodemailer> {
  const specifier = "nodemailer";
  try {
    const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ specifier);
    return (mod.default ?? mod) as Nodemailer;
  } catch {
    throw new MailError("smtp", "Chưa cài thư viện nodemailer — chạy: npm i nodemailer");
  }
}

const driver: MailDriver = {
  name: "smtp",
  async send(mail, cfg) {
    const nodemailer = await loadNodemailer();
    const port = Number(cfg.values.smtpPort || 587);
    const forceSecure = cfg.values.smtpSecure;

    const transport = nodemailer.createTransport({
      host: cfg.values.smtpHost,
      port,
      // 465 = SSL ngầm định; 587 = STARTTLS. Ép bằng "Bắt buộc SSL" nếu cần.
      secure: forceSecure ? forceSecure === "true" : port === 465,
      auth: { user: cfg.values.smtpUser, pass: cfg.values.smtpPass },
    });

    const info = await transport.sendMail({
      from: formatAddress(mail.from),
      to: mail.to.map(formatAddress),
      cc: mail.cc.length ? mail.cc.map(formatAddress) : undefined,
      bcc: mail.bcc.length ? mail.bcc.map(formatAddress) : undefined,
      replyTo: mail.replyTo ? formatAddress(mail.replyTo) : undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments.length
        ? mail.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          }))
        : undefined,
    });

    return { driver: "smtp", id: info.messageId?.replace(/^<|>$/g, "") ?? null };
  },
};

export default driver;
