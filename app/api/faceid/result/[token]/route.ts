import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { jsonError } from "@/lib/api";
import { deleteTemp, tempPath } from "@/lib/faceid-store";

type Params = { params: Promise<{ token: string }> };

// Tải file kết quả rồi xóa file tạm (dùng một lần)
export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const p = tempPath(token, "out");
  if (!p) return jsonError("Token không hợp lệ", 400);

  const name = new URL(req.url).searchParams.get("name") || "ket_qua.xlsx";
  try {
    const data = await readFile(p);
    // xóa sau khi đọc (không chờ)
    deleteTemp(token, "out");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch {
    return jsonError("Kết quả đã hết hạn — hãy xử lý lại", 410);
  }
}
