// Báo cáo theo dõi chi tiêu mua hàng theo năm (Excel, 3 sheet).
// Quy ước theo kiểm soát nội bộ: tiền ĐÃ MUA = tiền ĐỀ XUẤT của hạng mục "Đã mua"
// (không dùng cột tiền thực tế). Hạng mục Huỷ không tính vào số nào.
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { fundTotal, ITEM_STATUS_LABELS, type ItemStatus } from "@/lib/procurement";

const FONT = "Arial";
const TZ = "Asia/Ho_Chi_Minh";

const C = {
  navy: "FF1F3864",
  navyText: "FFFFFFFF",
  title: "FF1F3864",
  muted: "FF6B7280",
  group: "FFDCE6F1",
  batch: "FFE8EEF7",
  zebra: "FFF7F9FC",
  subtotal: "FFF2F2F2",
  total: "FFFFF2CC",
  border: "FFB4C0D3",
  kpiBg: "FFF3F6FB",
  done: ["FFE2F0D9", "FF375623"],
  pending: ["FFFFF2CC", "FF7F6000"],
  cancelled: ["FFEDEDED", "FF7F7F7F"],
} as const;

const MONEY = '#,##0;[Red]-#,##0;"-"';
const PCT = '0.0%;[Red]-0.0%;"-"';

const thin = (color: string = C.border): Partial<ExcelJS.Border> => ({ style: "thin", color: { argb: color } });
const BOX: Partial<ExcelJS.Borders> = { top: thin(), bottom: thin(), left: thin(), right: thin() };

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

// Ngày lưu là 0h giờ VN → lấy ngày/tháng/năm theo giờ VN, không phụ thuộc TZ server
function vnParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}
function vnDateText(d: Date): string {
  const p = vnParts(d);
  return `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}`;
}

