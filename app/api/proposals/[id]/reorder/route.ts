import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// Lưu thứ tự hạng mục trong đợt: body { ids: [...] } theo thứ tự mới.
// Phải gửi đủ mọi hạng mục của đợt — tránh lưu thứ tự từ màn hình cũ khi người khác vừa thêm/xoá.
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const ids: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
  if (!ids.every((x) => typeof x === "string")) return jsonError("Danh sách không hợp lệ");

  const items = await prisma.proposalItem.findMany({
    where: { proposalId: id },
    select: { id: true },
  });
  if (items.length === 0) return jsonError("Không tìm thấy đợt đề xuất hoặc đợt chưa có hạng mục", 404);

  const current = new Set(items.map((i) => i.id));
  const unique = new Set(ids as string[]);
  if (unique.size !== ids.length || unique.size !== current.size || ![...unique].every((x) => current.has(x)))
    return jsonError("Danh sách hạng mục đã thay đổi — tải lại trang rồi sắp xếp lại", 409);

  await prisma.$transaction(
    (ids as string[]).map((itemId, i) =>
      prisma.proposalItem.update({ where: { id: itemId }, data: { sortOrder: i } })
    )
  );
  return NextResponse.json({ ok: true });
}
