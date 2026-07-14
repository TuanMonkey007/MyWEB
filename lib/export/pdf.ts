// Xuất phiếu đề xuất ra PDF trình ký — A4 ngang, font Tinos (tương thích
// Times New Roman, hỗ trợ tiếng Việt). KHÔNG có cột dự trù tiền (bản trình ký).
import path from "path";
import PDFDocument from "pdfkit";
import {
  FORM_TEMPLATE as T,
  buildExportRows,
  type ExportProposal,
} from "./template";

const FONTS = path.join(process.cwd(), "assets", "fonts");
const PAGE_W = 841.89; // A4 landscape (pt)
const PAGE_H = 595.28;
const MARGIN = 26;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - MARGIN;
const PAD = 3.5;

type Doc = typeof PDFDocument.prototype;

// Độ rộng 13 cột theo tỉ lệ mẫu Excel, scale ra bề ngang A4
const totalUnits = T.columnWidths.reduce((s, w) => s + w, 0);
const COL_W = T.columnWidths.map((w) => (w / totalUnits) * CONTENT_W);
const CENTER_COLS = new Set([0, 1, 3, 4, 5, 6, 8, 9]);

function rowHeight(doc: Doc, cells: string[], font: string, size: number): number {
  let h = 0;
  doc.font(font).fontSize(size);
  cells.forEach((text, i) => {
    const th = doc.heightOfString(text || " ", { width: COL_W[i] - PAD * 2 });
    h = Math.max(h, th);
  });
  return h + PAD * 2;
}

function drawTableRow(
  doc: Doc,
  cells: string[],
  y: number,
  { font, size, center = false }: { font: string; size: number; center?: boolean }
): number {
  const h = rowHeight(doc, cells, font, size);
  let x = MARGIN;
  doc.font(font).fontSize(size).lineWidth(0.5);
  cells.forEach((text, i) => {
    doc.rect(x, y, COL_W[i], h).stroke();
    const align = center || CENTER_COLS.has(i) ? "center" : "left";
    const th = doc.heightOfString(text || " ", { width: COL_W[i] - PAD * 2 });
    doc.text(text || "", x + PAD, y + (h - th) / 2, {
      width: COL_W[i] - PAD * 2,
      align,
    });
    x += COL_W[i];
  });
  return y + h;
}

export async function buildProposalPdf(proposal: ExportProposal): Promise<Buffer> {
  const rows = buildExportRows(proposal);

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: MARGIN,
    font: path.join(FONTS, "Tinos-Regular.ttf"),
    info: { Title: T.formTitle },
  });
  doc.registerFont("R", path.join(FONTS, "Tinos-Regular.ttf"));
  doc.registerFont("B", path.join(FONTS, "Tinos-Bold.ttf"));
  doc.registerFont("I", path.join(FONTS, "Tinos-Italic.ttf"));

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  // ---- Header form ----
  let y = MARGIN;
  doc.font("B").fontSize(13.5);
  doc.text(T.processTitle, MARGIN, y, { width: CONTENT_W, align: "center" });
  y += doc.heightOfString(T.processTitle, { width: CONTENT_W }) + 10;

  // Trái: tên phiếu · Phải: khối số tài liệu
  const infoX = MARGIN + CONTENT_W * 0.74;
  const infoW = CONTENT_W * 0.26;
  doc.font("B").fontSize(15);
  doc.text(T.formTitle, MARGIN, y + 8, { width: CONTENT_W * 0.7, align: "center" });
  doc.font("R").fontSize(10.5);
  const info = [
    `Số tài liệu: ${T.docCode}`,
    `Ấn bản: ${T.edition}`,
    `Ngày hiệu lực: ${T.effectiveDate}`,
  ];
  info.forEach((line, i) => doc.text(line, infoX, y + i * 14, { width: infoW }));
  y += Math.max(3 * 14, 30) + 8;

  doc.font("R").fontSize(11.5);
  doc.text(`Bộ phận đề xuất: ${T.department}`, MARGIN, y);
  y += 17;
  doc.text(T.categoryLeft, MARGIN + CONTENT_W * 0.12, y);
  doc.font("B").text(T.categoryRight, MARGIN + CONTENT_W * 0.55, y);
  y += 20;

  // ---- Bảng ----
  const headers = [...T.headers];
  y = drawTableRow(doc, headers, y, { font: "B", size: 9, center: true });
  for (const row of rows) {
    const h = rowHeight(doc, row.cells, "R", 10);
    if (y + h > BOTTOM - 20) {
      doc.addPage();
      y = MARGIN;
      y = drawTableRow(doc, headers, y, { font: "B", size: 9, center: true });
    }
    y = drawTableRow(doc, row.cells, y, { font: "R", size: 10 });
  }

  // ---- Tổng + ghi chú ----
  const total = rows.reduce((s, x) => s + x.proposedAmount, 0);
  const footerLines: { text: string; font: string; size: number; indent: number }[] = [
    {
      text: `Tổng ngân sách dự kiến: ${total.toLocaleString("vi-VN")} đ`,
      font: "B",
      size: 11.5,
      indent: 0,
    },
    ...T.notes.map((n, i) => ({ text: n, font: "R", size: 10.5, indent: i === 0 ? 0 : 10 })),
    { text: T.attention, font: "R", size: 10.5, indent: 0 },
  ];

  // Ước lượng khối footer + chữ ký; không đủ chỗ thì sang trang
  const sigBlockH = 14 + 4 + 16 + 55;
  let footerH = 8;
  for (const l of footerLines) {
    doc.font(l.font).fontSize(l.size);
    footerH += doc.heightOfString(l.text, { width: CONTENT_W - l.indent }) + 3;
  }
  if (y + footerH + sigBlockH > BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }

  y += 8;
  for (const l of footerLines) {
    doc.font(l.font).fontSize(l.size);
    doc.text(l.text, MARGIN + l.indent, y, { width: CONTENT_W - l.indent });
    y += doc.heightOfString(l.text, { width: CONTENT_W - l.indent }) + 3;
  }

  // ---- Ngày + chữ ký ----
  const d = proposal.proposedAt;
  const dateLine = `Ngày ${String(d.getDate()).padStart(2, "0")} tháng ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} năm ${d.getFullYear()}`;
  const sigW = CONTENT_W / T.signatures.length;

  y += 4;
  doc.font("I").fontSize(10.5);
  doc.text(dateLine, MARGIN + sigW * 4, y, { width: sigW, align: "center" });
  y += 16;
  doc.font("B").fontSize(11.5);
  T.signatures.forEach((title, i) => {
    doc.text(title, MARGIN + sigW * i, y, { width: sigW, align: "center" });
  });

  doc.end();
  return done;
}
