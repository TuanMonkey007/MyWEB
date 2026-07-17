import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// Danh sách entry của user hiện tại (metadata + cipher — cipher chỉ giải mã ở client)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const entries = await prisma.vaultEntry.findMany({
    where: { userId: user.id },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      title: e.title,
      username: e.username,
      url: e.url,
      category: e.category,
      cipher: e.cipher,
      updatedAt: e.updatedAt.toISOString(),
    }))
  );
}

function optText(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Thêm entry (client đã mã hóa cipher). Có thể nhận mảng để import hàng loạt.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];
  const data = [];
  for (const it of items) {
    const title = optText(it.title, 200);
    const cipher = typeof it.cipher === "string" ? it.cipher : "";
    if (!title) return jsonError("Thiếu tiêu đề");
    if (!cipher) return jsonError("Thiếu dữ liệu mã hóa");
    data.push({
      userId: user.id,
      title,
      username: optText(it.username, 200),
      url: optText(it.url, 1000),
      category: optText(it.category, 100),
      cipher,
    });
  }
  if (data.length === 0) return jsonError("Không có mục nào");

  if (data.length === 1) {
    const e = await prisma.vaultEntry.create({ data: data[0] });
    return NextResponse.json({ id: e.id }, { status: 201 });
  }
  await prisma.vaultEntry.createMany({ data });
  return NextResponse.json({ count: data.length }, { status: 201 });
}
