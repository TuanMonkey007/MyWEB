// Danh bạ module của platform — thêm module mới thì khai báo ở đây
// (nav, phân quyền, form cấp quyền đều đọc từ registry này)
export const MODULE_REGISTRY = [
  { id: "finance", label: "Tài chính cá nhân", href: "/finance" },
  { id: "procurement", label: "Đề xuất mua hàng", href: "/procurement" },
  { id: "todos", label: "Công việc", href: "/todos" },
  { id: "drive", label: "Kho file", href: "/drive" },
  { id: "faceid", label: "Lọc dữ liệu FaceID", href: "/faceid" },
  { id: "passwords", label: "Kho mật khẩu", href: "/passwords" },
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
  ["/passwords", "passwords"],
  ["/api/passwords", "passwords"],
];

// Khu vực chỉ ADMIN (cấu hình hệ thống + quản lý tài khoản/phân quyền)
export const ADMIN_PATH_PREFIXES = [
  "/settings",
  "/api/settings",
  "/access",
  "/api/users",
];
