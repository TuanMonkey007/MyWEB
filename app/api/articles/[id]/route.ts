import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCan } from "@/lib/permissions";
import { canEdit, isVisibility, uniqueSlug } from "@/lib/articles";
import { deleteArticleImage } from "@/lib/article-image";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return jsonError("Không tìm thấy bài viết", 404);
  // Bài nháp của người khác thì không cho mở trong trình soạn
  if (article.visibility === "DRAFT" && !canEdit(user, article))
    return jsonError("Không tìm thấy bài viết", 404);
  return NextResponse.json(article);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return jsonError("Không tìm thấy bài viết", 404);
  // Quyền edit của module là điều kiện cần; ngoài ra chỉ sửa được bài của mình
  // (trừ admin) — tránh người này sửa bài người kia.
  if (!canEdit(user, article))
    return jsonError("Bạn chỉ sửa được bài do mình viết", 403);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("Dữ liệu không hợp lệ");

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return jsonError("Nhập tiêu đề bài viết");
    if (title.length > 200) return jsonError("Tiêu đề tối đa 200 ký tự");
    data.title = title;
    // Đổi tiêu đề thì sinh lại slug; đường dẫn cũ sẽ không còn dùng được
    if (title !== article.title) data.slug = await uniqueSlug(title, article.id);
  }
  if (body.content !== undefined) {
    const content = String(body.content);
    if (!content.trim()) return jsonError("Nội dung không được để trống");
    data.content = content;
  }
  if (body.summary !== undefined) {
    const s = String(body.summary).trim();
    data.summary = s || null;
  }
  if (body.categoryId !== undefined) {
    const categoryId = body.categoryId ? String(body.categoryId) : null;
    if (categoryId) {
      const exists = await prisma.articleCategory.findUnique({ where: { id: categoryId } });
      if (!exists) return jsonError("Chuyên mục không tồn tại");
    }
    data.categoryId = categoryId;
  }
  if (body.pinned !== undefined) data.pinned = body.pinned === true;
  if (body.coverImage !== undefined) {
    const c = body.coverImage ? String(body.coverImage) : null;
    // Ảnh cũ bị thay thì xóa khỏi đĩa, khỏi tích rác
    if (article.coverImage && article.coverImage !== c)
      await deleteArticleImage(article.coverImage);
    data.coverImage = c;
  }
  if (body.visibility !== undefined) {
    const visibility = String(body.visibility);
    if (!isVisibility(visibility)) return jsonError("Phạm vi hiển thị không hợp lệ");
    if (visibility === "PUBLIC" && !userCan(user, "articles", "publish"))
      return jsonError("Bạn không có quyền đăng bài công khai", 403);
    data.visibility = visibility;
    // Lần đầu rời khỏi nháp thì ghi mốc đăng
    if (visibility !== "DRAFT" && !article.publishedAt) data.publishedAt = new Date();
    if (visibility === "DRAFT") data.publishedAt = null;
  }

  if (Object.keys(data).length === 0) return jsonError("Không có gì để lưu");

  const updated = await prisma.article.update({
    where: { id },
    data,
    select: { id: true, slug: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return jsonError("Không tìm thấy bài viết", 404);
  if (!canEdit(user, article))
    return jsonError("Bạn chỉ xóa được bài do mình viết", 403);

  await deleteArticleImage(article.coverImage);
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
