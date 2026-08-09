import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { jsonError } from "@/lib/api";
import { convertRoutes } from "@/lib/dms-routes";
import { saveResult } from "@/lib/dms-store";
import { dmsTemplatePath, getSettings } from "@/lib/settings";

// Chuyển tuyến NPP A → NPP B. Nhận multipart: source, unitCode, và template
// (tùy chọn — không gửi thì dùng mẫu đã lưu trong cài đặt).
// Xử lý xong (nhanh) trả về log + token tải kết quả.
export async function POST(req: Request) {
  const form = await req.formData();
  const source = form.get("source");
  const template = form.get("template");
  const unitCode = String(form.get("unitCode") ?? "").trim();

  if (!(source instanceof File)) return jsonError("Thiếu file dữ liệu gốc");
  if (!unitCode) return jsonError("Thiếu mã đơn vị NPP mới");
  if (source.size > 40 * 1024 * 1024) return jsonError("File tối đa 40MB");
  if (template instanceof File && template.size > 40 * 1024 * 1024)
    return jsonError("File tối đa 40MB");

  const logs: string[] = [];
  try {
    const srcBuf = Buffer.from(await source.arrayBuffer());

    // Ưu tiên file gửi kèm (dùng riêng lần này), không có thì lấy mẫu đã lưu
    let tplBuf: Buffer;
    if (template instanceof File) {
      tplBuf = Buffer.from(await template.arrayBuffer());
      logs.push(`Dùng mẫu gửi kèm: ${template.name}`);
    } else {
      const saved = (await getSettings()).dmsTemplateName;
      if (!saved)
        return jsonError(
          "Chưa có mẫu import — quản trị viên cần lưu mẫu ở trang DMS trước",
          422
        );
      tplBuf = await readFile(dmsTemplatePath()).catch(() => {
        throw new Error("Không đọc được mẫu đã lưu — hãy lưu lại mẫu");
      });
      logs.push(`Dùng mẫu đã lưu: ${saved}`);
    }
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
