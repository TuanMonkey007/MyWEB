import { docKetQua } from "@/lib/photo-id-store";

// Xem ảnh đã cắt. Không cache vì người dùng nhích khung là ảnh đổi ngay.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ phien: string; id: string }> }
) {
  const { phien, id } = await params;
  const buf = await docKetQua(phien, id);
  if (!buf) return new Response("Không tìm thấy", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
  });
}
