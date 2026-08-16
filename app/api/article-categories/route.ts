import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { listCategories, slugify } from "@/lib/articles";

// Chuyên mục của khu bài hướng dẫn. Proxy ánh xạ mọi thao tác ghi ở đây sang
// quyền articles:categories (tách khỏi quyền viết bài).

export async function GET() {
  return NextResponse.json(await listCategories());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const name = String(body.name ?? "").trim();
  if (!name) return jsonError("Nhập tên chuyên mục");
  if (name.length > 80) return jsonError("Tên chuyên mục tối đa 80 ký tự");

  const slug = slugify(name);
  const trung = await prisma.articleCategory.findUnique({ where: { slug } });
  if (trung) return jsonError("Đã có chuyên mục trùng tên");

  const category = await prisma.articleCategory.create({
    data: {
      name,
      slug,
      description: String(body.description ?? "").trim() || null,
      order: Number.isFinite(Number(body.order)) ? Math.trunc(Number(body.order)) : 0,
    },
  });
  return NextResponse.json(category, { status: 201 });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return jsonError("Thiếu id chuyên mục");
  // Bài viết trong chuyên mục KHÔNG bị xóa theo — quan hệ đặt SetNull, bài rơi
  // về nhóm "Chưa phân loại". Xóa nhầm chuyên mục không làm mất nội dung.
  await prisma.articleCategory.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
