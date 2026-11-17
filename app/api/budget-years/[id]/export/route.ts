import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { buildYearReportXlsx } from "@/lib/export/year-report";

type Params = { params: Promise<{ id: string }> };

// Báo cáo theo dõi chi tiêu cả năm (Excel). Đường dẫn chứa "/export" nên proxy
// yêu cầu quyền "export" của module mua hàng.
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const report = await buildYearReportXlsx(id);
  if (!report) return jsonError("Không tìm thấy năm ngân sách", 404);

  const fileName = `Bao cao theo doi chi tieu mua hang IT ${report.year}.xlsx`;
  return new NextResponse(new Uint8Array(report.buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
