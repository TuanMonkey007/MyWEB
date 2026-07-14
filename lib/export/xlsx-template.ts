// Xuất phiếu bằng CHÍNH file mẫu công ty đã upload (giữ nguyên logo, định dạng):
// tìm dòng tiêu đề "STT", điền hạng mục vào các dòng kẻ sẵn, thiếu thì nhân bản
// thêm dòng (merge/chữ ký bên dưới tự dịch theo), điền tổng + ngày + bộ phận.
import path from "path";
import { access } from "fs/promises";
import ExcelJS from "exceljs";
import {
  FORM_TEMPLATE as T,
  buildExportRows,
  type ExportProposal,
} from "./template";
import { EXPORT_TEMPLATE_FILE, templatesDir } from "@/lib/settings";

export function exportTemplatePath(): string {
  return path.join(templatesDir(), EXPORT_TEMPLATE_FILE);
}

export async function hasExportTemplate(): Promise<boolean> {
  try {
    await access(exportTemplatePath());
    return true;
  } catch {
    return false;
  }
}

const TEXT_COLS = [3, 8, 11, 12, 13]; // C, H, K, L, M — ô chữ dài cần wrap
const CENTER_COLS = [1, 2, 4, 5, 6, 7, 9, 10];

// Lấy text của ô: hỗ trợ cả richText, chuẩn hóa NFC để so sánh tiếng Việt
// (file Excel thực tế hay lẫn Unicode dựng sẵn/tổ hợp)
function cellText(value: ExcelJS.CellValue): string | null {
  if (typeof value === "string") return value.normalize("NFC");
  if (value && typeof value === "object" && "richText" in value) {
    return value.richText
      .map((t) => t.text)
      .join("")
      .normalize("NFC");
  }
  return null;
}

export async function fillProposalTemplate(proposal: ExportProposal): Promise<Buffer> {
  const rows = buildExportRows(proposal);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(exportTemplatePath());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File mẫu không có worksheet nào");

  // 1. Dòng tiêu đề bảng = dòng chứa ô "STT"
  let headerRow = 0;
  ws.eachRow((row, rn) => {
    if (headerRow) return;
    row.eachCell((cell) => {
      if (cellText(cell.value)?.trim() === "STT") headerRow = rn;
    });
  });
  if (!headerRow)
    throw new Error('Không tìm thấy dòng tiêu đề có ô "STT" trong file mẫu');

  // 2. Số dòng kẻ sẵn dưới tiêu đề (dòng có border ở cột A)
  let available = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const b = ws.getCell(r, 1).border;
    if (b && (b.top || b.left || b.bottom)) available++;
    else break;
  }

  // 3. Thiếu dòng thì nhân bản dòng mẫu — merge/chữ ký bên dưới tự dịch
  const inserted = Math.max(0, rows.length - available);
  if (inserted > 0) ws.duplicateRow(headerRow + 1, inserted, true);

  // Print area không tự giãn khi chèn dòng — tự cộng thêm
  if (inserted > 0 && ws.pageSetup.printArea) {
    ws.pageSetup.printArea = ws.pageSetup.printArea.replace(
      /(\d+)$/,
      (m) => String(Number(m) + inserted)
    );
  }

  // 4. Điền hạng mục (A–M) + cột N dự trù (ngoài vùng in của mẫu)
  rows.forEach((row, i) => {
    const r = headerRow + 1 + i;
    row.cells.forEach((v, ci) => {
      if (!v) return;
      const cell = ws.getCell(r, ci + 1);
      cell.value = CENTER_COLS.includes(ci + 1) && /^\d+$/.test(v) ? Number(v) : v;
      if (TEXT_COLS.includes(ci + 1)) {
        cell.alignment = { ...cell.alignment, wrapText: true, vertical: "middle" };
      } else {
        cell.alignment = { ...cell.alignment, horizontal: "center", vertical: "middle" };
      }
    });
    const n = ws.getCell(r, 14);
    n.value = row.proposedAmount || null;
    n.numFmt = "#,##0";
    n.font = { name: "Times New Roman", size: 11, italic: true, color: { argb: "FF808080" } };
    // bỏ chiều cao cứng để Excel tự giãn dòng theo nội dung wrap
    ws.getRow(r).height = undefined as unknown as number;
  });

  // 5. Điền các ô văn bản: bộ phận, tổng, ngày
  const total = rows.reduce((s, x) => s + x.proposedAmount, 0);
  const d = proposal.proposedAt;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");

  ws.eachRow((row, rn) => {
    row.eachCell((cell) => {
      const v = cellText(cell.value);
      if (!v) return;
      if (v.startsWith("Bộ phận đề xuất") && /[….]{3,}/.test(v)) {
        cell.value = `Bộ phận đề xuất: ${T.department}`;
      } else if (v.startsWith("Tổng ngân sách dự kiến")) {
        cell.value = `Tổng ngân sách dự kiến: ${total.toLocaleString("vi-VN")} đ`;
        const n = ws.getCell(rn, 14);
        n.value = {
          formula: `SUM(N${headerRow + 1}:N${headerRow + rows.length})`,
        };
        n.numFmt = "#,##0";
      } else if (/^Ngày\s*[….]/.test(v)) {
        cell.value = `Ngày ${dd} tháng ${mm} năm ${d.getFullYear()}`;
      }
    });
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
