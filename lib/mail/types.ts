// Kiểu dùng chung cho MỌI nhà cung cấp mail. Code nghiệp vụ chỉ biết tới các
// kiểu này; mỗi driver tự map sang định dạng riêng của nhà đó.

export type MailAddress = string | { email: string; name?: string };

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type MailMessage = {
  to: MailAddress | MailAddress[];
  subject: string;
  html?: string;
  text?: string;
  from?: MailAddress; // bỏ trống → lấy MAIL_FROM
  replyTo?: MailAddress; // bỏ trống → lấy MAIL_REPLY_TO
  cc?: MailAddress | MailAddress[];
  bcc?: MailAddress | MailAddress[];
  attachments?: MailAttachment[];
};

// Bản đã chuẩn hóa mà driver nhận: địa chỉ luôn là object, danh sách luôn là mảng.
export type Address = { email: string; name?: string };

export type NormalizedMail = {
  from: Address;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  replyTo?: Address;
  subject: string;
  html?: string;
  text?: string;
  attachments: MailAttachment[];
};

export type MailResult = {
  driver: string;
  id: string | null; // id do nhà cung cấp trả về (tra cứu log bên họ)
};

export type MailDriver = {
  name: string;
  send(mail: NormalizedMail): Promise<MailResult>;
};

// Lỗi gửi mail — luôn kèm tên driver để biết hỏng ở đâu.
export class MailError extends Error {
  constructor(
    public driver: string,
    message: string,
    public status?: number
  ) {
    super(`[mail:${driver}] ${message}`);
    this.name = "MailError";
  }
}
