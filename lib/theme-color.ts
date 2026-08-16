// Sinh bộ token màu nhấn từ MỘT mã màu do người dùng chọn.
//
// Điểm mấu chốt: không tin vào mã màu người dùng nhập. Cùng một sắc (hue), màu
// người ta chọn có thể quá sáng hoặc quá tối để làm nền nút chữ trắng. Nên ở đây
// giữ nguyên sắc + độ tươi, còn ĐỘ SÁNG thì tự dò cho tới khi đạt tương phản
// 4.5:1 — chọn màu nào cũng không vỡ khả năng đọc.
//
// Dùng được ở cả client (form cài đặt xem trước) lẫn server (layout tiêm CSS).

export type ThemePreset = { id: string; label: string; hex: string };

// Sắc gợi ý sẵn — vẫn đi qua đúng đường tính toán như màu tự nhập
export const THEME_PRESETS: ThemePreset[] = [
  { id: "indigo", label: "Chàm", hex: "#4F46E5" },
  { id: "blue", label: "Lam", hex: "#2563EB" },
  { id: "sky", label: "Xanh trời", hex: "#0284C7" },
  { id: "teal", label: "Xanh mòng két", hex: "#0D9488" },
  { id: "emerald", label: "Ngọc lục", hex: "#059669" },
  { id: "violet", label: "Tím", hex: "#7C3AED" },
  { id: "rose", label: "Hồng đào", hex: "#E11D48" },
  { id: "orange", label: "Cam đất", hex: "#EA580C" },
  { id: "slate", label: "Xám đá (trung tính)", hex: "#475569" },
];

export const DEFAULT_THEME_COLOR = "#4F46E5";

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

// ---------- chuyển đổi màu ----------
type Oklch = { l: number; c: number; h: number };

function toLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToOklch(hex: string): Oklch {
  const v = hex.trim().replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(v.slice(i, i + 2), 16)));
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return {
    l: L,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

// Trả về sRGB tuyến tính (chưa gamma) — đủ để tính độ chói
function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function luminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearRgb(color).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Oklch, b: Oklch): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const LIGHT_BG: Oklch = { l: 0.984, c: 0.003, h: 247.86 }; // nền sáng #F8FAFC
const DARK_BG: Oklch = { l: 0.18, c: 0.032, h: 266.62 }; // nền tối #0B1120

const fmt = (o: Oklch) => `oklch(${o.l.toFixed(3)} ${o.c.toFixed(3)} ${o.h.toFixed(2)})`;

/**
 * Dò độ sáng theo một chiều cho tới khi đạt tương phản tối thiểu với `against`.
 * Giữ nguyên sắc và độ tươi để màu vẫn ra đúng "chất" người dùng chọn.
 */
function findLightness(base: Oklch, against: Oklch, min: number, direction: -1 | 1): Oklch {
  const step = 0.01;
  let best = { ...base };
  for (let i = 0; i < 100; i++) {
    if (contrast(best, against) >= min) return best;
    const next = best.l + direction * step;
    if (next <= 0.02 || next >= 0.99) break;
    best = { ...best, l: next };
  }
  return best;
}

export type ThemeTokens = { light: Record<string, string>; dark: Record<string, string> };

export function deriveTheme(hex: string): ThemeTokens {
  const base = hexToOklch(isValidHex(hex) ? hex : DEFAULT_THEME_COLOR);

  // NỀN SÁNG: nút chữ trắng → tối màu nhấn lại cho tới khi trắng đọc được
  const lightPrimary = findLightness({ ...base, l: Math.min(base.l, 0.62) }, WHITE, 4.5, -1);
  const lightRing = { ...lightPrimary, l: Math.min(0.98, lightPrimary.l + 0.07) };
  // nền hover: cùng sắc nhưng gần như trắng
  const lightAccent = { l: 0.962, c: Math.min(base.c * 0.09, 0.03), h: base.h };
  // chữ màu nhấn trên nền sáng phải đọc được (đường link, nhãn đang chọn)
  const lightOnBg = findLightness(lightPrimary, LIGHT_BG, 4.5, -1);

  // NỀN TỐI: nhạt và bớt tươi (theo hướng dẫn màu chế độ tối), chữ tối đè lên
  const darkBase = { ...base, l: 0.7, c: base.c * 0.72 };
  const darkPrimary = findLightness(darkBase, DARK_BG, 4.5, 1);
  const darkAccent = { l: 0.288, c: Math.min(base.c * 0.22, 0.06), h: base.h };
  const darkOnBg = darkPrimary;

  return {
    light: {
      "--primary": fmt(lightPrimary),
      "--primary-foreground": "oklch(1 0 0)",
      "--ring": fmt(lightRing),
      "--accent": fmt(lightAccent),
      "--accent-foreground": fmt(lightOnBg),
      "--sidebar-primary": fmt(lightPrimary),
      "--sidebar-primary-foreground": "oklch(1 0 0)",
      "--sidebar-accent": fmt(lightAccent),
      "--sidebar-accent-foreground": fmt(lightOnBg),
      "--sidebar-ring": fmt(lightRing),
      "--chart-1": fmt(lightRing),
    },
    dark: {
      "--primary": fmt(darkPrimary),
      "--primary-foreground": fmt(DARK_BG),
      "--ring": fmt(darkPrimary),
      "--accent": fmt(darkAccent),
      "--accent-foreground": fmt(darkOnBg),
      "--sidebar-primary": fmt(darkPrimary),
      "--sidebar-primary-foreground": fmt(DARK_BG),
      "--sidebar-accent": fmt(darkAccent),
      "--sidebar-accent-foreground": fmt(darkOnBg),
      "--sidebar-ring": fmt(darkPrimary),
      "--chart-1": fmt(darkPrimary),
    },
  };
}

/**
 * Biến CSS đặt inline trên thẻ <html>.
 *
 * Không dùng thẻ <style> tiêm vào: đặt <style> làm con của <html> là HTML không
 * hợp lệ và gây hydration error, còn để React nâng lên <head> thì thứ tự so với
 * globals.css không chắc chắn. Cách này đưa giá trị cho CẢ hai chế độ dưới tên
 * riêng, rồi globals.css tự chọn bộ nào theo :root / .dark — không phụ thuộc
 * thứ tự nạp, không cần thẻ nào thêm.
 */
export function themeStyleVars(hex: string): Record<string, string> {
  const { light, dark } = deriveTheme(hex);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(light)) out[k.replace("--", "--tl-")] = v;
  for (const [k, v] of Object.entries(dark)) out[k.replace("--", "--td-")] = v;
  return out;
}

/** Danh sách token màu nhấn — globals.css và hàm trên dùng chung một nguồn */
export const ACCENT_TOKENS = [
  "primary",
  "primary-foreground",
  "ring",
  "accent",
  "accent-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-ring",
  "chart-1",
] as const;

/** Số liệu tương phản để form cài đặt hiện ra cho người dùng thấy */
export function themeContrast(hex: string) {
  const { light, dark } = deriveTheme(hex);
  const parse = (s: string): Oklch => {
    const [l, c, h] = s.match(/[\d.]+/g)!.map(Number);
    return { l, c, h };
  };
  return {
    lightOnWhite: contrast(parse(light["--primary"]), WHITE),
    darkOnBg: contrast(parse(dark["--primary"]), DARK_BG),
  };
}
