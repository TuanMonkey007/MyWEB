import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

function optText(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  const { id } = await params;

  const existing = await prisma.vaultEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return jsonError("Không tìm thấy mục", 404);

  const body = await req.json();
  const title = optText(body.title, 200);
  const cipher = typeof body.cipher === "string" ? body.cipher : "";
  if (!title) return jsonError("Thiếu tiêu đề");
  if (!cipher) return jsonError("Thiếu dữ liệu mã hóa");

  await prisma.vaultEntry.update({
    where: { id },
    data: {
      title,
      username: optText(body.username, 200),
      url: optText(body.url, 1000),
      category: optText(body.category, 100),
      cipher,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  const { id } = await params;

  const existing = await prisma.vaultEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return jsonError("Không tìm thấy mục", 404);

  await prisma.vaultEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
