// Danh bạ module của platform — thêm module mới thì khai báo ở đây
// (nav, phân quyền, form cấp quyền đều đọc từ registry này)
export const MODULE_REGISTRY = [
  { id: "finance", label: "Tài chính cá nhân", href: "/finance" },
  { id: "procurement", label: "Đề xuất mua hàng", href: "/procurement" },
  { id: "todos", label: "Công việc", href: "/todos" },
  { id: "drive", label: "Kho file", href: "/drive" },
  { id: "faceid", label: "Lọc dữ liệu FaceID", href: "/faceid" },
] as const;

export type ModuleId = (typeof MODULE_REGISTRY)[number]["id"];

export const ALL_MODULE_IDS = MODULE_REGISTRY.map((m) => m.id) as ModuleId[];

// Path prefix → module sở hữu (dùng trong proxy để chặn truy cập)
export const MODULE_PATH_PREFIXES: [string, ModuleId][] = [
  ["/finance", "finance"],
  ["/api/wallets", "finance"],
  ["/api/expenses", "finance"],
  ["/api/incomes", "finance"],
  ["/api/transfers", "finance"],
  ["/api/categories", "finance"],
  ["/api/upload", "finance"],
  ["/api/images", "finance"],
  ["/procurement", "procurement"],
  ["/api/budget-years", "procurement"],
  ["/api/budget-groups", "procurement"],
  ["/api/budget-funds", "procurement"],
  ["/api/proposals", "procurement"],
  ["/api/proposal-items", "procurement"],
  ["/api/attachments", "procurement"],
  ["/todos", "todos"],
  ["/api/todos", "todos"],
  ["/drive", "drive"],
  ["/api/drive", "drive"],
  ["/faceid", "faceid"],
  ["/api/faceid", "faceid"],
];

// Khu vực chỉ ADMIN (cấu hình hệ thống + quản lý tài khoản)
export const ADMIN_PATH_PREFIXES = ["/settings", "/api/settings", "/api/users"];

// Quyền module của một user: ADMIN thấy tất cả; USER theo CSV đã cấp
export function userModuleIds(user: { role: string; modules: string }): ModuleId[] {
  if (user.role === "ADMIN") return [...ALL_MODULE_IDS];
  return user.modules
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ModuleId => (ALL_MODULE_IDS as string[]).includes(s));
}

// Trang đích sau đăng nhập: module đầu tiên được cấp
export function homeFor(user: { role: string; modules: string }): string {
  const ids = userModuleIds(user);
  const mod = MODULE_REGISTRY.find((m) => ids.includes(m.id));
  return mod?.href ?? "/account";
}