async function loadYear(budgetYearId: string) {
  const [year, groups, proposals] = await Promise.all([
    prisma.budgetYear.findUnique({ where: { id: budgetYearId } }),
    prisma.budgetGroup.findMany({
      where: { budgetYearId },
      orderBy: { sortOrder: "asc" },
      include: { funds: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.proposal.findMany({
      where: { budgetYearId },
      orderBy: [{ proposedAt: "asc" }, { number: "asc" }],
      include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    }),
  ]);
  return { year, groups, proposals };
}

type Loaded = Awaited<ReturnType<typeof loadYear>>;

// Tiêu đề 2 dòng đầu mỗi sheet
function sheetTitle(ws: ExcelJS.Worksheet, lastCol: number, title: string, sub: string) {
  ws.mergeCells(1, 1, 1, lastCol);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: FONT, size: 16, bold: true, color: { argb: C.title } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, lastCol);
  const s = ws.getCell(2, 1);
  s.value = sub;
  s.font = { name: FONT, size: 10, italic: true, color: { argb: C.muted } };
  s.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;
}

function headerRow(ws: ExcelJS.Worksheet, rowNo: number, headers: string[]) {
  const row = ws.getRow(rowNo);
  headers.forEach((h, i) => {
    const c = row.getCell(i + 1);
    c.value = h;
    c.font = { name: FONT, size: 10, bold: true, color: { argb: C.navyText } };
    c.fill = fill(C.navy);
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = { top: thin(C.navy), bottom: thin(C.navy), left: thin("FF3A5A8C"), right: thin("FF3A5A8C") };
  });
  row.height = 34;
}

// Định dạng chung cho một dòng dữ liệu
function styleRow(
  row: ExcelJS.Row,
  lastCol: number,
  opts: { bg?: string; bold?: boolean; color?: string; size?: number; height?: number } = {}
) {
  for (let i = 1; i <= lastCol; i++) {
    const c = row.getCell(i);
    c.font = { name: FONT, size: opts.size ?? 10, bold: opts.bold, color: opts.color ? { argb: opts.color } : undefined };
    if (opts.bg) c.fill = fill(opts.bg);
    c.border = BOX;
    c.alignment = { vertical: "middle", wrapText: true, ...(c.alignment ?? {}) };
  }
  if (opts.height) row.height = opts.height;
}

// Excel không tự giãn dòng có chữ xuống hàng → ước lượng số dòng theo độ rộng cột
function fitHeight(row: ExcelJS.Row, cols: [col: number, width: number, size?: number][], min = 20) {
  let lines = 1;
  for (const [col, width, size = 10] of cols) {
    const v = row.getCell(col).value;
    const text = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
    const perLine = Math.max(1, Math.floor(width * 1.3 * (10 / size)) - 2);
    const n = text.split("\n").reduce((s, part) => s + Math.max(1, Math.ceil(part.length / perLine)), 0);
    lines = Math.max(lines, n);
  }
  row.height = Math.max(min, lines * 13 + 6);
}

function setPrint(ws: ExcelJS.Worksheet, headerRowNo: number, orientation: "portrait" | "landscape") {
  ws.pageSetup = {
    paperSize: 9,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printTitlesRow: `${headerRowNo}:${headerRowNo}`,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.25, footer: 0.25 },
  };
  ws.headerFooter = { oddFooter: `&L&8&K6B7280&A&R&8&K6B7280Trang &P / &N` };
}

// ---------------------------------------------------------------------------
// Tính toán chung
// ---------------------------------------------------------------------------
function compute(data: Loaded) {
  const fundInfo = new Map<
    string,
    { name: string; groupCode: string; total: number; monthlyPlan: number[] }
  >();
  for (const g of data.groups)
    for (const f of g.funds)
      fundInfo.set(f.id, {
        name: f.name,
        groupCode: g.code,
        total: fundTotal(f),
        monthlyPlan: [f.m1, f.m2, f.m3, f.m4, f.m5, f.m6, f.m7, f.m8, f.m9, f.m10, f.m11, f.m12],
      });

  const spent = new Map<string, number>();
  const pending = new Map<string, number>();
  const count = new Map<string, number>();
  const spentByMonth = new Map<string, number[]>();
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);

  for (const p of data.proposals) {
    const month = vnParts(p.proposedAt).m - 1;
    for (const it of p.items) {
      if (it.status === "CANCELLED") continue;
      add(count, it.fundId, 1);
      if (it.status === "PURCHASED") {
        add(spent, it.fundId, it.proposedAmount);
        const arr = spentByMonth.get(it.fundId) ?? Array(12).fill(0);
        arr[month] += it.proposedAmount;
        spentByMonth.set(it.fundId, arr);
      } else if (it.status === "PENDING") add(pending, it.fundId, it.proposedAmount);
    }
  }
  return { fundInfo, spent, pending, count, spentByMonth };
}

