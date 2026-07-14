import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import ExcelJS from "exceljs";
import { jsonError } from "@/lib/api";
import { setSetting, templatesDir } from "@/lib/settings";
import { exportTemplatePath } from "@/lib/export/xlsx-template";

// Upload file mẫu xuất phiếu (.xlsx) — hệ thống sẽ điền dữ liệu vào mẫu này
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file mẫu");
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return jsonError("File mẫu phải là .xlsx");
  if (file.size > 10 * 1024 * 1024) return jsonError("File mẫu tối đa 10MB");

  const buffer = Buffer.from(await file.arrayBuffer());

  // Kiểm tra mẫu hợp lệ ngay lúc upload: phải có ô "STT" làm mốc điền dữ liệu
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    let found = false;
    ws?.eachRow((row) =>
      row.eachCell((cell) => {
        if (String(cell.value ?? "").trim() === "STT") found = true;
      })
    );
    if (!found)
      return jsonError(
        'File mẫu không có ô tiêu đề "STT" — hệ thống cần ô này để biết bảng hạng mục nằm ở đâu',
        422
      );
  } catch {
    return jsonError("Không đọc được file — kiểm tra lại định dạng .xlsx", 422);
  }

  await mkdir(templatesDir(), { recursive: true });
  await writeFile(exportTemplatePath(), buffer);
  await setSetting("exportTemplateName", file.name);
  return NextResponse.json({ ok: true, fileName: file.name }, { status: 201 });
}

export async function DELETE() {
  try {
    await unlink(exportTemplatePath());
  } catch {
    // chưa có file — không sao
  }
  await setSetting("exportTemplateName", null);
  return NextResponse.json({ ok: true });
}
