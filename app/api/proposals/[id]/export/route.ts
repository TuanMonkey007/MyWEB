import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { buildProposalPdf } from "@/lib/export/pdf";
import { buildProposalXlsx } from "@/lib/export/xlsx";
import {
  fillProposalTemplate,
  hasExportTemplate,
} from "@/lib/export/xlsx-template";
import { exportFileName } from "@/lib/export/template";

type Params = { params: Promise<{ id: string }> };

// Xuất phiếu đề xuất: ?format=pdf (trình ký, không cột dự trù)
//                     ?format=xlsx (bản nháp, có cột dự trù ngoài vùng in)
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";
  if (format !== "pdf" && format !== "xlsx")
    return jsonError("format phải là pdf hoặc xlsx");

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      budgetYear: true,
      items: { orderBy: { createdAt: "asc" }, include: { fund: true } },
    },
  });
  if (!proposal) return jsonError("Không tìm thấy đợt đề xuất", 404);
  if (!proposal.items.some((it) => it.status !== "CANCELLED"))
    return jsonError("Đợt chưa có hạng mục nào (ngoài mục đã huỷ) để xuất");

  // Excel: ưu tiên điền vào file mẫu công ty đã upload (giữ logo, định dạng);
  // chưa upload mẫu thì dùng layout dựng sẵn
  const [buffer, mimeType] =
    format === "pdf"
      ? [await buildProposalPdf(proposal), "application/pdf"]
      : [
          (await hasExportTemplate())
            ? await fillProposalTemplate(proposal)
            : await buildProposalXlsx(proposal),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

  const fileName = exportFileName(proposal, format);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
