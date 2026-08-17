import { jsonError } from "@/lib/api";
import JSZip from "jszip";
import { docKetQua } from "@/lib/photo-id-store";

// Gói tất cả ảnh đã cắt thành một file ZIP, giữ nguyên tên gốc để còn khớp lại
// với từng công nhân. Trùng tên thì thêm hậu tố số.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const phien = String(body.phien ?? "");
  const danhSach = Array.isArray(body.anh) ? body.anh : [];
  if (danhSach.length === 0) return jsonError("Không có ảnh nào để tải");

  const zip = new JSZip();
  const daDung = new Map<string, number>();
  let dem = 0;

  for (const item of danhSach) {
    const id = String((item as Record<string, unknown>)?.id ?? "");
    const ten = String((item as Record<string, unknown>)?.ten ?? "anh.jpg");
    const buf = await docKetQua(phien, id);
    if (!buf) continue;

    let tenCuoi = ten;
    const lan = daDung.get(ten) ?? 0;
    if (lan > 0) tenCuoi = ten.replace(/\.jpg$/i, `_${lan + 1}.jpg`);
    daDung.set(ten, lan + 1);

    zip.file(tenCuoi, buf);
    dem++;
  }

  if (dem === 0) return jsonError("Không đọc được ảnh nào — phiên có thể đã hết hạn", 404);

  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="anh-the-${dem}-anh.zip"`,
    },
  });
}
