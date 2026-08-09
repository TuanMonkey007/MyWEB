import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import { jsonError } from "@/lib/api";
import { validateTemplate } from "@/lib/dms-routes";
import { dmsTemplatePath, setSetting, templatesDir } from "@/lib/settings";

// Lưu mẫu import tuyến dùng chung cho module DMS. Nằm dưới /api/settings nên
// proxy đã chặn sẵn chỉ ADMIN — người chạy chuyển đổi không tự đổi mẫu chung được.

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file mẫu");
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return jsonError("File mẫu phải là .xlsx");
  if (file.size > 10 * 1024 * 1024) return jsonError("File mẫu tối đa 10MB");

  const buffer = Buffer.from(await file.arrayBuffer());

  // Bắt lỗi ngay lúc lưu thay vì để tới lúc chạy chuyển đổi mới phát hiện
  const problem = await validateTemplate(buffer);
  if (problem) return jsonError(problem, 422);

  await mkdir(templatesDir(), { recursive: true });
  await writeFile(dmsTemplatePath(), buffer);
  await setSetting("dmsTemplateName", file.name);
  return NextResponse.json({ ok: true, fileName: file.name }, { status: 201 });
}

export async function DELETE() {
  await unlink(dmsTemplatePath()).catch(() => {});
  await setSetting("dmsTemplateName", null);
  return NextResponse.json({ ok: true });
}
