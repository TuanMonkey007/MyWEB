import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { isKhoAnh, taoAnhThe, type KhoAnh } from "@/lib/photo-id";
import { docAnhGoc, luuKetQua } from "@/lib/photo-id-store";

// Cắt lại MỘT ảnh khi người dùng nhích khung. Luôn cắt từ ảnh GỐC, không cắt
// chồng lên ảnh đã cắt — cắt chồng nhiều lần sẽ mất nét dần.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const phien = String(body.phien ?? "");
  const id = String(body.id ?? "");
  const kho = String(body.kho ?? "3x4");
  if (!isKhoAnh(kho)) return jsonError("Khổ ảnh không hợp lệ");

  const goc = await docAnhGoc(phien, id);
  if (!goc) return jsonError("Không tìm thấy ảnh gốc — phiên có thể đã hết hạn", 404);

  const so = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  try {
    const { buffer, duNgang, duDoc } = await taoAnhThe(goc, kho as KhoAnh, {
      lechNgang: so(body.lechNgang),
      lechDoc: so(body.lechDoc),
      phongTo: so(body.phongTo),
    });
    await luuKetQua(phien, id, buffer);
    return NextResponse.json({ ok: true, duNgang, duDoc });
  } catch {
    return jsonError("Cắt lại thất bại", 422);
  }
}
