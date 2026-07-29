// Driver Resend — REST API, gọi bằng fetch có sẵn của Node, KHÔNG cần SDK.
// Tài liệu: POST https://api.resend.com/emails  (header Authorization: Bearer)
import type { MailDriver } from "../types";
import { MailError } from "../types";
import { formatAddress } from "../address";
import { errorMessage, readBody } from "./http";

const ENDPOINT = "https://api.resend.com/emails";

const driver: MailDriver = {
  name: "resend",
  async send(mail, cfg) {
    const payload: Record<string, unknown> = {
      from: formatAddress(mail.from),
      to: mail.to.map(formatAddress),
      subject: mail.subject,
    };
    if (mail.html) payload.html = mail.html;
    if (mail.text) payload.text = mail.text;
    if (mail.cc.length) payload.cc = mail.cc.map(formatAddress);
    if (mail.bcc.length) payload.bcc = mail.bcc.map(formatAddress);
    if (mail.replyTo) payload.reply_to = formatAddress(mail.replyTo);
    if (mail.attachments.length) {
      payload.attachments = mail.attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      }));
    }

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.values.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const { data, text } = await readBody(res);
    if (!res.ok) {
      throw new MailError("resend", errorMessage(res.status, data, text), res.status);
    }
    return { driver: "resend", id: typeof data?.id === "string" ? data.id : null };
  },
};

export default driver;