// ---------------------------------------------------------------------------
// Sheet 1 — Tổng hợp theo quỹ
// ---------------------------------------------------------------------------
function summarySheet(wb: ExcelJS.Workbook, data: Loaded, calc: ReturnType<typeof compute>, sub: string) {
  const ws = wb.addWorksheet("Tổng hợp", { views: [{ state: "frozen", ySplit: 7, showGridLines: false }] });
  const widths = [7, 54, 17, 17, 17, 17, 17, 11, 10];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const LAST = widths.length;
  sheetTitle(ws, LAST, `BÁO CÁO THEO DÕI CHI TIÊU MUA HÀNG IT NĂM ${data.year!.year}`, sub);

  const funds = data.groups.flatMap((g) => g.funds);
  const sum = (m: Map<string, number>) => funds.reduce((s, f) => s + (m.get(f.id) ?? 0), 0);
  const total = funds.reduce((s, f) => s + calc.fundInfo.get(f.id)!.total, 0);
  const spent = sum(calc.spent);
  const pending = sum(calc.pending);

  // Ô chỉ số tổng ngay dưới tiêu đề, thẳng cột với bảng
  const kpis: [number, string, number, string, string?][] = [
    [3, "Tổng ngân sách", total, MONEY],
    [4, "Đã mua", spent, MONEY, C.done[1]],
    [5, "Chờ mua", pending, MONEY, C.pending[1]],
    [6, "Còn lại", total - spent, MONEY, "FF1F6F43"],
    [7, "Còn sau chờ mua", total - spent - pending, MONEY],
    [8, "Đã dùng", total ? spent / total : 0, PCT],
  ];
  ws.mergeCells(4, 1, 5, 2);
  const kl = ws.getCell(4, 1);
  kl.value = "TỔNG QUAN CẢ NĂM";
  kl.font = { name: FONT, size: 11, bold: true, color: { argb: C.title } };
  kl.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  kl.fill = fill(C.kpiBg);
  for (const [col, label, value, fmt, color] of kpis) {
    const l = ws.getCell(4, col);
    l.value = label;
    l.font = { name: FONT, size: 9, color: { argb: C.muted } };
    l.alignment = { horizontal: "center", vertical: "bottom" };
    l.fill = fill(C.kpiBg);
    const v = ws.getCell(5, col);
    v.value = value;
    v.numFmt = fmt;
    v.font = { name: FONT, size: 13, bold: true, color: { argb: color ?? C.title } };
    v.alignment = { horizontal: "center", vertical: "middle" };
    v.fill = fill(C.kpiBg);
  }
  ws.getCell(4, 9).fill = fill(C.kpiBg);
  ws.getCell(5, 9).fill = fill(C.kpiBg);
  ws.getRow(4).height = 18;
  ws.getRow(5).height = 26;
  for (let c = 1; c <= LAST; c++) {
    ws.getCell(4, c).border = { top: thin(C.navy) };
    ws.getCell(5, c).border = { bottom: thin(C.navy) };
  }

  const HEADER = 7;
  headerRow(ws, HEADER, ["STT", "Khoản mục chi phí", "Tổng quỹ năm", "Đã mua", "Chờ mua", "Còn lại", "Còn sau chờ mua", "% đã dùng", "Số hạng mục"]);

  let r = HEADER + 1;
  const firstData = r;
  for (const g of data.groups) {
    const gTotal = g.funds.reduce((s, f) => s + calc.fundInfo.get(f.id)!.total, 0);
    const gSpent = g.funds.reduce((s, f) => s + (calc.spent.get(f.id) ?? 0), 0);
    const gPending = g.funds.reduce((s, f) => s + (calc.pending.get(f.id) ?? 0), 0);
    const gCount = g.funds.reduce((s, f) => s + (calc.count.get(f.id) ?? 0), 0);
    const gr = ws.getRow(r++);
    gr.values = [g.code, g.name.toUpperCase(), gTotal, gSpent, gPending, gTotal - gSpent, gTotal - gSpent - gPending, gTotal ? gSpent / gTotal : 0, gCount || null];
    styleRow(gr, LAST, { bg: C.group, bold: true, color: C.title });
    fitHeight(gr, [[2, 50]], 22);

    g.funds.forEach((f, i) => {
      const info = calc.fundInfo.get(f.id)!;
      const fs = calc.spent.get(f.id) ?? 0;
      const fp = calc.pending.get(f.id) ?? 0;
      const row = ws.getRow(r++);
      row.values = [`${g.code}.${String(i + 1).padStart(2, "0")}`, f.name, info.total, fs, fp, info.total - fs, info.total - fs - fp, info.total ? fs / info.total : fs ? 1 : 0, calc.count.get(f.id) || null];
      styleRow(row, LAST, { bg: i % 2 ? C.zebra : undefined });
      row.getCell(2).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      fitHeight(row, [[2, 52]]);
    });
  }
  const lastData = r - 1;

  const tr = ws.getRow(r);
  tr.values = ["", "TỔNG CỘNG", total, spent, pending, total - spent, total - spent - pending, total ? spent / total : 0, sum(calc.count) || null];
  styleRow(tr, LAST, { bg: C.total, bold: true, size: 11, height: 24 });
  tr.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
  for (let c = 1; c <= LAST; c++)
    tr.getCell(c).border = { ...BOX, top: { style: "medium", color: { argb: C.navy } }, bottom: { style: "double", color: { argb: C.navy } } };

  for (let i = firstData; i <= r; i++) {
    const row = ws.getRow(i);
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    for (const c of [3, 4, 5, 6, 7]) row.getCell(c).numFmt = MONEY;
    row.getCell(8).numFmt = PCT;
    row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
  }
  ws.getColumn(4).eachCell((c, n) => n > HEADER && n <= r && (c.font = { ...c.font, color: { argb: C.done[1] } }));
  ws.getColumn(5).eachCell((c, n) => n > HEADER && n <= r && (c.font = { ...c.font, color: { argb: C.pending[1] } }));

  // Thanh tiến độ trong cột % đã dùng
  ws.addConditionalFormatting({
    ref: `H${firstData}:H${lastData}`,
    rules: [
      {
        type: "dataBar",
        priority: 1,
        minLength: 0,
        maxLength: 100,
        gradient: false,
        cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }],
        color: { argb: "FF8EB4E3" },
      } as unknown as ExcelJS.ConditionalFormattingRule,
    ],
  });

  setPrint(ws, HEADER, "landscape");
}

