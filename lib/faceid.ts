// Port của xu_ly_cham_cong_chon_file.py sang TypeScript.
// Đọc dữ liệu chấm công (FaceID cổng bảo vệ), lọc trùng, loại ID, sửa giờ
// cho user ngoại lệ, phân sheet theo khung giờ, xuất Excel định dạng.
// Mọi bước gọi callback log để stream ra console trực tiếp trên UI.
import ExcelJS from "exceljs";

export const DEFAULTS = {
  dedupWindowSeconds: 30,
  shiftStart: "08:00",
  shiftEnd: "17:00",
  breakWindows: "12:00-13:00",
  exceptionWindowMinutes: 10,
};

// Tên các sheet phân theo khung giờ — TÊN cố định (giữ nguyên khi đổi tham số),
// còn RANGE lấy động theo tham số ca (xem computeFrames bên dưới).
const SHEET_MORNING = "Ca sáng 8h-12h";
const SHEET_LUNCH = "Nghỉ trưa 12h-13h";
const SHEET_AFTERNOON = "Ca chiều 13h-17h";
const SHEET_OTHER = "Còn lại";

const COL_GIO = "Giờ";
const COL_ID = "ID nhân sự";
const COL_TEN = "Tên";
const COL_HO = "Họ";
const COL_DIEM = "Điểm sự kiện";
const COL_HHMM = "Giờ (HH:MM)";
const COL_HOTEN = "Họ và Tên";

// v = giá trị các cột (chuỗi), gio = "Giờ" đã parse
export type Row = { v: Record<string, string>; gio: Date | null };
export type LogFn = (msg: string) => void;

// ---------- Đọc cell / chuẩn hóa ----------
// NFC hóa để khớp tên cột/giá trị tiếng Việt (file thực tế hay dùng Unicode tổ hợp)
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

export function chuanHoaId(value: string): string {
  const text = (value ?? "").trim();
  if (!text) return "";
  const n = Number(text);
  if (Number.isFinite(n) && Number.isInteger(n)) return String(n);
  return text;
}

// "2026-07-12 23:27:01" | Date ISO -> Date (local)
function parseGio(text: string): Date | null {
  if (!text) return null;
  const s = text.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (m) {
    return new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4]), Number(m[5]), Number(m[6] ?? "0")
    );
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");
function fmtDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtHHMM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function timeFloat(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}
function parseHHMM(text: string): number {
  const [h, m] = text.trim().split(":").map(Number);
  return h + (m || 0) / 60;
}
function parseBreaks(text: string): [number, number][] {
  const out: [number, number][] = [];
  for (const part of text.split(/[,;]+/)) {
    const p = part.trim();
    if (!p) continue;
    const [a, b] = p.split("-");
    if (a && b) out.push([parseHHMM(a), parseHHMM(b)]);
  }
  return out;
}

// RNG xác định theo seed (mulberry32) — chạy lại cho kết quả ổn định
function seededRandInt(seed: string, min: number, max: number): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let t = (h ^= h >>> 16) >>> 0;
  t += 0x6d2b79f5;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  const frac = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return Math.floor(frac * (max - min + 1)) + min;
}

const idOf = (r: Row) => chuanHoaId(r.v[COL_ID] ?? "");
const diemOf = (r: Row) => (r.v[COL_DIEM] ?? "").trim();

