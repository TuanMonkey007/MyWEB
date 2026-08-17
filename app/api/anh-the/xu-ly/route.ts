import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { isKhoAnh, taoAnhThe, tenFileKetQua, type KhoAnh } from "@/lib/photo-id";
import { luuAnhGoc, luuKetQua, taoPhien } from "@/lib/photo-id-store";
import { randomUUID } from "crypto";

const TOI_DA_ANH = 200;
const TOI_DA_MOI_ANH = 25 * 1024 * 1024;

// Nhận nhiều ảnh cùng lúc, cắt về khổ thẻ, trả danh sách kết quả để xem trước.
// Ảnh gốc được giữ lại trong phiên để còn cắt lại khi người dùng nhích khung.
export async function POST(req: Request) {
  const form = await req.formData();
  const kho = String(form.get("kho") ?? "3x4");
  if (!isKhoAnh(kho)) return jsonError("Khổ ảnh không hợp lệ");

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return jsonError("Chưa chọn ảnh nào");
  if (files.length > TOI_DA_ANH) return jsonError(`Tối đa ${TOI_DA_ANH} ảnh mỗi lần`);

  const phien = await taoPhien();
  const ketQua: {
    id: string;
    tenGoc: string;
    tenMoi: string;
    theoKhuonMat: boolean;
    duNgang: number;
    duDoc: number;
    loi?: string;
  }[] = [];

  for (const file of files) {
    const id = randomUUID();
    if (file.size > TOI_DA_MOI_ANH) {
      ketQua.push({ id, tenGoc: file.name, tenMoi: "", theoKhuonMat: false, duNgang: 0, duDoc: 0, loi: "Ảnh quá 25MB" });
      continue;
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const { buffer, theoKhuonMat, duNgang, duDoc } = await taoAnhThe(buf, kho as KhoAnh);
      await luuAnhGoc(phien, id, buf);
      await luuKetQua(phien, id, buffer);
      ketQua.push({ id, tenGoc: file.name, tenMoi: tenFileKetQua(file.name, kho), theoKhuonMat, duNgang, duDoc });
    } catch {
      // Một ảnh hỏng không được làm chết cả lô — báo riêng ảnh đó
      ketQua.push({
        id,
        tenGoc: file.name,
        tenMoi: "",
        theoKhuonMat: false,
        duNgang: 0,
        duDoc: 0,
        loi: "Không đọc được ảnh (thử JPG/PNG/HEIC đã đổi sang JPG)",
      });
    }
  }

  return NextResponse.json({ phien, kho, ketQua });
}
