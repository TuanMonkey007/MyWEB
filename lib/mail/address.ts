// Xử lý địa chỉ mail — tách riêng để driver dùng được mà không kéo theo DB.
import type { Address, MailAddress } from "./types";

// Chấp nhận cả "a@b.com", "Tên hiển thị <a@b.com>" lẫn { email, name }.
export function parseAddress(value: MailAddress): Address {
  if (typeof value !== "string") return { email: value.email.trim(), name: value.name?.trim() };
  const m = value.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { email: m[2].trim(), name: m[1].replace(/^["']|["']$/g, "").trim() || undefined };
  return { email: value.trim() };
}

export function parseList(value: MailAddress | MailAddress[] | undefined): Address[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(parseAddress).filter((a) => a.email);
}

// Dạng chuỗi chuẩn RFC "Tên <a@b.com>" — Resend/Mailgun/SMTP đều nhận dạng này.
export function formatAddress(a: Address): string {
  return a.name ? `${a.name} <${a.email}>` : a.email;
}
