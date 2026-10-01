import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lấy danh sách bài viết nổi bật hiển thị ở Trang chủ (Public)
export async function GET() {
  try {
    // 1. Ưu tiên các bài viết công khai được ghim (pinned = true)
    let articles = await prisma.article.findMany({
      where: {
        visibility: "PUBLIC",
        pinned: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        coverImage: true,
        pinned: true,
        views: true,
        createdAt: true,
        publishedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { username: true, displayName: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    // 2. Dự phòng: Nếu chưa có bài nào được đánh dấu nổi bật, lấy các bài công khai mới nhất
    if (articles.length === 0) {
      articles = await prisma.article.findMany({
        where: { visibility: "PUBLIC" },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          coverImage: true,
          pinned: true,
          views: true,
          createdAt: true,
          publishedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { username: true, displayName: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
      });
    }

    return NextResponse.json(articles);
  } catch (err) {
    console.error("Lỗi lấy bài viết nổi bật:", err);
    return NextResponse.json([]);
  }
}