// ---------- Đọc workbook ----------
export async function readRows(buffer: Buffer): Promise<{ rows: Row[]; columns: string[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File không có worksheet nào");

  let headerRow = 0;
  let headers: string[] = [];
  for (let r = 1; r <= Math.min(ws.rowCount, 30); r++) {
    const row = ws.getRow(r);
    const vals: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++)
      vals.push(cellText(row.getCell(c).value).trim().replace(/^'/, ""));
    if (vals.includes(COL_GIO)) {
      headerRow = r;
      headers = vals;
      break;
    }
  }
  if (!headerRow) throw new Error('Không tìm thấy dòng tiêu đề có cột "Giờ"');

  const columns = headers.filter((h) => h);
  const rows: Row[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const v: Record<string, string> = {};
    let hasValue = false;
    for (let c = 1; c <= headers.length; c++) {
      const key = headers[c - 1];
      if (!key) continue;
      const text = cellText(row.getCell(c).value).trim();
      if (text) hasValue = true;
      v[key] = text;
    }
    if (!hasValue) continue;
    const gio = parseGio(v[COL_GIO] ?? "");
    if (gio) v[COL_GIO] = fmtDateTime(gio);
    rows.push({ v, gio });
  }
  return { rows, columns };
}

// ---------- Danh sách nhân sự ----------
export type Personnel = { id: string; name: string; count: number };

export function listPersonnel(rows: Row[]): Personnel[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const r of rows) {
    const id = idOf(r);
    if (!id) continue;
    const ho = (r.v[COL_HO] ?? "").trim();
    const ten = (r.v[COL_TEN] ?? "").trim();
    const name = `${ho} ${ten}`.trim();
    const cur = map.get(id);
    if (!cur) map.set(id, { name, count: 1 });
    else {
      cur.count++;
      if (!cur.name && name) cur.name = name;
    }
  }
  return [...map.entries()]
    .map(([id, val]) => ({ id, name: val.name, count: val.count }))
    .sort((a, b) => {
      const na = /^\d+$/.test(a.id), nb = /^\d+$/.test(b.id);
      if (na && nb) return Number(a.id) - Number(b.id);
      if (na) return -1;
      if (nb) return 1;
      return a.id.localeCompare(b.id);
    });
}

// ---------- Loại theo ID ----------
export function excludeByIds(rows: Row[], excludeIds: Set<string>): { rows: Row[]; removed: number } {
  if (excludeIds.size === 0) return { rows, removed: 0 };
  const kept = rows.filter((r) => !excludeIds.has(idOf(r)));
  return { rows: kept, removed: rows.length - kept.length };
}

// ---------- Lọc trùng trong cửa sổ giây ----------
export function dedup(rows: Row[], windowS: number): { rows: Row[]; removed: number } {
  const indexed = rows.map((r, i) => ({ r, i }));
  indexed.sort((a, b) => {
    const ida = idOf(a.r), idb = idOf(b.r);
    if (ida !== idb) return ida < idb ? -1 : 1;
    const da = diemOf(a.r), db = diemOf(b.r);
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.r.gio ? a.r.gio.getTime() : Infinity;
    const tb = b.r.gio ? b.r.gio.getTime() : Infinity;
    if (ta !== tb) return ta - tb;
    return a.i - b.i;
  });

  const dropped = new Set<number>();
  let prevKey = "";
  let prevTime: number | null = null;
  for (const { r, i } of indexed) {
    const key = `${idOf(r)}|${diemOf(r)}`;
    const t = r.gio ? r.gio.getTime() : null;
    if (key === prevKey && prevTime != null && t != null && (t - prevTime) / 1000 <= windowS) {
      dropped.add(i);
    }
    prevKey = key;
    prevTime = t;
  }

  const kept = rows.filter((_, i) => !dropped.has(i));
  for (const r of kept) {
    const ho = (r.v[COL_HO] ?? "").trim();
    const ten = (r.v[COL_TEN] ?? "").trim();
    r.v[COL_HOTEN] = `${ho} ${ten}`.trim();
    r.v[COL_HHMM] = r.gio ? fmtHHMM(r.gio) : "";
  }
  kept.sort((a, b) => (b.gio?.getTime() ?? 0) - (a.gio?.getTime() ?? 0));
  return { rows: kept, removed: rows.length - kept.length };
}

// ---------- Segment ca làm ----------
function buildSegments(shiftStart: number, shiftEnd: number, breaks: [number, number][]): [string, number, number][] {
  const valid = breaks
    .filter(([bs, be]) => shiftStart < bs && bs < be && be < shiftEnd)
    .sort((a, b) => a[0] - b[0]);
  const raw: [number, number][] = [];
  let cur = shiftStart;
  for (const [bs, be] of valid) {
    if (cur < bs) raw.push([cur, bs]);
    if (cur < be) cur = be;
  }
  if (cur < shiftEnd) raw.push([cur, shiftEnd]);
  if (raw.length === 0) raw.push([shiftStart, shiftEnd]);
  return raw.map(([s, e], i) => {
    const label = raw.length === 2 ? (i === 0 ? "ca sang" : "ca chieu") : `ca ${i + 1}`;
    return [label, s, e] as [string, number, number];
  });
}

// ---------- Sửa giờ user ngoại lệ ----------
export type Proposal = { id: string; ten: string; ngay: string; loai: string; gioCu: string; gioMoi: string };

export function adjustExceptions(
  rows: Row[],
  exceptionIds: Set<string>,
  shiftStart: string,
  shiftEnd: string,
  breakWindows: string,
  windowMinutes: number
): { rows: Row[]; proposals: Proposal[]; removed: number } {
  if (exceptionIds.size === 0) return { rows, proposals: [], removed: 0 };
  const segments = buildSegments(parseHHMM(shiftStart), parseHHMM(shiftEnd), parseBreaks(breakWindows));
  const proposals: Proposal[] = [];
  const toDelete = new Set<Row>();

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const id = idOf(r);
    if (!exceptionIds.has(id) || !r.gio) continue;
    const key = `${id}|${r.gio.getFullYear()}-${r.gio.getMonth()}-${r.gio.getDate()}`;
    const arr = groups.get(key);
    if (arr) arr.push(r);
    else groups.set(key, [r]);
  }

  const applyNew = (r: Row, boundary: number, dir: "before" | "after", seedParts: string[], loai: string, tenCa: string) => {
    const oldTs = r.gio!;
    const offset = seededRandInt(seedParts.join("|"), 1, Math.max(1, Math.round(windowMinutes) * 60));
    const bh = Math.floor(boundary);
    const bm = Math.round((boundary - bh) * 60);
    const base = new Date(oldTs.getFullYear(), oldTs.getMonth(), oldTs.getDate(), bh, bm, 0);
    const nt = new Date(base.getTime() + (dir === "before" ? -offset : offset) * 1000);
    proposals.push({
      id: idOf(r),
      ten: r.v[COL_HOTEN] ?? "",
      ngay: `${oldTs.getFullYear()}-${pad(oldTs.getMonth() + 1)}-${pad(oldTs.getDate())}`,
      loai: `${loai} ${tenCa}`,
      gioCu: `${pad(oldTs.getHours())}:${pad(oldTs.getMinutes())}:${pad(oldTs.getSeconds())}`,
      gioMoi: `${pad(nt.getHours())}:${pad(nt.getMinutes())}:${pad(nt.getSeconds())}`,
    });
    r.gio = nt;
    r.v[COL_GIO] = fmtDateTime(nt);
    if (COL_HHMM in r.v) r.v[COL_HHMM] = fmtHHMM(nt);
  };

  // Với user ngoại lệ: mỗi ca chỉ giữ 1 lượt VÀO sớm nhất (dời ra trước giờ ca)
  // + 1 lượt RA muộn nhất (dời ra sau giờ ca). Mọi lượt ra/vào GIỮA GIỜ bị xóa
  // → người ngoại lệ xem như có mặt suốt ca, không lộ ra/vào trong giờ làm.
  for (const group of groups.values()) {
    for (const [tenCa, caStart, caEnd] of segments) {
      const inCa = group.filter((r) => {
        const tf = timeFloat(r.gio!);
        return tf >= caStart && tf < caEnd;
      });
      if (inCa.length === 0) continue;

      const keep = new Set<Row>();

      const vao = inCa.filter((r) => (r.v[COL_DIEM] ?? "").toLowerCase().includes("vào"));
      if (vao.length) {
        const earliest = vao.reduce((a, b) => (a.gio! <= b.gio! ? a : b));
        keep.add(earliest);
        if (timeFloat(earliest.gio!) > caStart) {
          applyNew(earliest, caStart, "before",
            [idOf(earliest), earliest.gio!.toISOString(), "di_muon", tenCa], "Đi muộn", tenCa);
        }
      }
      const ra = inCa.filter((r) => (r.v[COL_DIEM] ?? "").toLowerCase().includes("ra"));
      if (ra.length) {
        const latest = ra.reduce((a, b) => (a.gio! >= b.gio! ? a : b));
        keep.add(latest);
        if (timeFloat(latest.gio!) < caEnd) {
          applyNew(latest, caEnd, "after",
            [idOf(latest), latest.gio!.toISOString(), "ve_som", tenCa], "Về sớm", tenCa);
        }
      }

      // xóa các lượt ra/vào lắt nhắt còn lại trong ca
      for (const r of inCa) if (!keep.has(r)) toDelete.add(r);
    }
  }

  const kept = rows.filter((r) => !toDelete.has(r));
  kept.sort((a, b) => (b.gio?.getTime() ?? 0) - (a.gio?.getTime() ?? 0));
  return { rows: kept, proposals, removed: toDelete.size };
}

