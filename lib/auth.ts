// Lớp đăng nhập đơn giản một người dùng — mật khẩu đọc từ env APP_PASSWORD.
// Cookie chứa SHA-256(APP_PASSWORD): đổi mật khẩu là mọi phiên cũ hết hiệu lực.
// Dùng Web Crypto để chạy được cả ở proxy (edge) lẫn route handler (node).

export const AUTH_COOKIE = "finance_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

export async function expectedToken(): Promise<string> {
  const secret = process.env.APP_PASSWORD ?? "";
  const data = new TextEncoder().encode(`finance-app:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
