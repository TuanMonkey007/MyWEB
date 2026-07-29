// Danh mục driver + trường cấu hình. File này KHÔNG đụng DB/Prisma nên client
// component (form cài đặt mail) import được.

export const DRIVERS = ["log", "resend", "brevo", "mailgun", "smtp"] as const;
export type DriverName = (typeof DRIVERS)[number];

export const DRIVER_LABELS: Record<DriverName, string> = {
  log: "Log — không gửi thật, chỉ ghi ra console",
  resend: "Resend",
  brevo: "Brevo (Sendinblue)",
  mailgun: "Mailgun",
  smtp: "SMTP — mọi nhà cung cấp / mail server nội bộ",
};

export const MAIL_FIELDS = [
  "driver",
  "from",
  "replyTo",
  "resendApiKey",
  "brevoApiKey",
  "mailgunApiKey",
  "mailgunDomain",
  "mailgunRegion",
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPass",
  "smtpSecure",
] as const;
export type MailField = (typeof MAIL_FIELDS)[number];

type FieldMeta = {
  label: string;
  envName: string;
  secret?: boolean; // lưu vào DB thì mã hóa, hiện lên UI thì che
  placeholder?: string;
  hint?: string;
};

export const FIELD_META: Record<MailField, FieldMeta> = {
  driver: { label: "Nhà cung cấp", envName: "MAIL_DRIVER" },
  from: {
    label: "Địa chỉ gửi",
    envName: "MAIL_FROM",
    placeholder: "MyWEB <no-reply@tenmien.com>",
    hint: "Phải thuộc tên miền đã xác minh SPF/DKIM ở nhà cung cấp",
  },
  replyTo: {
    label: "Địa chỉ nhận thư trả lời",
    envName: "MAIL_REPLY_TO",
    placeholder: "khong-bat-buoc@tenmien.com",
  },
  resendApiKey: { label: "API key", envName: "RESEND_API_KEY", secret: true, placeholder: "re_..." },
  brevoApiKey: { label: "API key", envName: "BREVO_API_KEY", secret: true, placeholder: "xkeysib-..." },
  mailgunApiKey: { label: "API key", envName: "MAILGUN_API_KEY", secret: true },
  mailgunDomain: { label: "Domain", envName: "MAILGUN_DOMAIN", placeholder: "mail.tenmien.com" },
  mailgunRegion: {
    label: "Vùng",
    envName: "MAILGUN_REGION",
    placeholder: "us",
    hint: "us hoặc eu — chọn sai sẽ báo lỗi 401",
  },
  smtpHost: { label: "Máy chủ", envName: "SMTP_HOST", placeholder: "smtp.tenmien.com" },
  smtpPort: { label: "Cổng", envName: "SMTP_PORT", placeholder: "587" },
  smtpUser: { label: "Tài khoản", envName: "SMTP_USER" },
  smtpPass: { label: "Mật khẩu", envName: "SMTP_PASS", secret: true },
  smtpSecure: {
    label: "Bắt buộc SSL",
    envName: "SMTP_SECURE",
    placeholder: "để trống",
    hint: "true/false — để trống thì tự suy theo cổng (465 = SSL)",
  },
};

// Trường riêng của từng driver (from/replyTo là chung nên không liệt kê ở đây)
export const DRIVER_FIELDS: Record<DriverName, MailField[]> = {
  log: [],
  resend: ["resendApiKey"],
  brevo: ["brevoApiKey"],
  mailgun: ["mailgunApiKey", "mailgunDomain", "mailgunRegion"],
  smtp: ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpSecure"],
};

// Trường bắt buộc để gửi được (ngoài "from" luôn bắt buộc)
export const DRIVER_REQUIRED: Record<DriverName, MailField[]> = {
  log: [],
  resend: ["resendApiKey"],
  brevo: ["brevoApiKey"],
  mailgun: ["mailgunApiKey", "mailgunDomain"],
  smtp: ["smtpHost", "smtpUser", "smtpPass"],
};

export const SECRET_FIELDS = MAIL_FIELDS.filter((f) => FIELD_META[f].secret);
