// Gửi một mail thử để kiểm tra cấu hình nhà cung cấp + bản ghi DNS.
// Dùng:  npm run mail:test -- ten.ban@gmail.com
import { FIELD_META, getMailConfig, isConfigured, missingFields, sendMail } from "../lib/mail";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Thiếu địa chỉ nhận. Dùng: npm run mail:test -- ten.ban@gmail.com");
    process.exit(1);
  }

  // Cấu hình lấy từ DB trước, .env là dự phòng (giống hệt lúc chạy trong app)
  const cfg = await getMailConfig();
  const driver = cfg.driver;
  console.log(`Driver     : ${driver} (${cfg.sources.driver ?? "mặc định"})`);
  console.log(`Gửi từ     : ${cfg.values.from ?? "(chưa đặt)"}`);
  console.log(`Sẵn sàng   : ${isConfigured(cfg) ? "có" : "chưa"}`);

  const missing = missingFields(cfg);
  if (missing.length) {
    console.error(`Còn thiếu  : ${missing.map((f) => FIELD_META[f].label).join(", ")}`);
    process.exit(1);
  }
  if (driver === "log") {
    console.log("→ Đang ở chế độ log: mail chỉ in ra màn hình, không gửi thật.\n");
  }

  const now = new Date().toLocaleString("vi-VN");
  const result = await sendMail(
    {
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
    },
    cfg
  );

  console.log(`\nĐã gửi. id = ${result.id ?? "(không có)"}`);
}

main().catch((e) => {
  console.error("\nGửi thất bại:", e instanceof Error ? e.message : e);
  process.exit(1);
});
