// Hằng số khổ ảnh — KHÔNG import sharp, để component client dùng được.
// (lib/photo-id.ts có sharp nên chỉ chạy phía máy chủ.)

/** Khổ ảnh thẻ thông dụng ở Việt Nam, tính theo 300 DPI cho đủ nét khi in */
export const KHO_ANH = {
  "3x4": { label: "3×4 cm", w: 354, h: 472 },
  "4x6": { label: "4×6 cm", w: 472, h: 709 },
  "2x3": { label: "2×3 cm", w: 236, h: 354 },
} as const;

export type KhoAnh = keyof typeof KHO_ANH;

export function isKhoAnh(v: string): v is KhoAnh {
  return v in KHO_ANH;
}

/** Chỉnh tay: dời khung cắt theo % phần dư có thể dời (-100…100), phóng to 0…60 */
export type ChinhTay = { lechNgang: number; lechDoc: number; phongTo: number };
export const CHINH_MAC_DINH: ChinhTay = { lechNgang: 0, lechDoc: 0, phongTo: 0 };
