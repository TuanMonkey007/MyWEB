// Driver SMTP — đường đi "phổ quát": dùng được với BẤT KỲ nhà nào (Resend,
// Brevo, Mailgun, SES... đều có endpoint SMTP), kể cả mail server nội bộ công ty.
// Đây là driver duy nhất cần thêm thư viện:  npm i nodemailer
//
// Lưu ý khi chạy trên VPS: SMTP đi qua cổng 587/465, nhiều nhà cung cấp VPS
// chặn sẵn các cổng này. Nếu bị chặn, dùng driver HTTP API (cổng 443) thay thế.
import type { MailDriver } from "../types";
import { MailError } from "../types";
import { formatAddress } from "../index";

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
  async send(mail) {
    const nodemailer = await loadNodemailer();
    const port = Number(process.env.SMTP_PORT || 587);

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 = SSL ngầm định; 587 = STARTTLS. Ép bằng SMTP_SECURE nếu cần.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
