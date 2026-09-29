import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Clock, Eye, Lock, Sparkles } from "lucide-react";
import { CategoryNav } from "@/components/articles/category-nav";
import { SiteHeader } from "@/components/articles/site-header";
import { getCurrentUser } from "@/lib/auth";
import { listArticles, listCategories, type ArticleListItem } from "@/lib/articles";
import { anhBia, thoiGianTuongDoi } from "@/lib/article-format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.platformName,
    description: "Bài hướng dẫn, thủ thuật và tài liệu kỹ thuật.",
  };
}

function NhanRiengTu({ visibility }: { visibility: string }) {
  if (visibility === "PUBLIC") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 mr-1.5">
      <Lock className="size-3" />
      {visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
    </span>
  );
}

/** Bài chủ đạo: Card lớn, ảnh tràn viền bo góc, hover zoom nhẹ */
function BaiNoiBat({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group h-full flex flex-col rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-300">
      <Link href={`/huong-dan/${a.slug}`} className="flex flex-col flex-1">
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary">
              <Sparkles className="size-10 opacity-40" />
            </div>
          )}
          {a.category && (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-lg bg-background/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-xs backdrop-blur-md">
              {a.category.name}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
              <NhanRiengTu visibility={a.visibility} />
              {a.title}
            </h2>
            {a.summary && (
              <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {a.summary}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="size-3.5" />
              {a.views} lượt xem
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Bài phụ cột trái */
function BaiCotTrai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200">
      <Link href={`/huong-dan/${a.slug}`} className="block">
        {img && (
          <div className="mb-2.5 aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              width={400}
              height={225}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        {a.category && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {a.category.name}
          </div>
        )}
        <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h3>
        <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {a.views}
          </span>
        </p>
      </Link>
    </article>
  );
}

/** Bài cột phải: Tiêu đề bên trái, ảnh nhỏ bên phải */
function BaiCotPhai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group rounded-xl border border-border/60 bg-card p-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200">
      <Link href={`/huong-dan/${a.slug}`} className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {a.category && (
            <div className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary">
              {a.category.name}
            </div>
          )}
          <h3 className="text-xs sm:text-[13px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <NhanRiengTu visibility={a.visibility} />
            {a.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-2 text-[10.5px] text-muted-foreground">
            <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" /> {a.views}
            </span>
          </p>
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={96}
            height={64}
            loading="lazy"
            className="h-16 w-24 shrink-0 rounded-lg border border-border/50 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </Link>
    </article>
  );
}

export default async function TrangChu() {
  const user = await getCurrentUser();
  const [settings, baiViet, categories] = await Promise.all([
    getSettings(),
    listArticles(user),
    listCategories(),
  ]);

  const noiBat = baiViet[0];
  const cotTrai = baiViet.slice(1, 4);
  const cotPhai = baiViet.slice(4, 9);
  const conLai = baiViet.slice(9, 21);

  return (
    <div className="flex min-h-dvh flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <CategoryNav categories={categories} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {!noiBat ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 py-24 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Sparkles className="size-6" />
            </div>
            <p className="text-base font-medium text-foreground">Chưa có bài viết nào được đăng.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Các bài viết và tài liệu hướng dẫn sẽ xuất hiện tại đây khi được xuất bản.
            </p>
            {user && (
              <Link
                href="/articles/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
              >
                Viết bài đầu tiên <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Lưới 3 cột: Phụ trái · Chủ đạo giữa · Danh sách phải */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)] items-start">
              <div className="order-2 space-y-3 lg:order-1">
                {cotTrai.map((a) => (
                  <BaiCotTrai key={a.id} a={a} />
                ))}
              </div>
              <div className="order-1 lg:order-2 h-full">
                <BaiNoiBat a={noiBat} />
              </div>
              <div className="order-3 space-y-2.5">
                {cotPhai.map((a) => (
                  <BaiCotPhai key={a.id} a={a} />
                ))}
              </div>
            </div>

            {conLai.length > 0 && (
              <section className="mt-14 border-t border-border/60 pt-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    Các bài viết khác
                  </h2>
                  <Link
                    href="/huong-dan"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Xem tất cả ({baiViet.length})
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {conLai.map((a) => (
                    <article
                      key={a.id}
                      className="group rounded-2xl border border-border/70 bg-card p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200"
                    >
                      <Link href={`/huong-dan/${a.slug}`} className="block">
                        {a.category && (
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            {a.category.name}
                          </div>
                        )}
                        <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          <NhanRiengTu visibility={a.visibility} />
                          {a.title}
                        </h3>
                        {a.summary && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {a.summary}
                          </p>
                        )}
                        <p className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Eye className="size-3" />
                            {a.views}
                          </span>
                        </p>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border/60 bg-card/40 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <p>© {new Date().getFullYear()} {settings.platformName}. Bản quyền thuộc về tác giả.</p>
          <div className="flex items-center gap-4">
            <Link href="/huong-dan" className="hover:text-foreground transition-colors">
              Tài liệu
            </Link>
            <Link href="/dong-ho" className="hover:text-foreground transition-colors">
              Đồng hồ thế giới
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Hệ thống
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
