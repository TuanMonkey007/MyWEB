// Driver "log" (mặc định): KHÔNG gửi đi đâu cả, chỉ in ra console.
// Dùng khi dev hoặc khi chưa đăng ký nhà cung cấp nào — code nghiệp vụ vẫn
// chạy bình thường, không cần if/else "đã cấu hình mail chưa".
import type { MailDriver } from "../types";
import { formatAddress } from "../index";

const driver: MailDriver = {
  name: "log",
  async send(mail) {
    const body = (mail.text ?? mail.html ?? "").slice(0, 500);
    console.log(
      [
        "──────── [mail:log] không gửi thật ────────",
        `Từ    : ${formatAddress(mail.from)}`,
        `Tới   : ${mail.to.map(formatAddress).join(", ")}`,
        mail.cc.length ? `CC    : ${mail.cc.map(formatAddress).join(", ")}` : null,
        `Tiêu đề: ${mail.subject}`,
        mail.attachments.length
          ? `Đính kèm: ${mail.attachments.map((a) => a.filename).join(", ")}`
          : null,
        "─────────────────────────────────────────",
        body,
        "─────────────────────────────────────────",
      ]
        .filter(Boolean)
        .join("\n")
    );
    return { driver: "log", id: null };
  },
};

export default driver;
