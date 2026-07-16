import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { serializePermissions, type PermMap } from "@/lib/permissions";

// { finance:["view","create"], ... } → JSON đã chuẩn hóa
function permsFromBody(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "{}";
  const map: PermMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) map[k as keyof PermMap] = v.map(String);
  }
  return serializePermissions(map);
}

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) return jsonError(admin.error, admin.status);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      permissions: true,
      active: true,
      createdAt: true,
      _count: { select: { sessions: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return jsonError(admin.error, admin.status);

  const body = await req.json();
  const username = String(body.username ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(username))
    return jsonError("Tên đăng nhập 3-30 ký tự: a-z, 0-9, chấm, gạch");
  const password = String(body.password ?? "");
  if (password.length < 6) return jsonError("Mật khẩu tối thiểu 6 ký tự");
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";

  const dup = await prisma.user.findUnique({ where: { username } });
  if (dup) return jsonError("Tên đăng nhập đã tồn tại", 409);

  const user = await prisma.user.create({
    data: {
      username,
      displayName:
        typeof body.displayName === "string" && body.displayName.trim()
          ? body.displayName.trim()
          : null,
      passwordHash: hashPassword(password),
      role,
      permissions: role === "ADMIN" ? "" : permsFromBody(body.permissions),
    },
  });
  return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
}