// ---------- Phân sheet theo khung giờ ----------
// Ranh giới các khung sheet lấy ĐỘNG theo tham số ca (ca sáng = [vào ca, nghỉ trưa),
// nghỉ trưa = [đầu nghỉ, cuối nghỉ), ca chiều = [hết nghỉ, tan ca)); TÊN sheet giữ cố định.
// Bản ghi ngoài các khung (vd trước giờ vào ca, sau giờ tan ca) rơi vào "Còn lại".
export function computeFrames(
  shiftStart: string,
  shiftEnd: string,
  breakWindows: string
): [string, number, number][] {
  const ss = parseHHMM(shiftStart);
  const se = parseHHMM(shiftEnd);
  const breaks = parseBreaks(breakWindows)
    .filter(([bs, be]) => ss < bs && bs < be && be < se)
    .sort((a, b) => a[0] - b[0]);

  if (breaks.length === 0) {
    // Không có nghỉ trưa hợp lệ: cả ca gộp vào sheet "Ca sáng".
    return [[SHEET_MORNING, ss, se]];
  }
  const [bs, be] = breaks[0];
  return [
    [SHEET_MORNING, ss, bs],
    [SHEET_LUNCH, bs, be],
    [SHEET_AFTERNOON, be, se],
  ];
}

export function splitByFrame(
  rows: Row[],
  frames: [string, number, number][]
): Record<string, Row[]> {
  const out: Record<string, Row[]> = {};
  const assigned = new Set<Row>();
  for (const [name, from, to] of frames) {
    out[name] = rows.filter((r) => {
      if (!r.gio) return false;
      const tf = timeFloat(r.gio);
      const ok = tf >= from && tf < to;
      if (ok) assigned.add(r);
      return ok;
    });
  }
  out[SHEET_OTHER] = rows.filter((r) => !assigned.has(r));
  return out;
}