// ---------------------------------------------------------------------------
// Sheet 2 — Chi tiết từng đợt đề xuất (không có cột tiền thực tế)
// ---------------------------------------------------------------------------
function detailSheet(wb: ExcelJS.Workbook, data: Loaded, calc: ReturnType<typeof compute>, sub: string) {
  const ws = wb.addWorksheet("Chi tiết đề xuất", { views: [{ state: "frozen", ySplit: 4, showGridLines: false }] });
  const widths = [6, 44, 8, 7, 16, 12, 42, 16, 17, 30];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const LAST = widths.length;
  sheetTitle(ws, LAST, `CHI TIẾT ĐỀ XUẤT MUA HÀNG NĂM ${data.year!.year}`, sub);

  const HEADER = 4;
  headerRow(ws, HEADER, ["STT", "Nội dung mua hàng", "ĐVT", "SL", "Tiền đề xuất", "Trạng thái", "Quỹ mua", "Tổng quỹ năm", "Còn lại trong quỹ", "Ghi chú"]);

  // Còn lại lũy kế theo thứ tự thời gian — chỉ trừ hạng mục Đã mua
  const running = new Map<string, number>();
  for (const [id, info] of calc.fundInfo) running.set(id, info.total);

  let r = HEADER + 1;
  let yearPurchased = 0;
  let yearPending = 0;
  let yearCancelled = 0;

  for (const p of data.proposals) {
    // Dòng tiêu đề đợt
    ws.mergeCells(r, 1, r, LAST);
    const head = ws.getCell(r, 1);
    const title = p.title?.trim() ? ` — ${p.title.trim()}` : "";
    head.value = {
      richText: [
        { text: `ĐỢT ${p.number}`, font: { name: FONT, size: 11, bold: true, color: { argb: C.title } } },
        { text: `   ·   Ngày đề xuất ${vnDateText(p.proposedAt)}${title}`, font: { name: FONT, size: 10, color: { argb: C.title } } },
      ],
    };
    head.fill = fill(C.batch);
    head.alignment = { vertical: "middle", indent: 1 };
    head.border = { top: { style: "medium", color: { argb: C.navy } }, bottom: thin(), left: thin(), right: thin() };
    ws.getRow(r).height = 22;
    r++;

    let bPurchased = 0;
    let bPending = 0;
    p.items.forEach((it, i) => {
      const info = calc.fundInfo.get(it.fundId);
      const status = it.status as ItemStatus;
      if (status === "PURCHASED") {
        running.set(it.fundId, (running.get(it.fundId) ?? 0) - it.proposedAmount);
        bPurchased += it.proposedAmount;
      } else if (status === "PENDING") bPending += it.proposedAmount;
      else yearCancelled += it.proposedAmount;

      const row = ws.getRow(r++);
      row.values = [
        i + 1,
        it.name,
        it.unit ?? "",
        it.quantity,
        it.proposedAmount,
        ITEM_STATUS_LABELS[status] ?? it.status,
        info?.name ?? "",
        info?.total ?? null,
        running.get(it.fundId) ?? null,
        it.notes ?? "",
      ];
      styleRow(row, LAST, { bg: i % 2 ? C.zebra : undefined });
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).numFmt = "#,##0.##";
      for (const c of [5, 8, 9]) row.getCell(c).numFmt = MONEY;
      row.getCell(7).font = { name: FONT, size: 9, color: { argb: C.muted } };
      row.getCell(8).font = { name: FONT, size: 10, color: { argb: C.muted } };
      row.getCell(9).font = { name: FONT, size: 10, bold: true, color: { argb: C.title } };
      for (const c of [2, 7, 10]) row.getCell(c).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      fitHeight(row, [[2, 42], [7, 40, 9], [10, 28]]);

      const [bg, fg] = status === "PURCHASED" ? C.done : status === "PENDING" ? C.pending : C.cancelled;
      const st = row.getCell(6);
      st.fill = fill(bg);
      st.font = { name: FONT, size: 9, bold: true, color: { argb: fg } };
      st.alignment = { horizontal: "center", vertical: "middle" };

      if (status === "CANCELLED") {
        for (const c of [2, 5]) row.getCell(c).font = { name: FONT, size: 10, strike: true, color: { argb: C.cancelled[1] } };
      }
    });

    yearPurchased += bPurchased;
    yearPending += bPending;

    const sr = ws.getRow(r++);
    sr.getCell(2).value = `Cộng đợt ${p.number}`;
    sr.getCell(5).value = bPurchased + bPending;
    sr.getCell(6).value = bPending ? `Chờ: ${bPending.toLocaleString("vi-VN")}` : "";
    styleRow(sr, LAST, { bg: C.subtotal, bold: true, height: 20 });
    sr.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    sr.getCell(5).numFmt = MONEY;
    sr.getCell(6).font = { name: FONT, size: 8, color: { argb: C.pending[1] } };
    sr.getCell(6).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    r++; // dòng trống giữa các đợt
  }

  // Tổng cả năm
  const totals: [string, number, string][] = [
    ["Tổng đã mua", yearPurchased, C.done[1]],
    ["Tổng chờ mua", yearPending, C.pending[1]],
    ["Tổng đề xuất (không tính huỷ)", yearPurchased + yearPending, C.title],
    ["Đã huỷ (không tính)", yearCancelled, C.cancelled[1]],
  ];
  for (const [label, value, color] of totals) {
    const row = ws.getRow(r++);
    ws.mergeCells(r - 1, 1, r - 1, 4);
    row.getCell(1).value = label;
    row.getCell(5).value = value;
    styleRow(row, 5, { bg: C.total, bold: true, color, height: 20 });
    row.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(5).numFmt = MONEY;
  }

  ws.autoFilter = { from: { row: HEADER, column: 1 }, to: { row: HEADER, column: LAST } };
  setPrint(ws, HEADER, "landscape");
}

