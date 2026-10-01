import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { releaseContent } from "@/lib/drive";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.folder.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy thư mục", 404);

  const body = await req.json();

  // Đổi tên
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return jsonError("Tên thư mục là bắt buộc");
    if (/[\\/]/.test(name)) return jsonError("Tên không được chứa / hoặc \\");
    await prisma.folder.update({ where: { id }, data: { name } });
  }

  // Đổi trạng thái Public
  if (typeof body.isPublic === "boolean") {
    await prisma.folder.update({ where: { id }, data: { isPublic: body.isPublic } });
  }

  // Di chuyển sang thư mục cha khác (chặn di chuyển vào chính con của nó)
  if (body.parentId !== undefined) {
    const parentId = body.parentId || null;
    if (parentId === id) return jsonError("Không thể di chuyển thư mục vào chính nó");
    if (parentId) {
      let cursor = await prisma.folder.findUnique({ where: { id: parentId } });
      while (cursor) {
        if (cursor.id === id)
          return jsonError("Không thể di chuyển vào thư mục con của chính nó");
        cursor = cursor.parentId
          ? await prisma.folder.findUnique({ where: { id: cursor.parentId } })
          : null;
      }
    }
    await prisma.folder.update({ where: { id }, data: { parentId } });
  }

  return NextResponse.json({ ok: true });
}

// Xóa thư mục (đệ quy): gom sha256 mọi file bên trong rồi dọn file vật lý mồ côi
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.folder.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy thư mục", 404);

  // thu thập id thư mục con đệ quy
  const folderIds: string[] = [id];
  for (let i = 0; i < folderIds.length; i++) {
    const children = await prisma.folder.findMany({
      where: { parentId: folderIds[i] },
      select: { id: true },
    });
    folderIds.push(...children.map((c) => c.id));
  }
  const files = await prisma.storedFile.findMany({
    where: { folderId: { in: folderIds } },
    select: { sha256: true },
  });

  await prisma.folder.delete({ where: { id } }); // cascade xóa con + StoredFile
  for (const sha of new Set(files.map((f) => f.sha256))) await releaseContent(sha);
  return NextResponse.json({ ok: true });
}
