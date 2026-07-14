import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { CATEGORY_KINDS, type CategoryKind } from "@/lib/types";

export async function GET(req: Request) {
  const kind = new URL(req.url).searchParams.get("kind");
  const categories = await prisma.category.findMany({
    where: kind ? { kind } : undefined,
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên danh mục là bắt buộc");
  if (!CATEGORY_KINDS.includes(body.kind as CategoryKind))
    return jsonError("Loại danh mục không hợp lệ");

  const dup = await prisma.category.findUnique({
    where: { name_kind: { name, kind: body.kind } },
  });
  if (dup) return jsonError("Danh mục này đã tồn tại", 409);

  const category = await prisma.category.create({
    data: { name, kind: body.kind },
  });
  return NextResponse.json(category, { status: 201 });
}
