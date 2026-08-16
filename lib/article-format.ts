// Định dạng dùng chung cho khu bài viết — không đụng DB nên client dùng được.

/** "3 giờ trước", "2 ngày trước", quá 30 ngày thì hiện ngày cụ thể */
export function thoiGianTuongDoi(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const phut = Math.floor((Date.now() - date.getTime()) / 60000);
  if (phut < 1) return "vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  if (ngay < 30) return `${ngay} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function anhBia(name: string | null): string | null {
  return name ? `/api/anh-bai-viet/${name}` : null;
}
