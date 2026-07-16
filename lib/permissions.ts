// Phân quyền chi tiết theo từng module + từng hành động.
// Quyền lưu ở User.permissions (JSON: { moduleId: [capId,...] }).
// Tương thích ngược: user cũ còn dùng cột modules (CSV) → tự suy ra full quyền.
import {
  ALL_MODULE_IDS,
  MODULE_PATH_PREFIXES,
  MODULE_REGISTRY,
  type ModuleId,
} from "./modules";

export type Capability = { id: string; label: string };

// Catalog quyền của từng module: 4 quyền cơ bản + tính năng đặc biệt
export const MODULE_CAPS: Record<ModuleId, Capability[]> = {
  finance: [
    { id: "view", label: "Xem" },
    { id: "create", label: "Thêm" },
    { id: "edit", label: "Sửa" },
    { id: "delete", label: "Xóa" },
  ],
  procurement: [
    { id: "view", label: "Xem" },
    { id: "create", label: "Thêm" },
    { id: "edit", label: "Sửa" },
    { id: "delete", label: "Xóa" },
    { id: "budget", label: "Thiết lập quỹ" },
    { id: "export", label: "Xuất phiếu" },
  ],
  todos: [
    { id: "view", label: "Xem" },
    { id: "create", label: "Thêm" },
    { id: "edit", label: "Sửa" },
    { id: "delete", label: "Xóa" },
  ],
  drive: [
    { id: "view", label: "Xem/Tải" },
    { id: "create", label: "Tải lên/Tạo thư mục" },
    { id: "edit", label: "Đổi tên/Di chuyển" },
    { id: "delete", label: "Xóa" },
  ],
  faceid: [
    { id: "view", label: "Xem" },
    { id: "run", label: "Xử lý file" },
  ],
};

export type PermMap = Partial<Record<ModuleId, string[]>>;

const isModule = (id: string): id is ModuleId => (ALL_MODULE_IDS as string[]).includes(id);
const capsOf = (m: ModuleId) => MODULE_CAPS[m].map((c) => c.id);

// Đọc bản đồ quyền: ưu tiên permissions JSON, fallback cột modules (CSV) cũ.
export function parsePermissions(user: { permissions?: string | null; modules?: string | null }): PermMap {
  if (user.permissions) {
    try {
      const raw = JSON.parse(user.permissions) as Record<string, unknown>;
      const map: PermMap = {};
      for (const [k, v] of Object.entries(raw)) {
        if (isModule(k) && Array.isArray(v)) {
          const valid = v.map(String).filter((c) => capsOf(k).includes(c));
          if (valid.length) map[k] = valid;
        }
      }
      return map;
    } catch {
      /* rơi xuống fallback */
    }
  }
  // User cũ: cột modules CSV = full quyền cho các module đó
  if (user.modules) {
    const map: PermMap = {};
    for (const m of user.modules.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (isModule(m)) map[m] = capsOf(m);
    }
    return map;
  }
  return {};
}

// Chuẩn hóa map từ UI trước khi lưu: chỉ giữ module/cap hợp lệ; có cap nào thì
// tự bật "view" (mọi cap đều cần xem module)
export function serializePermissions(map: PermMap): string {
  const clean: PermMap = {};
  for (const m of ALL_MODULE_IDS) {
    const caps = (map[m] ?? []).filter((c) => capsOf(m).includes(c));
    if (caps.length) {
      const set = new Set(caps);
      set.add("view");
      clean[m] = capsOf(m).filter((c) => set.has(c));
    }
  }
  return JSON.stringify(clean);
}

type PermUser = { role: string; permissions?: string | null; modules?: string | null };

export function userCan(user: PermUser, module: ModuleId, cap: string): boolean {
  if (user.role === "ADMIN") return true;
  return (parsePermissions(user)[module] ?? []).includes(cap);
}

// Module user thấy được (có quyền "view") — cho nav
export function userModules(user: PermUser): ModuleId[] {
  if (user.role === "ADMIN") return [...ALL_MODULE_IDS];
  const map = parsePermissions(user);
  return ALL_MODULE_IDS.filter((m) => (map[m] ?? []).includes("view"));
}

// Trang đích sau đăng nhập
export function homeFor(user: PermUser): string {
  if (user.role === "ADMIN") return MODULE_REGISTRY[0].href;
  const mods = userModules(user);
  const mod = MODULE_REGISTRY.find((m) => mods.includes(m.id));
  return mod?.href ?? "/account";
}

// Bản đồ quyền để gửi xuống client (ADMIN = full)
export function clientPermissions(user: PermUser): PermMap {
  if (user.role === "ADMIN") {
    const map: PermMap = {};
    for (const m of ALL_MODULE_IDS) map[m] = capsOf(m);
    return map;
  }
  return parsePermissions(user);
}

// Quyền cần có cho một request (method + path) — dùng ở proxy
export function requiredCapability(
  method: string,
  pathname: string
): { module: ModuleId; cap: string } | null {
  const owned = MODULE_PATH_PREFIXES.find(([p]) => pathname.startsWith(p));
  if (!owned) return null;
  const module = owned[1];
  const m = method.toUpperCase();
  const isRead = m === "GET" || m === "HEAD";

  // Xuất phiếu (GET tạo file)
  if (module === "procurement" && pathname.includes("/export"))
    return { module, cap: "export" };
  // Thiết lập quỹ (ngân sách)
  if (
    module === "procurement" &&
    (pathname.startsWith("/api/budget-years") ||
      pathname.startsWith("/api/budget-groups") ||
      pathname.startsWith("/api/budget-funds"))
  )
    return { module, cap: isRead ? "view" : "budget" };
  // FaceID: mọi thao tác xử lý là "run"
  if (module === "faceid") return { module, cap: isRead ? "view" : "run" };
  // Quản lý danh mục thu/chi = quyền sửa của module tài chính
  if (module === "finance" && pathname.startsWith("/api/categories"))
    return { module, cap: isRead ? "view" : "edit" };

  if (isRead) return { module, cap: "view" };
  if (m === "POST") return { module, cap: "create" };
  if (m === "PUT" || m === "PATCH") return { module, cap: "edit" };
  if (m === "DELETE") return { module, cap: "delete" };
  return { module, cap: "view" };
}
