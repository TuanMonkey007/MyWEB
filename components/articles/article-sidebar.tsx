import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  FileSpreadsheet,
  Headphones,
  Layers,
  Mail,
  Pin,
  Sparkles,
  Tag,
} from "lucide-react";
import { ArticleThumbnail } from "./article-thumbnail";
import type { ArticleListItem } from "@/lib/articles";
import { thoiGianTuongDoi } from "@/lib/article-format";

interface ArticleSidebarProps {
  sameCategoryArticles?: ArticleListItem[];
  featuredArticles?: ArticleListItem[];
  otherCategoryArticles?: ArticleListItem[];
  categories?: { id: string; name: string; slug: string; _count?: { articles: number } }[];
  currentCategoryName?: string | null;
  currentSlug?: string;
}

export function ArticleSidebar({
  sameCategoryArticles = [],
  featuredArticles = [],
  otherCategoryArticles = [],
  categories = [],
  currentCategoryName,
  currentSlug,
}: ArticleSidebarProps) {
  // Lọc bài viết hiện tại ra khỏi danh sách
  const sameCat = sameCategoryArticles.filter((a) => a.slug !== currentSlug);
  const featured = featuredArticles.filter((a) => a.slug !== currentSlug);
  const otherCat = otherCategoryArticles.filter((a) => a.slug !== currentSlug);

  return (
    <aside className="space-y-6">
      {/* ── KHUNG 1: CÙNG CHUYÊN MỤC (NẾU CÓ BÀI) ── */}
      {sameCat.length > 0 && (
        <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
          <div className="border-b-2 border-[#1C1917] bg-[#FDF1EA] px-4 py-3 dark:bg-[#2C1F15] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="font-editorial text-sm font-bold uppercase tracking-tight text-foreground">
                Cùng chuyên mục {currentCategoryName ? `• ${currentCategoryName}` : ""}
              </h3>
            </div>
            <span className="rounded-xs border border-[#1C1917] bg-primary px-1.5 py-0.2 text-xs font-black text-primary-foreground">
              {sameCat.length}
            </span>
          </div>

          <div className="p-3.5 space-y-4">
            {sameCat.map((article) => (
              <Link
                key={article.id}
                href={`/bai-viet/${article.slug}`}
                className="group block space-y-2 rounded-xs border border-transparent p-2 transition-all hover:border-[#1C1917] hover:bg-[#FAF7F0] hover:shadow-neo-sm dark:hover:bg-[#22170F]"
              >
                {/* Thumbnail lớn chuẩn 16:9 như nét vẽ màu xanh lá của bạn */}
                <ArticleThumbnail
                  coverImage={article.coverImage}
                  title={article.title}
                  categoryName={article.category?.name}
                  aspectRatio="video"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    {article.pinned && (
                      <span className="inline-flex items-center gap-0.5 text-primary">
                        <Pin className="size-2.5" /> Ghim
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-2.5 text-primary" /> {article.views}
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {thoiGianTuongDoi(article.publishedAt ?? article.createdAt)}
                    </span>
                  </div>

                  <h4 className="font-editorial text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h4>

                  {article.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KHUNG 2: BÀI VIẾT NỔI BẬT & ĐỌC NHIỀU ── */}
      {featured.length > 0 && (
        <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
          <div className="border-b-2 border-[#1C1917] bg-[#F5EFEB] px-4 py-3 dark:bg-[#22170F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <h3 className="font-editorial text-sm font-bold uppercase tracking-tight text-foreground">
                Bài viết nổi bật & Đề xuất
              </h3>
            </div>
            <span className="text-xs font-black uppercase text-muted-foreground">
              Hot
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {featured.slice(0, 4).map((article) => (
              <Link
                key={article.id}
                href={`/bai-viet/${article.slug}`}
                className="group flex gap-3 p-3 transition-colors hover:bg-[#FAF7F0] dark:hover:bg-[#22170F]"
              >
                {/* Thumbnail nhỏ ở bên trái bài viết */}
                <div className="w-24 shrink-0">
                  <ArticleThumbnail
                    coverImage={article.coverImage}
                    title={article.title}
                    categoryName={article.category?.name}
                    aspectRatio="video"
                    className="h-16"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span>{article.category?.name || "Tài liệu"}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Eye className="size-2.5 text-primary" /> {article.views}
                    </span>
                  </div>

                  <h4 className="font-editorial text-xs sm:text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h4>

                  <div className="text-xs text-muted-foreground font-mono">
                    {thoiGianTuongDoi(article.publishedAt ?? article.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KHUNG 3: CHUYÊN MỤC LIÊN QUAN KHÁC ── */}
      {categories.length > 0 && (
        <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo dark:bg-card">
          <div className="flex items-center gap-2 border-b-2 border-[#1C1917] pb-2 mb-3">
            <Tag className="size-4 text-primary" />
            <h3 className="font-editorial text-sm font-bold uppercase tracking-tight text-foreground">
              Chuyên mục bài viết
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/bai-viet"
              className="inline-flex items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] px-2.5 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-white hover:text-primary transition-all dark:bg-[#22170F]"
            >
              <span>Tất cả</span>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/bai-viet?chuyen-muc=${cat.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white px-2.5 py-1 text-xs font-bold text-foreground shadow-neo-sm hover:bg-[#FDF1EA] hover:text-primary transition-all dark:bg-card"
              >
                <span>{cat.name}</span>
                {typeof cat._count?.articles === "number" && (
                  <span className="rounded-xs bg-[#1C1917] px-1 py-0.2 text-xs font-black text-white dark:bg-stone-700">
                    {cat._count.articles}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KHUNG 4: CÁC BÀI TỪ CHUYÊN MỤC KHÁC ── */}
      {otherCat.length > 0 && (
        <div className="overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
          <div className="border-b-2 border-[#1C1917] bg-[#FAF7F0] px-4 py-3 dark:bg-[#22170F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <h3 className="font-editorial text-sm font-bold uppercase tracking-tight text-foreground">
                Xem thêm từ chuyên mục khác
              </h3>
            </div>
          </div>

          <div className="p-3.5 space-y-3.5">
            {otherCat.map((article) => (
              <Link
                key={article.id}
                href={`/bai-viet/${article.slug}`}
                className="group flex gap-3 items-center rounded-xs p-1.5 hover:bg-accent/40 transition-colors"
              >
                <div className="w-20 shrink-0">
                  <ArticleThumbnail
                    coverImage={article.coverImage}
                    title={article.title}
                    categoryName={article.category?.name}
                    aspectRatio="video"
                    className="h-14"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-primary truncate">
                    {article.category?.name || "Chung"}
                  </div>
                  <h5 className="font-bold text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </h5>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── KHUNG 5: HỖ TRỢ KỸ THUẬT & LIÊN HỆ DMS HNF ── */}
      <div className="rounded-xs border-2 border-[#1C1917] bg-gradient-to-br from-[#FDF1EA] to-[#FAF7F0] p-4 shadow-neo dark:from-[#2C1F15] dark:to-[#22170F]">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
          <Headphones className="size-3.5" /> Hỗ trợ kỹ thuật DMS
        </div>
        <div className="font-editorial text-sm font-black text-foreground">
          Phòng CNTT &bull; Hữu Nghị Food
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Gặp khó khăn khi thao tác app hoặc cần hỗ trợ tài khoản? Vui lòng liên hệ trực tiếp:
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#1C1917]/20 flex flex-col gap-1 text-xs font-semibold">
          <a
            href="mailto:tuannm@huunghi.com.vn"
            className="flex items-center gap-1.5 text-primary hover:underline font-bold"
          >
            <Mail className="size-3.5" /> tuannm@huunghi.com.vn
          </a>
          <span className="text-xs text-muted-foreground">
            122 Định Công, Hoàng Mai, Hà Nội
          </span>
        </div>
      </div>
    </aside>
  );
}
