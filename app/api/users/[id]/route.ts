import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { deleteUserSessions, hashPassword, requireAdmin } from "@/lib/auth";
import { serializePermissions, type PermMap } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

function permsFromBody(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "{}";
  const map: PermMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) map[k as keyof PermMap] = v.map(String);
  }
  return serializePermissions(map);
}

// Đảm bảo hệ thống luôn còn ít nhất 1 admin đang hoạt động
async function wouldRemoveLastAdmin(targetId: string): Promise<boolean> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true },
  });
  return admins.length === 1 && admins[0].id === targetId;
}

export async function PUT(req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if ("error" in admin) return jsonError(admin.error, admin.status);

  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy tài khoản", 404);

  const body = await req.json();
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";
  const active = body.active !== false;

  if (
    existing.role === "ADMIN" &&
    (role !== "ADMIN" || !active) &&
    (await wouldRemoveLastAdmin(id))
  )
    return jsonError("Không thể hạ quyền/khóa admin cuối cùng của hệ thống", 409);

  const data: Record<string, unknown> = {
    displayName:
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : null,
    role,
    permissions: role === "ADMIN" ? "" : permsFromBody(body.permissions),
    active,
  };

  // Đặt lại mật khẩu (tùy chọn)
  if (typeof body.newPassword === "string" && body.newPassword) {
    if (body.newPassword.length < 6) return jsonError("Mật khẩu tối thiểu 6 ký tự");
    data.passwordHash = hashPassword(body.newPassword);
  }

  const user = await prisma.user.update({ where: { id }, data });

  // Khóa tài khoản / đặt lại mật khẩu / đổi quyền → hủy phiên đang mở của user đó
  if (!active || data.passwordHash || role !== existing.role || user.permissions !== existing.permissions) {
    if (user.id !== admin.id) await deleteUserSessions(user.id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const admin = await requireAdmin();
  if ("error" in admin) return jsonError(admin.error, admin.status);

  const { id } = await params;
  if (id === admin.id) return jsonError("Không thể tự xóa tài khoản đang đăng nhập", 409);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy tài khoản", 404);
  if (existing.role === "ADMIN" && (await wouldRemoveLastAdmin(id)))
    return jsonError("Không thể xóa admin cuối cùng của hệ thống", 409);

  await prisma.user.delete({ where: { id } }); // sessions cascade
  return NextResponse.json({ ok: true });
}