// ---------- Sắp cột ----------
function orderColumns(cols: string[]): string[] {
  const order: string[] = [];
  if (cols.includes(COL_GIO)) order.push(COL_GIO);
  if (cols.includes(COL_HHMM)) order.push(COL_HHMM);
  const skip = new Set([COL_GIO, COL_HHMM, COL_HO, COL_TEN, COL_HOTEN]);
  for (const c of cols) if (!skip.has(c) && !order.includes(c)) order.push(c);
  for (const c of [COL_HO, COL_TEN, COL_HOTEN]) if (cols.includes(c)) order.push(c);
  for (const c of cols) if (!order.includes(c)) order.push(c);
  return order;
}

const COL_WIDTHS: Record<string, number> = {
  "Giờ": 20, "Giờ (HH:MM)": 10, "Tên khu vực": 22, "Tên thiết bị": 16,
  "Điểm sự kiện": 12, "Mô tả sự kiện": 14, "Cấp độ sự kiện": 14, "ID nhân sự": 11,
  "Tên": 10, "Họ": 14, "Họ và Tên": 22, "Số thẻ": 12, "Tên phòng ban": 18,
  "Tên đầu đọc": 22, "Chế độ xác minh": 16,
};

function shiftColor(name: string): string {
  if (name.includes("Ca sáng")) return "1F6B35";
  if (name.includes("Nghỉ trưa")) return "7B5E00";
  if (name.includes("Ca chiều")) return "7B2500";
  if (name.includes("Còn lại")) return "4A4A4A";
  return "1F4E79";
}

