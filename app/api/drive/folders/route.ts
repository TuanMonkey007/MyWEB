import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên thư mục là bắt buộc");
  if (/[\\/]/.test(name)) return jsonError("Tên thư mục không được chứa dấu / hoặc \\");

  const parentId =
    typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  if (parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: parentId } });
    if (!parent) return jsonError("Thư mục cha không tồn tại");
  }

  const isPublic = body.isPublic === true;
  const folder = await prisma.folder.create({ data: { name, parentId, isPublic } });
  return NextResponse.json(folder, { status: 201 });
}
