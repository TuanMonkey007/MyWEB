// Xuất phiếu đề xuất ra Excel theo mẫu CT.MH-QT-01/BM01.
// Cột N = "Dự trù (VNĐ)" để nháp — nằm NGOÀI vùng in (print area A:M),
// nên mở file thì thấy, in/xuất PDF từ Excel thì không dính.
import ExcelJS from "exceljs";
import {
  FORM_TEMPLATE as T,
  buildExportRows,
  type ExportProposal,
} from "./template";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

const FONT = "Times New Roman";

export async function buildProposalXlsx(proposal: ExportProposal): Promise<Buffer> {
  const rows = buildExportRows(proposal);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ĐXMH", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.2, right: 0.2, top: 0.34, bottom: 0.24, header: 0.33, footer: 0.17 },
    },
  });

  // Độ rộng cột theo mẫu gốc + cột N dự trù
  T.columnWidths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.getColumn(14).width = 14;

  // ---- Header form ----
  ws.mergeCells("A1:M2");
  ws.getCell("A1").value = T.processTitle;
  ws.getCell("A1").font = { name: FONT, size: 14, bold: true };
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getRow(2).height = 29;

  ws.mergeCells("A3:I5");
  ws.getCell("A3").value = T.formTitle;
  ws.getCell("A3").font = { name: FONT, size: 13, bold: true };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };

  const info: [string, string][] = [
    ["Số tài liệu", T.docCode],
    ["Ấn bản", T.edition],
    ["Ngày hiệu lực", T.effectiveDate],
  ];
  info.forEach(([label, value], i) => {
    const r = 3 + i;
    ws.getCell(`J${r}`).value = label;
    ws.getCell(`J${r}`).font = { name: FONT, size: 12 };
    ws.mergeCells(`K${r}:M${r}`);
    ws.getCell(`K${r}`).value = value;
    ws.getCell(`K${r}`).font = { name: FONT, size: 12 };
  });

  ws.mergeCells("A7:M7");
  ws.getCell("A7").value = `Bộ phận đề xuất: ${T.department}`;
  ws.getCell("A7").font = { name: FONT, size: 12 };
  ws.getRow(7).height = 25;

  ws.getCell("C8").value = T.categoryLeft;
  ws.getCell("C8").font = { name: FONT, size: 12 };
  ws.getCell("J8").value = T.categoryRight;
  ws.getCell("J8").font = { name: FONT, size: 12, bold: true };
  ws.getRow(8).height = 25;

  // ---- Bảng hạng mục ----
  const headerRow = 9;
  T.headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: FONT, size: 10, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
  });
  // Cột N dự trù (ngoài vùng in)
  const nHead = ws.getCell(headerRow, 14);
  nHead.value = "DỰ TRÙ (VNĐ)";
  nHead.font = { name: FONT, size: 10, bold: true, italic: true, color: { argb: "FF808080" } };
  nHead.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getRow(headerRow).height = 51;

  const CENTER_COLS = new Set([0, 1, 3, 4, 5, 6, 8, 9]); // STT, mã, ĐVT, SL, tồn, SL mua, 2 cột thời gian
  rows.forEach((row, ri) => {
    const r = headerRow + 1 + ri;
    row.cells.forEach((v, ci) => {
      const cell = ws.getCell(r, ci + 1);
      cell.value = v;
      cell.font = { name: FONT, size: 11 };
      cell.alignment = {
        horizontal: CENTER_COLS.has(ci) ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = THIN_BORDER;
    });
    const nCell = ws.getCell(r, 14);
    nCell.value = row.proposedAmount || null;
    nCell.numFmt = "#,##0";
    nCell.font = { name: FONT, size: 11, italic: true, color: { argb: "FF808080" } };
    nCell.alignment = { horizontal: "right", vertical: "middle" };
  });

  // ---- Tổng + ghi chú + chữ ký ----
  let r = headerRow + rows.length + 1; // 1 dòng đệm
  r += 1;
  const total = rows.reduce((s, x) => s + x.proposedAmount, 0);
  ws.mergeCells(`A${r}:M${r}`);
  ws.getCell(`A${r}`).value = `Tổng ngân sách dự kiến: ${total.toLocaleString("vi-VN")} đ`;
  ws.getCell(`A${r}`).font = { name: FONT, size: 12, bold: true };
  // Tổng cột N bằng công thức để user chỉnh nháp là tự cập nhật
  const nTotal = ws.getCell(r, 14);
  nTotal.value = {
    formula: `SUM(N${headerRow + 1}:N${headerRow + rows.length})`,
  };
  nTotal.numFmt = "#,##0";
  nTotal.font = { name: FONT, size: 11, bold: true, italic: true, color: { argb: "FF808080" } };

  r += 2;
  T.notes.forEach((line, i) => {
    const cell = ws.getCell(i === 0 ? `A${r}` : `B${r}`);
    cell.value = line;
    cell.font = { name: FONT, size: 12 };
    r += 1;
  });
  ws.mergeCells(`A${r}:M${r}`);
  ws.getCell(`A${r}`).value = T.attention;
  ws.getCell(`A${r}`).font = { name: FONT, size: 12 };
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: "top" };
  ws.getRow(r).height = 40;

  r += 1;
  const d = proposal.proposedAt;
  ws.mergeCells(`K${r}:M${r}`);
  ws.getCell(`K${r}`).value = `Ngày ${String(d.getDate()).padStart(2, "0")} tháng ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} năm ${d.getFullYear()}`;
  ws.getCell(`K${r}`).font = { name: FONT, size: 12, italic: true };
  ws.getCell(`K${r}`).alignment = { horizontal: "center" };

  r += 1;
  const sigCells = ["B", "E", "G", "I", "K"];
  const sigMerges = [null, null, `G${r}:H${r}`, `I${r}:J${r}`, `K${r}:M${r}`];
  T.signatures.forEach((title, i) => {
    if (sigMerges[i]) ws.mergeCells(sigMerges[i]!);
    const cell = ws.getCell(`${sigCells[i]}${r}`);
    cell.value = title;
    cell.font = { name: FONT, size: 12, bold: true };
    cell.alignment = { horizontal: "center" };
  });
  ws.getRow(r).height = 20;

  // Vùng in A:M — cột N nháp không dính khi in; chừa 5 dòng ký
  ws.pageSetup.printArea = `A1:M${r + 5}`;

  return Buffer.from(await wb.xlsx.writeBuffer());
}
