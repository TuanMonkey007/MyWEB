// Thông số mẫu phiếu đề xuất mua hàng (form CT.MH-QT-01/BM01)
// — sửa file này khi công ty đổi mẫu/mã tài liệu/chức danh ký.
import type { Prisma } from "@prisma/client";

export const FORM_TEMPLATE = {
  processTitle:
    "QUY TRÌNH MUA HÀNG VẬT TƯ, CÔNG TRÌNH, DỊCH VỤ, SẢN PHẨM THƯƠNG MẠI",
  formTitle: "PHIẾU ĐỀ XUẤT MUA HÀNG",
  docCode: "CT.MH- QT-01/BM01",
  edition: "02",
  effectiveDate: "01/05/2025",
  department: "Phòng IT",
  categoryLeft: "Nguyên vật liệu, bao bì",
  categoryRight: "Vật tư/ CCDC/TSCĐ/Công trình/Dịch vụ",
  headers: [
    "STT",
    "MÃ HH",
    "TÊN HÀNG HOÁ",
    "ĐVT",
    "SỐ LƯỢNG NHU CẦU",
    "TỒN HẾT NGÀY\n.........",
    "SỐ LƯỢNG CẦN MUA",
    "YÊU CẦU\nKỸ THUẬT",
    "THỜI GIAN\nYÊU CẦU",
    "THỜI GIAN\nĐÁP ỨNG",
    "NGUỒN NGÂN SÁCH",
    "LÝ DO ĐỀ XUẤT MUA",
    "Ý KIẾN BỘ PHẬN CHUYÊN MÔN",
  ],
  // Tỉ lệ độ rộng 13 cột A–M, lấy theo width Excel của mẫu gốc
  columnWidths: [4.9, 8.9, 29.3, 7.1, 8.6, 8.4, 8.4, 23.6, 12.6, 12.6, 12.8, 21.0, 13.3],
  notes: [
    'Ghi chú: Cột "Ý kiến bộ phận chức năng" chỉ áp dụng cho những trường hợp cần ý kiến của các phòng: Hành chính, IT, Kỹ thuật,….',
    '     Cột "thời gian đáp ứng" do phòng mua hàng điền',
    '     Cột "thời gian yêu cầu" do bộ phận đề xuất điền',
    "     Đối với các dự án đầu tư lớn BPĐX cần làm tờ trình phân tích chi tiết",
  ],
  attention:
    "Lưu ý: Với số lượng có nhu cầu mà còn tồn, thì BP đề xuất sử dụng Phiếu đề xuất mua hàng được duyệt (SL còn tồn) để đề nghị cấp tối đa trong vòng D+1 ngày, tránh việc bộ phận khác đề xuất cấp gây ảnh hưởng đến số lượng nhu cầu.",
  signatures: [
    "Phê duyệt",
    "Ban ngân sách",
    "Kho  NVL",
    "Đơn vị chuyên môn",
    "Đơn vị đề xuất",
  ],
} as const;

export type ExportProposal = Prisma.ProposalGetPayload<{
  include: { items: { include: { fund: true } }; budgetYear: true };
}>;

// Một dòng hạng mục trên phiếu (13 cột A–M) + tiền dự trù (chỉ Excel)
export type ExportRow = {
  cells: string[];
  proposedAmount: number;
};

export function buildExportRows(proposal: ExportProposal): ExportRow[] {
  const d = proposal.proposedAt;
  const requiredDate = `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;

  return proposal.items
    .filter((it) => it.status !== "CANCELLED")
    .map((it, i) => ({
      cells: [
        String(i + 1),
        "", // MÃ HH — phòng mua hàng điền
        it.name,
        it.unit ?? "",
        String(it.quantity),
        "0", // tồn
        String(it.quantity),
        it.specs ?? "",
        requiredDate,
        "", // thời gian đáp ứng — phòng mua hàng điền
        it.fund.name,
        it.reason ?? "",
        it.notes ?? "",
      ],
      proposedAmount: it.proposedAmount,
    }));
}

export function exportFileName(proposal: ExportProposal, ext: string): string {
  const d = proposal.proposedAt;
  const date = `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
  return `Phieu de xuat mua hang-${date}.${ext}`;
}
