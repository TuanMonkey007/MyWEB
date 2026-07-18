import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { jsonError } from "@/lib/api";
import { deleteResult, resultPath } from "@/lib/dms-store";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const p = resultPath(token);
  if (!p) return jsonError("Token không hợp lệ", 400);
  const name = new URL(req.url).searchParams.get("name") || "Import_Tuyen.xlsx";
  try {
    const data = await readFile(p);
    deleteResult(token);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch {
    return jsonError("Kết quả đã hết hạn — hãy xử lý lại", 410);
  }
}
