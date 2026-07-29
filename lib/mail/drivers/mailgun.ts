// Driver Mailgun — REST API dạng form-data, fetch thuần, KHÔNG cần SDK.
// Tài liệu: POST https://api.mailgun.net/v3/{domain}/messages
// Xác thực: Basic auth với user cố định "api" và password là API key.
import type { DriverConfig, MailDriver } from "../types";
import { MailError } from "../types";
import { formatAddress } from "../address";

// Tài khoản đăng ký ở EU phải gọi api.eu.mailgun.net, gọi nhầm sẽ 401.
function endpoint(cfg: DriverConfig): string {
  const region = (cfg.values.mailgunRegion || "us").trim().toLowerCase();
  const host = region === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net";
  return `https://${host}/v3/${cfg.values.mailgunDomain}/messages`;
}

const driver: MailDriver = {
  name: "mailgun",
  async send(mail, cfg) {
    const form = new FormData();
    form.append("from", formatAddress(mail.from));
    for (const a of mail.to) form.append("to", formatAddress(a));
    for (const a of mail.cc) form.append("cc", formatAddress(a));
    for (const a of mail.bcc) form.append("bcc", formatAddress(a));
    form.append("subject", mail.subject);
    if (mail.html) form.append("html", mail.html);
    if (mail.text) form.append("text", mail.text);
    if (mail.replyTo) form.append("h:Reply-To", formatAddress(mail.replyTo));
    for (const a of mail.attachments) {
      const blob = new Blob([new Uint8Array(a.content)], {
        type: a.contentType || "application/octet-stream",
      });
      form.append("attachment", blob, a.filename);
    }

    const auth = Buffer.from(`api:${cfg.values.mailgunApiKey}`).toString("base64");
    const res = await fetch(endpoint(cfg), {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    });

    const data = (await res.json().catch(() => null)) as
      | { id?: string; message?: string }
      | null;
    if (!res.ok) {
      throw new MailError("mailgun", data?.message ?? `HTTP ${res.status}`, res.status);
    }
    // Mailgun trả id dạng "<2024...@domain>" — bỏ ngoặc cho gọn.
    return { driver: "mailgun", id: data?.id?.replace(/^<|>$/g, "") ?? null };
  },
};

export default driver;
