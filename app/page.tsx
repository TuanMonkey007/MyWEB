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
    <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[11px] font-bold text-rose-700 mr-1.5">
      <Lock className="size-3" />
      {visibility === "DRAFT" ? "Bản nháp" : "Nội bộ"}
    </span>
  );
}

function BaiNoiBat({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="group h-full flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-[#9f1239]/50 transition-all">
      <Link href={`/huong-dan/${a.slug}`} className="flex flex-col flex-1">
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              width={800}
              height={450}
              className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-rose-50 text-[#881337]">
              <span className="font-bold text-lg">HNF DOCUMENTATION</span>
            </div>
          )}
          {a.category && (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-lg bg-[#9f1239] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
              {a.category.name}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-slate-900 group-hover:text-[#9f1239] transition-colors">
              <NhanRiengTu visibility={a.visibility} />
              {a.title}
            </h2>
            {a.summary && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {a.summary}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="size-3.5 text-slate-400" />
              {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
            </span>
            <span className="flex items-center gap-1 font-bold text-slate-600">
              <Eye className="size-3.5 text-slate-400" />
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
    <article className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-[#9f1239]/40 transition-all">
      <Link href={`/huong-dan/${a.slug}`} className="block">
        {img && (
          <div className="mb-2.5 aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              width={400}
              height={225}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        )}
        {a.category && (
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#9f1239]">
            {a.category.name}
          </div>
        )}
        <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-[#9f1239] transition-colors">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h3>
        <p className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
          <span className="flex items-center gap-1 font-semibold">
            <Eye className="size-3 text-slate-400" />
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
    <article className="group rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-[#9f1239]/40 transition-all">
      <Link href={`/huong-dan/${a.slug}`} className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {a.category && (
            <div className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#9f1239]">
              {a.category.name}
            </div>
          )}
          <h3 className="text-xs sm:text-[13px] font-bold leading-snug text-slate-900 group-hover:text-[#9f1239] transition-colors line-clamp-2">
            <NhanRiengTu visibility={a.visibility} />
            {a.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-2 text-[10.5px] text-slate-500">
            <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 font-semibold">
              <Eye className="size-3 text-slate-400" /> {a.views}
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
            className="h-16 w-24 shrink-0 rounded-lg border border-slate-100 object-cover"
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
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-800">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <CategoryNav categories={categories} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {!noiBat ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#881337]">
              <Sparkles className="size-6" />
            </div>
            <p className="text-base font-bold text-slate-800">Chưa có bài viết nào được đăng.</p>
            <p className="mt-1 text-xs text-slate-500">
              Các tài liệu hướng dẫn và thông báo sẽ hiển thị tại đây khi xuất bản.
            </p>
            {user && (
              <Link
                href="/articles/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#9f1239] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#881337] transition-all"
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
              <section className="mt-10 border-t border-slate-200 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#9f1239]" />
                    Chủ đề & Tài liệu khác
                  </h2>
                  <Link
                    href="/huong-dan"
                    className="text-xs font-bold text-[#9f1239] hover:underline"
                  >
                    Xem tất cả ({baiViet.length})
                  </Link>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {conLai.map((a) => (
                    <article
                      key={a.id}
                      className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-[#9f1239]/40 transition-all"
                    >
                      <Link href={`/huong-dan/${a.slug}`} className="block">
                        {a.category && (
                          <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-[#9f1239]">
                            {a.category.name}
                          </div>
                        )}
                        <h3 className="font-bold text-xs sm:text-sm leading-snug text-slate-800 group-hover:text-[#9f1239] transition-colors line-clamp-2">
                          <NhanRiengTu visibility={a.visibility} />
                          {a.title}
                        </h3>
                        {a.summary && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {a.summary}
                          </p>
                        )}
                        <p className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] text-slate-500">
                          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
                          <span className="flex items-center gap-1 font-bold">
                            <Eye className="size-3 text-slate-400" />
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

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <p>Hữu Nghị Food (HNF) • {settings.platformName} • Bản quyền phòng DMS & Kế toán Bán Hàng</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link href="/huong-dan" className="hover:text-[#9f1239] transition-colors">
              Tài liệu
            </Link>
            <Link href="/dong-ho" className="hover:text-[#9f1239] transition-colors">
              Đồng hồ thế giới
            </Link>
            <Link href="/login" className="hover:text-[#9f1239] transition-colors">
              Quản trị
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
