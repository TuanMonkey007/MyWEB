// Hằng số cài đặt giao diện — dùng được ở cả client lẫn server
export const FONT_OPTIONS = [
  { id: "inter", label: "Inter (mặc định)" },
  { id: "be-vietnam", label: "Be Vietnam Pro" },
  { id: "roboto", label: "Roboto" },
] as const;
export type FontId = (typeof FONT_OPTIONS)[number]["id"];

export const FONT_SIZE_OPTIONS = [
  { id: "14", label: "Nhỏ (14px)" },
  { id: "15", label: "Vừa (15px)" },
  { id: "16", label: "Lớn (16px)" },
] as const;

export type AppSettings = {
  platformName: string;
  fontFamily: FontId;
  fontSize: string;
  faviconPath: string | null; // tên file trong UPLOAD_DIR/branding
  exportTemplateName: string | null; // tên gốc file mẫu xuất phiếu đã upload
};

export const DEFAULT_SETTINGS: AppSettings = {
  platformName: "Platform cá nhân",
  fontFamily: "inter",
  fontSize: "16",
  faviconPath: null,
  exportTemplateName: null,
};
