// Cài đặt chung của platform, lưu bảng AppSetting (key/value) — CHỈ dùng server
import path from "path";
import { prisma } from "./prisma";
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  type AppSettings,
  type FontId,
} from "./settings-constants";
import { ALL_MODULE_IDS } from "./modules";

export * from "./settings-constants";

// Hòa hợp thứ tự đã lưu với registry: giữ id hợp lệ theo thứ tự lưu,
// module mới (chưa có trong thứ tự lưu) tự thêm vào cuối
export function reconcileModuleOrder(saved: string[]): string[] {
  const valid = saved.filter((id) => (ALL_MODULE_IDS as string[]).includes(id));
  const missing = ALL_MODULE_IDS.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const font = map.get("fontFamily");
  const savedOrder = (map.get("moduleOrder") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    platformName: map.get("platformName") || DEFAULT_SETTINGS.platformName,
    fontFamily: FONT_OPTIONS.some((f) => f.id === font)
      ? (font as FontId)
      : DEFAULT_SETTINGS.fontFamily,
    fontSize: map.get("fontSize") || DEFAULT_SETTINGS.fontSize,
    faviconPath: map.get("faviconPath") || null,
    exportTemplateName: map.get("exportTemplateName") || null,
    dmsTemplateName: map.get("dmsTemplateName") || null,
    moduleOrder: reconcileModuleOrder(savedOrder),
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

// Mẫu import tuyến của module DMS — lưu một lần, mọi lần chạy sau dùng lại
export const DMS_TEMPLATE_FILE = "dms-route-template.xlsx";

export function dmsTemplatePath(): string {
  return path.join(templatesDir(), DMS_TEMPLATE_FILE);
}