function writeSheet(ws: ExcelJS.Worksheet, rows: Row[], allCols: string[], headerColor: string) {
  const cols = orderColumns(allCols).filter((c) => allCols.includes(c));
  const thin = { style: "thin" as const, color: { argb: "FFBFBFBF" } };
  const hair = { style: "hair" as const, color: { argb: "FFD9D9D9" } };
  const hotenIdx = cols.indexOf(COL_HOTEN);

  cols.forEach((name, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = name;
    cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${headerColor}` } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: thin, bottom: thin, left: thin, right: thin };
    ws.getColumn(i + 1).width = COL_WIDTHS[name] ?? 15;
  });
  ws.getRow(1).height = 28;

  rows.forEach((r, ri) => {
    const excelRow = ri + 2;
    const zebra = excelRow % 2 === 0 ? "D6E4F0" : "FFFFFF";
    cols.forEach((name, ci) => {
      const cell = ws.getCell(excelRow, ci + 1);
      cell.value = r.v[name] ?? "";
      cell.border = { left: thin, right: thin, bottom: hair };
      if (ci === hotenIdx) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };
        cell.font = { name: "Arial", size: 10, bold: true };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${zebra}` } };
        cell.font = { name: "Arial", size: 10 };
      }
      if (ci <= 1) cell.alignment = { horizontal: "center" };
    });
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function writeWorkbook(
  rows: Row[],
  columns: string[],
  timeFrames: [string, number, number][]
): Promise<Buffer> {
  const allCols = [...columns];
  for (const c of [COL_HOTEN, COL_HHMM]) if (!allCols.includes(c)) allCols.push(c);

  const wb = new ExcelJS.Workbook();
  writeSheet(wb.addWorksheet("Tất cả"), rows, allCols, "1F4E79");
  const frames = splitByFrame(rows, timeFrames);
  for (const [name, subset] of Object.entries(frames)) {
    writeSheet(wb.addWorksheet(name), subset, allCols, shiftColor(name));
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- Pipeline đầy đủ (dùng ở API process, có log) ----------
export type ProcessParams = {
  excludeIds: string[];
  exceptionIds: string[];
  dedupWindowSeconds: number;
  shiftStart: string;
  shiftEnd: string;
  breakWindows: string;
  exceptionWindowMinutes: number;
};

export async function runPipeline(
  rows: Row[],
  columns: string[],
  params: ProcessParams,
  log: LogFn
): Promise<Buffer> {
  const n0 = rows.length;
  log(`Đã nạp ${n0.toLocaleString("vi-VN")} dòng dữ liệu gốc.`);

  const excludeSet = new Set(params.excludeIds.map(chuanHoaId).filter(Boolean));
  const exceptionSet = new Set(params.exceptionIds.map(chuanHoaId).filter(Boolean));

  const afterExclude = excludeByIds(rows, excludeSet);
  if (excludeSet.size) log(`Đã loại bỏ ${afterExclude.removed.toLocaleString("vi-VN")} dòng theo ${excludeSet.size} ID.`);

  log(`Đang lọc trùng lặp (cửa sổ ${params.dedupWindowSeconds}s)...`);
  const afterDedup = dedup(afterExclude.rows, params.dedupWindowSeconds);
  log(`→ Xóa ${afterDedup.removed.toLocaleString("vi-VN")} log trùng · còn lại ${afterDedup.rows.length.toLocaleString("vi-VN")} dòng.`);

  let finalRows = afterDedup.rows;
  if (exceptionSet.size) {
    log(`Đang xử lý ${exceptionSet.size} user ngoại lệ (sửa giờ đi muộn/về sớm)...`);
    const adj = adjustExceptions(
      finalRows, exceptionSet,
      params.shiftStart, params.shiftEnd, params.breakWindows, params.exceptionWindowMinutes
    );
    finalRows = adj.rows;
    if (adj.removed > 0)
      log(`→ Đã xóa ${adj.removed.toLocaleString("vi-VN")} lượt ra/vào giữa giờ của user ngoại lệ.`);
    if (adj.proposals.length === 0) log("→ Không có mục đi muộn/về sớm nào cần điều chỉnh.");
    else {
      log(`→ Đã dời ${adj.proposals.length.toLocaleString("vi-VN")} mốc vào/ra ra ngoài ca:`);
      for (const p of adj.proposals.slice(0, 40)) {
        log(`   ID ${p.id}${p.ten ? " | " + p.ten : ""} | ${p.ngay} | ${p.loai}: ${p.gioCu} → ${p.gioMoi}`);
      }
      if (adj.proposals.length > 40) log(`   ... và ${(adj.proposals.length - 40).toLocaleString("vi-VN")} mục khác`);
    }
  }

  const timeFrames = computeFrames(params.shiftStart, params.shiftEnd, params.breakWindows);
  const frames = splitByFrame(finalRows, timeFrames);
  log(`Phân bổ theo khung giờ (theo tham số ca ${params.shiftStart}–${params.shiftEnd}, nghỉ ${params.breakWindows}):`);
  for (const [name, subset] of Object.entries(frames)) {
    log(`   ${name.padEnd(20)}: ${subset.length.toLocaleString("vi-VN")} dòng`);
  }

  log("Đang tạo file Excel kết quả (định dạng + phân sheet)...");
  const buffer = await writeWorkbook(finalRows, columns, timeFrames);

  const totalRemoved = n0 - finalRows.length;
  const pct = n0 ? ((totalRemoved / n0) * 100).toFixed(1) : "0";
  log("────────────────────────────────────");
  log(`Số dòng gốc        : ${n0.toLocaleString("vi-VN")}`);
  log(`Tổng đã xóa        : ${totalRemoved.toLocaleString("vi-VN")} (${pct}%)`);
  log(`Số dòng cuối cùng  : ${finalRows.length.toLocaleString("vi-VN")}`);
  log("✓ Hoàn tất!");
  return buffer;
}
