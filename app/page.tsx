import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Clock, Eye, FileText, Lock } from "lucide-react";
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
    <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
      <Lock className="size-3" />
      {visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
    </span>
  );
}

function BaiNoiBat({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/50">
      <Link href={`/huong-dan/${a.slug}`} className="flex flex-1 flex-col">
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-101"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <FileText className="size-10 opacity-30" />
            </div>
          )}
          {a.category && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-xs">
              {a.category.name}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
              <NhanRiengTu visibility={a.visibility} />
              {a.title}
            </h2>
            {a.summary && (
              <p className="mt-2 line-clamp-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {a.summary}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="size-3.5" />
              {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Eye className="size-3.5 text-muted-foreground" />
              {a.views} lượt xem
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function BaiCotTrai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/40">
      <Link href={`/huong-dan/${a.slug}`} className="block">
        {img && (
          <div className="mb-2.5 aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              width={400}
              height={225}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {a.category && (
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            {a.category.name}
          </div>
        )}
        <h3 className="text-xs sm:text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h3>
        <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
          <span className="flex items-center gap-1 font-medium">
            <Eye className="size-3" />
            {a.views}
          </span>
        </p>
      </Link>
    </article>
  );
}

function BaiCotPhai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group rounded-lg border border-border bg-card p-2.5 shadow-xs transition-colors hover:border-primary/40">
      <Link href={`/huong-dan/${a.slug}`} className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          {a.category && (
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {a.category.name}
            </div>
          )}
          <h3 className="text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <NhanRiengTu visibility={a.visibility} />
            {a.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 font-medium">
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
            className="h-14 w-20 shrink-0 rounded border border-border object-cover"
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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <CategoryNav categories={categories} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {!noiBat ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-20 text-center">
            <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Chưa có bài viết nào được đăng.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Các tài liệu hướng dẫn và thông báo sẽ hiển thị tại đây khi xuất bản.
            </p>
            {user && (
              <Link
                href="/articles/new"
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                Viết bài đầu tiên <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)] items-start">
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
              <section className="mt-8 border-t border-border pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Chủ đề & Tài liệu khác
                  </h2>
                  <Link
                    href="/huong-dan"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Xem tất cả ({baiViet.length})
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {conLai.map((a) => (
                    <article
                      key={a.id}
                      className="group rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/40"
                    >
                      <Link href={`/huong-dan/${a.slug}`} className="block">
                        {a.category && (
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {a.category.name}
                          </div>
                        )}
                        <h3 className="font-semibold text-xs sm:text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          <NhanRiengTu visibility={a.visibility} />
                          {a.title}
                        </h3>
                        {a.summary && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {a.summary}
                          </p>
                        )}
                        <p className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
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

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <p>© {new Date().getFullYear()} {settings.platformName} • Hữu Nghị Food (HNF)</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/huong-dan" className="hover:text-foreground transition-colors">
              Tài liệu
            </Link>
            <Link href="/dong-ho" className="hover:text-foreground transition-colors">
              Đồng hồ thế giới
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Quản trị
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
