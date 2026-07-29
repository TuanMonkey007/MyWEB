// Driver Brevo (Sendinblue) — REST API v3, fetch thuần, KHÔNG cần SDK.
// Tài liệu: POST https://api.brevo.com/v3/smtp/email  (header api-key)
import type { Address, MailDriver } from "../types";
import { MailError } from "../types";

const ENDPOINT = "https://api.brevo.com/v3/smtp/email";

// Brevo dùng object {email, name} chứ không dùng chuỗi "Tên <mail>".
function addr(a: Address) {
  return a.name ? { email: a.email, name: a.name } : { email: a.email };
}

const driver: MailDriver = {
  name: "brevo",
  async send(mail, cfg) {
    const payload: Record<string, unknown> = {
      sender: addr(mail.from),
      to: mail.to.map(addr),
      subject: mail.subject,
    };
    if (mail.html) payload.htmlContent = mail.html;
    if (mail.text) payload.textContent = mail.text;
    if (mail.cc.length) payload.cc = mail.cc.map(addr);
    if (mail.bcc.length) payload.bcc = mail.bcc.map(addr);
    if (mail.replyTo) payload.replyTo = addr(mail.replyTo);
    if (mail.attachments.length) {
      payload.attachment = mail.attachments.map((a) => ({
        name: a.filename,
        content: a.content.toString("base64"),
      }));
    }

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": cfg.values.brevoApiKey ?? "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => null)) as
      | { messageId?: string; message?: string }
      | null;
    if (!res.ok) {
      throw new MailError("brevo", data?.message ?? `HTTP ${res.status}`, res.status);
    }
    return { driver: "brevo", id: data?.messageId ?? null };
  },
};

export default driver;
