// Đọc phản hồi HTTP của nhà cung cấp sao cho lỗi hiện ra ĐÚNG NGUYÊN NHÂN.
// Không phải lúc nào họ cũng trả JSON: 401 thường là HTML hoặc text thuần, mà
// "HTTP 401" trơ trọi thì người dùng không biết đường nào mà lần.

export async function readBody(
  res: Response
): Promise<{ data: Record<string, unknown> | null; text: string }> {
  const text = await res.text().catch(() => "");
  try {
    return { data: JSON.parse(text) as Record<string, unknown>, text };
  } catch {
    return { data: null, text };
  }
}

export function errorMessage(
  status: number,
  data: Record<string, unknown> | null,
  text: string
): string {
  // Các nhà đặt tên trường khác nhau: message / error / errors[]
  const direct = data?.message ?? data?.error;
  if (typeof direct === "string" && direct.trim()) return withHint(status, direct.trim());
  if (Array.isArray(data?.errors)) {
    const joined = data.errors
      .map((e) => (typeof e === "string" ? e : ((e as { message?: string })?.message ?? "")))
      .filter(Boolean)
      .join("; ");
    if (joined) return withHint(status, joined);
  }
  // Không phải JSON: gỡ thẻ HTML lấy phần chữ
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plain) return withHint(status, `HTTP ${status} — ${plain.slice(0, 200)}`);
  return withHint(status, `HTTP ${status}`);
}

// Gợi ý cho các mã lỗi hay gặp lúc mới cấu hình
function withHint(status: number, message: string): string {
  if (status === 401 || status === 403)
    return `${message} (kiểm tra lại API key; với Mailgun còn phải đúng vùng us/eu)`;
  if (status === 404)
    return `${message} (kiểm tra lại domain đã khai trong cấu hình)`;
  if (status === 429) return `${message} (đã chạm giới hạn gửi của nhà cung cấp)`;
  return message;
}
