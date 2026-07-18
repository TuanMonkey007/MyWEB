import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { convertRoutes } from "@/lib/dms-routes";
import { saveResult } from "@/lib/dms-store";

// Chuyển tuyến NPP A → NPP B. Nhận multipart: source, template, unitCode.
// Xử lý xong (nhanh) trả về log + token tải kết quả.
export async function POST(req: Request) {
  const form = await req.formData();
  const source = form.get("source");
  const template = form.get("template");
  const unitCode = String(form.get("unitCode") ?? "").trim();

  if (!(source instanceof File)) return jsonError("Thiếu file dữ liệu gốc");
  if (!(template instanceof File)) return jsonError("Thiếu file mẫu import");
  if (!unitCode) return jsonError("Thiếu mã đơn vị NPP mới");
  if (source.size > 40 * 1024 * 1024 || template.size > 40 * 1024 * 1024)
    return jsonError("File tối đa 40MB");

  const logs: string[] = [];
  try {
    const srcBuf = Buffer.from(await source.arrayBuffer());
    const tplBuf = Buffer.from(await template.arrayBuffer());
    const { buffer, fileName, rowCount } = await convertRoutes(
      srcBuf,
      tplBuf,
      { unitCode },
      (m) => logs.push(m)
    );
    const resultToken = await saveResult(buffer);
    return NextResponse.json({ logs, fileName, rowCount, resultToken });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Xử lý thất bại", 422);
  }
}
