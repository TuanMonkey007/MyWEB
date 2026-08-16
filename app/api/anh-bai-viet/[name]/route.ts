import { readFile } from "fs/promises";
import { articleImagePath } from "@/lib/article-image";

// Ảnh bìa bài viết — CÔNG KHAI vì trang chủ kiểu báo hiển thị cho cả khách.
// Chỉ phục vụ ảnh, không tiết lộ thông tin gì về bài viết; tên file là UUID nên
// không đoán được. Bài nội bộ vẫn ẩn ở tầng nội dung.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const p = articleImagePath(name);
  if (!p) return new Response("Không hợp lệ", { status: 400 });

  const buf = await readFile(p).catch(() => null);
  if (!buf) return new Response("Không tìm thấy", { status: 404 });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/jpeg",
      // Tên file là UUID, đổi ảnh là đổi tên → cache lâu được
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
