// Cài đặt chung của platform, lưu bảng AppSetting (key/value) — CHỈ dùng server
import path from "path";
import { prisma } from "./prisma";
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  type AppSettings,
  type FontId,
} from "./settings-constants";

export * from "./settings-constants";

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const font = map.get("fontFamily");
  return {
    platformName: map.get("platformName") || DEFAULT_SETTINGS.platformName,
    fontFamily: FONT_OPTIONS.some((f) => f.id === font)
      ? (font as FontId)
      : DEFAULT_SETTINGS.fontFamily,
    fontSize: map.get("fontSize") || DEFAULT_SETTINGS.fontSize,
    faviconPath: map.get("faviconPath") || null,
    exportTemplateName: map.get("exportTemplateName") || null,
  };
}

export async function setSetting(key: string, value: string | null) {
  if (value === null) {
    await prisma.appSetting.deleteMany({ where: { key } });
  } else {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

// Thư mục file thương hiệu (favicon) và mẫu xuất phiếu
export function brandingDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "branding");
}

export function templatesDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "templates");
}

export const EXPORT_TEMPLATE_FILE = "proposal-template.xlsx";
