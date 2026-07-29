// Gửi một mail thử để kiểm tra cấu hình nhà cung cấp + bản ghi DNS.
// Dùng:  npm run mail:test -- ten.ban@gmail.com
import { currentDriver, isMailConfigured, missingMailEnv, sendMail } from "../lib/mail";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Thiếu địa chỉ nhận. Dùng: npm run mail:test -- ten.ban@gmail.com");
    process.exit(1);
  }

  const driver = currentDriver();
  console.log(`Driver     : ${driver}`);
  console.log(`Gửi từ     : ${process.env.MAIL_FROM ?? "(chưa đặt MAIL_FROM)"}`);
  console.log(`Sẵn sàng   : ${isMailConfigured() ? "có" : "chưa"}`);

  const missing = missingMailEnv();
  if (missing.length) {
    console.error(`Thiếu biến : ${missing.join(", ")}`);
    process.exit(1);
  }
  if (driver === "log") {
    console.log("→ Đang ở chế độ log: mail chỉ in ra màn hình, không gửi thật.\n");
  }

  const now = new Date().toLocaleString("vi-VN");
  const result = await sendMail({
    to,
    subject: `[MyWEB] Mail thử nghiệm — ${now}`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px">Cấu hình mail hoạt động ✅</h2>
        <p>Đây là mail thử nghiệm từ platform MyWEB.</p>
        <ul>
          <li>Driver: <b>${driver}</b></li>
          <li>Thời điểm: ${now}</li>
        </ul>
        <p style="color:#666">Nếu mail này nằm trong hộp thư rác, hãy kiểm tra lại
        bản ghi SPF / DKIM / DMARC của tên miền.</p>
      </div>`,
  });

  console.log(`\nĐã gửi. id = ${result.id ?? "(không có)"}`);
}

main().catch((e) => {
  console.error("\nGửi thất bại:", e instanceof Error ? e.message : e);
  process.exit(1);
});
