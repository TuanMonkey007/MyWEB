// BR-7: tiền VNĐ hiển thị phân tách hàng nghìn, không thập phân (vd. 1.500.000 ₫)
export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(amount))} ₫`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// "2026-07-13" cho <input type="date">, theo giờ địa phương
export function toDateInputValue(date: Date | string = new Date()): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Nhập liệu tiền: "1500000" | "1.500.000" -> 1500000
export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// Hiển thị số đang gõ với dấu chấm hàng nghìn: 1500000 -> "1.500.000"
export function formatAmountInput(value: number): string {
  if (!value) return "";
  return new Intl.NumberFormat("vi-VN").format(value);
}