// ---------------------------------------------------------------------------
// Sheet 3 — Đã mua theo tháng (theo ngày đề xuất) so với kế hoạch
// ---------------------------------------------------------------------------
function monthlySheet(wb: ExcelJS.Workbook, data: Loaded, calc: ReturnType<typeof compute>, sub: string) {
  const ws = wb.addWorksheet("Theo tháng", { views: [{ state: "frozen", xSplit: 2, ySplit: 4, showGridLines: false }] });
  const LAST = 2 + 12 + 2;
  ws.getColumn(1).width = 7;
  ws.getColumn(2).width = 50;
  for (let m = 0; m < 12; m++) ws.getColumn(3 + m).width = 14;
  ws.getColumn(15).width = 16;
  ws.getColumn(16).width = 16;
  sheetTitle(ws, LAST, `CHI TIÊU ĐÃ MUA THEO THÁNG NĂM ${data.year!.year}`, `${sub} · Tháng tính theo ngày đề xuất của đợt`);

  const HEADER = 4;
  headerRow(ws, HEADER, ["STT", "Khoản mục chi phí", ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`), "Đã mua cả năm", "Ngân sách năm"]);

  const monthTotals = Array(12).fill(0);
  const planTotals = Array(12).fill(0);
  let r = HEADER + 1;
  for (const g of data.groups) {
    const gMonths = Array(12).fill(0);
    let gPlan = 0;
    for (const f of g.funds) {
      const arr = calc.spentByMonth.get(f.id) ?? [];
      arr.forEach((v, i) => (gMonths[i] += v));
      gPlan += calc.fundInfo.get(f.id)!.total;
    }
    const gr = ws.getRow(r++);
    gr.values = [g.code, g.name.toUpperCase(), ...gMonths, gMonths.reduce((a, b) => a + b, 0), gPlan];
    styleRow(gr, LAST, { bg: C.group, bold: true, color: C.title });
    fitHeight(gr, [[2, 46]], 22);

    g.funds.forEach((f, i) => {
      const info = calc.fundInfo.get(f.id)!;
      const arr = calc.spentByMonth.get(f.id) ?? Array(12).fill(0);
      arr.forEach((v, k) => (monthTotals[k] += v));
      info.monthlyPlan.forEach((v, k) => (planTotals[k] += v));
      const row = ws.getRow(r++);
      row.values = [`${g.code}.${String(i + 1).padStart(2, "0")}`, f.name, ...arr, arr.reduce((a, b) => a + b, 0), info.total];
      styleRow(row, LAST, { bg: i % 2 ? C.zebra : undefined });
      row.getCell(2).alignment = { vertical: "middle", wrapText: true, indent: 1 };
      fitHeight(row, [[2, 48]]);
    });
  }
  const firstTotal = r;
  const yearSpent = monthTotals.reduce((a, b) => a + b, 0);
  const yearPlan = planTotals.reduce((a, b) => a + b, 0);
  const rows: [string, number[], number, number | null, string][] = [
    ["TỔNG ĐÃ MUA", monthTotals, yearSpent, yearPlan, C.done[1]],
    ["NGÂN SÁCH KẾ HOẠCH THÁNG", planTotals, yearPlan, null, C.title],
    ["CHÊNH LỆCH (KẾ HOẠCH − ĐÃ MUA)", planTotals.map((v, i) => v - monthTotals[i]), yearPlan - yearSpent, null, C.title],
  ];
  for (const [label, months, sumV, plan, color] of rows) {
    const row = ws.getRow(r++);
    row.values = ["", label, ...months, sumV, plan];
    styleRow(row, LAST, { bg: C.total, bold: true, color, height: 22 });
    row.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
  }
  for (let c = 1; c <= LAST; c++)
    ws.getCell(firstTotal, c).border = { ...BOX, top: { style: "medium", color: { argb: C.navy } } };

  for (let i = HEADER + 1; i < r; i++) {
    const row = ws.getRow(i);
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    for (let c = 3; c <= LAST; c++) row.getCell(c).numFmt = MONEY;
    row.getCell(15).font = { ...row.getCell(15).font, bold: true };
  }
  setPrint(ws, HEADER, "landscape");
}

export async function buildYearReportXlsx(budgetYearId: string): Promise<{ buffer: Buffer; year: number } | null> {
  const data = await loadYear(budgetYearId);
  if (!data.year) return null;
  const calc = compute(data);

  const wb = new ExcelJS.Workbook();
  wb.creator = "MyWEB";
  wb.created = new Date();
  const sub = `Bộ phận Công nghệ thông tin  ·  Xuất ngày ${vnDateText(new Date())}  ·  Tiền đã mua tính theo giá đề xuất`;

  summarySheet(wb, data, calc, sub);
  detailSheet(wb, data, calc, sub);
  monthlySheet(wb, data, calc, sub);

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return { buffer, year: data.year.year };
}
