import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { listPersonnel, readRows } from "@/lib/faceid";
import { saveTemp } from "@/lib/faceid-store";

// Nhận file gốc (raw body), đọc & trả danh sách nhân sự để người dùng chọn
// ID loại bỏ / ngoại lệ. Lưu tạm file để bước xử lý dùng lại (không up 2 lần).
export async function POST(req: Request) {
  const name = new URL(req.url).searchParams.get("name") ?? "file.xlsx";
  if (!req.body) return jsonError("Không có dữ liệu file");

  const buffer = Buffer.from(await req.arrayBuffer());
  if (buffer.length === 0) return jsonError("File rỗng");
  if (buffer.length > 60 * 1024 * 1024) return jsonError("File tối đa 60MB");

  try {
    const { rows, columns } = await readRows(buffer);
    const personnel = listPersonnel(rows);
    const token = await saveTemp(buffer, "src");
    return NextResponse.json({
      token,
      fileName: name,
      rowCount: rows.length,
      columns,
      personnel,
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Không đọc được file — kiểm tra định dạng Excel",
      422
    );
  }
}
