import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { saveReceiptImage } from "@/lib/upload";

// FR-5: nhận ảnh multipart, nén + resize bằng sharp, trả về tên file
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file ảnh");
  if (!file.type.startsWith("image/"))
    return jsonError("File phải là ảnh (jpg, png, webp...)");
  if (file.size > 20 * 1024 * 1024) return jsonError("Ảnh tối đa 20MB");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const imagePath = await saveReceiptImage(buffer);
    return NextResponse.json({ imagePath }, { status: 201 });
  } catch {
    return jsonError("Không xử lý được ảnh — kiểm tra định dạng file", 422);
  }
}
