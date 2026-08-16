import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCan } from "@/lib/permissions";
import { isVisibility, listArticles, uniqueSlug } from "@/lib/articles";

// Danh sách bài trong khu quản trị (proxy đã chặn quyền articles:view)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  return NextResponse.json(await listArticles(user));
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "");
  const summary = String(body.summary ?? "").trim();
  const visibility = String(body.visibility ?? "DRAFT");
  const categoryId = body.categoryId ? String(body.categoryId) : null;
  const coverImage = body.coverImage ? String(body.coverImage) : null;

  if (!title) return jsonError("Nhập tiêu đề bài viết");
  if (title.length > 200) return jsonError("Tiêu đề tối đa 200 ký tự");
  if (!content.trim()) return jsonError("Nội dung không được để trống");
  if (!isVisibility(visibility)) return jsonError("Phạm vi hiển thị không hợp lệ");
  // Đăng công khai là quyền riêng — người chỉ có quyền viết thì lưu nháp/nội bộ
  if (visibility === "PUBLIC" && !userCan(user, "articles", "publish"))
    return jsonError("Bạn không có quyền đăng bài công khai", 403);

  if (categoryId) {
    const exists = await prisma.articleCategory.findUnique({ where: { id: categoryId } });
    if (!exists) return jsonError("Chuyên mục không tồn tại");
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug: await uniqueSlug(title),
      summary: summary || null,
      content,
      visibility,
      categoryId,
      coverImage,
      authorId: user.id,
      publishedAt: visibility === "DRAFT" ? null : new Date(),
    },
    select: { id: true, slug: true },
  });
  return NextResponse.json(article, { status: 201 });
}
