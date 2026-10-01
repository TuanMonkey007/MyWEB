// Bài hướng dẫn — nghiệp vụ dùng chung cho cả khu quản trị lẫn trang công khai.
// CHỈ dùng phía server.
import { prisma } from "./prisma";

/** DRAFT: chỉ tác giả + admin | INTERNAL: cần đăng nhập | PUBLIC: ai cũng đọc */
export const VISIBILITIES = ["DRAFT", "INTERNAL", "PUBLIC"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  DRAFT: "Nháp",
  INTERNAL: "Nội bộ",
  PUBLIC: "Công khai",
};

export const VISIBILITY_HINTS: Record<Visibility, string> = {
  DRAFT: "Chỉ bạn và quản trị viên thấy",
  INTERNAL: "Người đã đăng nhập đọc được",
  PUBLIC: "Ai vào website cũng đọc được",
};

export function isVisibility(v: string): v is Visibility {
  return (VISIBILITIES as readonly string[]).includes(v);
}

// ---------- Slug ----------
const DAU_TIENG_VIET: [RegExp, string][] = [
  [/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a"],
  [/[èéẹẻẽêềếệểễ]/g, "e"],
  [/[ìíịỉĩ]/g, "i"],
  [/[òóọỏõôồốộổỗơờớợởỡ]/g, "o"],
  [/[ùúụủũưừứựửữ]/g, "u"],
  [/[ỳýỵỷỹ]/g, "y"],
  [/đ/g, "d"],
];

/** "Hướng dẫn tạo VPN Site-to-Site" → "huong-dan-tao-vpn-site-to-site" */
export function slugify(text: string): string {
  let s = text.normalize("NFC").toLowerCase();
  for (const [re, ch] of DAU_TIENG_VIET) s = s.replace(re, ch);
  return (
    s
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "") || "bai-viet"
  );
}

/** Thêm hậu tố -2, -3... nếu slug đã có bài khác dùng */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 200; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const found = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found || found.id === exceptId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

// ---------- Quyền xem ----------
type Viewer = { id: string; role: string } | null;

/**
 * Điều kiện Prisma lọc đúng những bài người xem được phép thấy.
 * Đặt ở một chỗ để trang công khai và API không thể lệch nhau — lệch là lộ bài
 * nội bộ ra ngoài.
 */
export function visibleWhere(viewer: Viewer) {
  if (!viewer) return { visibility: "PUBLIC" };
  if (viewer.role === "ADMIN") return {};
  return {
    OR: [
      { visibility: "PUBLIC" },
      { visibility: "INTERNAL" },
      // bài nháp thì chỉ chính tác giả thấy
      { visibility: "DRAFT", authorId: viewer.id },
    ],
  };
}

export function canEdit(viewer: Viewer, article: { authorId: string }): boolean {
  if (!viewer) return false;
  return viewer.role === "ADMIN" || viewer.id === article.authorId;
}

// ---------- Truy vấn ----------
const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  coverImage: true,
  visibility: true,
  pinned: true,
  views: true,
  createdAt: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { username: true, displayName: true } },
} as const;

export type ArticleListItem = Awaited<ReturnType<typeof listArticles>>[number];

export async function listArticles(viewer: Viewer, categorySlug?: string) {
  return prisma.article.findMany({
    where: {
      ...visibleWhere(viewer),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: LIST_SELECT,
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getArticleBySlug(viewer: Viewer, slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, username: true, displayName: true } },
    },
  });
  if (!article) return null;
  // Kiểm tra lại quyền trên chính bản ghi thay vì tin vào truy vấn phía trên
  if (article.visibility === "PUBLIC") return article;
  if (!viewer) return null;
  if (viewer.role === "ADMIN") return article;
  if (article.visibility === "INTERNAL") return article;
  return article.authorId === viewer.id ? article : null;
}

export async function listCategories() {
  return prisma.articleCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });
}

/** Tăng lượt xem, không chặn việc hiển thị nếu lỗi */
export async function bumpViews(id: string) {
  await prisma.article.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
}

export async function getSidebarData(
  viewer: Viewer,
  opts?: {
    currentSlug?: string;
    categorySlug?: string;
    categoryId?: string | null;
  }
) {
  const whereVisible = visibleWhere(viewer);

  // 1. Bài viết cùng chuyên mục (nếu có category)
  let sameCategoryArticles: ArticleListItem[] = [];
  if (opts?.categorySlug || opts?.categoryId) {
    sameCategoryArticles = await prisma.article.findMany({
      where: {
        ...whereVisible,
        ...(opts.categorySlug
          ? { category: { slug: opts.categorySlug } }
          : { categoryId: opts.categoryId }),
        ...(opts?.currentSlug ? { slug: { not: opts.currentSlug } } : {}),
      },
      select: LIST_SELECT,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    });
  }

  // 2. Bài viết nổi bật / xem nhiều nhất toàn hệ thống
  const featuredArticles = await prisma.article.findMany({
    where: {
      ...whereVisible,
      ...(opts?.currentSlug ? { slug: { not: opts.currentSlug } } : {}),
    },
    select: LIST_SELECT,
    orderBy: [{ pinned: "desc" }, { views: "desc" }, { publishedAt: "desc" }],
    take: 5,
  });

  // 3. Danh sách chuyên mục
  const categories = await listCategories();

  // 4. Bài viết từ các chuyên mục khác
  let otherCategoryArticles: ArticleListItem[] = [];
  if (opts?.categorySlug || opts?.categoryId) {
    otherCategoryArticles = await prisma.article.findMany({
      where: {
        ...whereVisible,
        ...(opts.categorySlug
          ? { NOT: { category: { slug: opts.categorySlug } } }
          : opts.categoryId
          ? { NOT: { categoryId: opts.categoryId } }
          : {}),
        ...(opts?.currentSlug ? { slug: { not: opts.currentSlug } } : {}),
      },
      select: LIST_SELECT,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
    });
  }

  return {
    sameCategoryArticles,
    featuredArticles,
    otherCategoryArticles,
    categories,
  };
}

export async function getNextPrevArticles(viewer: Viewer, currentSlug: string, categoryId?: string | null) {
  const whereVisible = visibleWhere(viewer);
  const current = await prisma.article.findUnique({
    where: { slug: currentSlug },
    select: { createdAt: true, categoryId: true },
  });
  if (!current) return { prev: null, next: null };

  const [prev, next] = await Promise.all([
    prisma.article.findFirst({
      where: {
        ...whereVisible,
        ...(categoryId ? { categoryId } : {}),
        createdAt: { lt: current.createdAt },
      },
      select: LIST_SELECT,
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.findFirst({
      where: {
        ...whereVisible,
        ...(categoryId ? { categoryId } : {}),
        createdAt: { gt: current.createdAt },
      },
      select: LIST_SELECT,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { prev, next };
}

