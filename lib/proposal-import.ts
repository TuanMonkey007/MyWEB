// Đọc phiếu đề xuất mua hàng đã điền (mẫu CT.MH-QT-01/BM01) để import.
// Dò dòng tiêu đề có ô "STT", map cột theo tên, đọc hạng mục tới khi hết.
import ExcelJS from "exceljs";

export type ParsedItem = {
  name: string;
  unit: string | null;
  quantity: number;
  specs: string | null;
  reason: string | null;
  notes: string | null;
  fundName: string; // text cột "Nguồn ngân sách"
  amountRaw: number; // giá trị cột dự trù NGUYÊN BẢN (chưa nhân đơn vị)
};

export type ParsedProposal = {
  proposedAt: string | null; // ISO nếu đọc được "Ngày.. tháng.. năm.."
  items: ParsedItem[];
};

function cellText(value: ExcelJS.CellValue): string {
  let s: string;
  if (value == null) s = "";
  else if (value instanceof Date) s = value.toISOString();
  else if (typeof value === "object") {
    if ("text" in value && value.text != null) s = String(value.text);
    else if ("result" in value && (value as { result: unknown }).result != null)
      s = String((value as { result: unknown }).result);
    else if ("richText" in value) s = value.richText.map((t) => t.text).join("");
    else s = "";
  } else s = String(value);
  return s.normalize("NFC");
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();

function parseNumber(text: string): number {
  const cleaned = text.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export async function parseProposalWorkbook(buffer: Buffer): Promise<ParsedProposal> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File không có worksheet nào");

  // Dò dòng tiêu đề chứa ô "STT"
  let headerRow = 0;
  const colMap: Record<string, number> = {};
  for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) cells.push(norm(cellText(row.getCell(c).value)));
    if (cells.some((t) => t === "STT")) {
      headerRow = r;
      cells.forEach((h, i) => {
        const c = i + 1;
        if (h.includes("TÊN HÀNG")) colMap.name = c;
        else if (h === "ĐVT" || h.includes("ĐVT")) colMap.unit = c;
        else if (h.includes("CẦN MUA")) colMap.quantity = c;
        else if (h.includes("KỸ THUẬT")) colMap.specs = c;
        else if (h.includes("NGÂN SÁCH")) colMap.fund = c;
        else if (h.includes("LÝ DO")) colMap.reason = c;
        else if (h.includes("Ý KIẾN")) colMap.notes = c;
        else if (h.includes("DỰ TRÙ")) colMap.amount = c;
      });
      // dự phòng cột số lượng nếu không có "cần mua"
      if (!colMap.quantity) {
        cells.forEach((h, i) => {
          if (!colMap.quantity && h.includes("NHU CẦU")) colMap.quantity = i + 1;
        });
      }
      break;
    }
  }
  if (!headerRow) throw new Error('Không tìm thấy dòng tiêu đề có ô "STT" — file không đúng mẫu phiếu đề xuất');
  if (!colMap.name) throw new Error('Không tìm thấy cột "TÊN HÀNG HOÁ" trong phiếu');
  if (!colMap.fund) throw new Error('Không tìm thấy cột "NGUỒN NGÂN SÁCH" trong phiếu');

  const get = (row: ExcelJS.Row, col: number | undefined) =>
    col ? cellText(row.getCell(col).value).trim() : "";

  // Cột dự trù có thể KHÔNG có tiêu đề (người dùng nháp thêm cột số bên phải).
  // Nếu chưa map được, dò cột bên phải các cột đã biết có nhiều giá trị số.
  if (!colMap.amount) {
    const maxKnown = Math.max(0, ...Object.values(colMap));
    for (let c = maxKnown + 1; c <= ws.columnCount; c++) {
      let numeric = 0;
      for (let r = headerRow + 1; r <= Math.min(ws.rowCount, headerRow + 30); r++) {
        if (!get(ws.getRow(r), colMap.name)) break;
        const v = parseNumber(get(ws.getRow(r), c));
        if (v > 0) numeric++;
      }
      if (numeric > 0) {
        colMap.amount = c;
        break;
      }
    }
  }

  const items: ParsedItem[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = get(row, colMap.name);
    if (!name) break; // hết danh sách hạng mục (gặp dòng tổng / trống)
    const qty = parseNumber(get(row, colMap.quantity));
    items.push({
      name,
      unit: get(row, colMap.unit) || null,
      quantity: qty > 0 ? qty : 1,
      specs: get(row, colMap.specs) || null,
      reason: get(row, colMap.reason) || null,
      notes: get(row, colMap.notes) || null,
      fundName: get(row, colMap.fund),
      amountRaw: parseNumber(get(row, colMap.amount)),
    });
  }
  if (items.length === 0) throw new Error("Không đọc được hạng mục nào trong phiếu");

  // Tìm ngày "Ngày.. tháng.. năm.."
  let proposedAt: string | null = null;
  for (let r = headerRow + items.length; r <= ws.rowCount; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const m = /Ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/.exec(
        cellText(ws.getRow(r).getCell(c).value)
      );
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        if (!isNaN(d.getTime())) proposedAt = d.toISOString();
        break;
      }
    }
    if (proposedAt) break;
  }

  return { proposedAt, items };
}
