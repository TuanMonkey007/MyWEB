import Link from "next/link";
import type { Metadata } from "next";
import { Eye, Lock } from "lucide-react";
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
    <Lock
      className="mr-1 inline size-3 shrink-0 align-[-1px] text-muted-foreground"
      aria-label={visibility === "DRAFT" ? "Bản nháp" : "Bài nội bộ"}
    />
  );
}

/** Bài chủ đạo: ảnh lớn + tiêu đề to, chiếm cột giữa */
function BaiNoiBat({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article>
      <Link href={`/huong-dan/${a.slug}`} className="group block">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={800}
            height={450}
            className="mb-3 aspect-video w-full rounded-lg border object-cover"
          />
        ) : (
          <div className="mb-3 aspect-video w-full rounded-lg border bg-muted" />
        )}
        {a.category && (
          <span className="mb-1.5 inline-block rounded bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            {a.category.name}
          </span>
        )}
        <h2 className="text-2xl font-bold leading-snug tracking-tight group-hover:text-primary">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h2>
        {a.summary && (
          <p className="mt-2 line-clamp-3 text-muted-foreground">{a.summary}</p>
        )}
      </Link>
    </article>
  );
}

/** Bài phụ cột trái: ảnh trên, tiêu đề dưới */
function BaiCotTrai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="border-b pb-4 last:border-0">
      <Link href={`/huong-dan/${a.slug}`} className="group block">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={400}
            height={225}
            loading="lazy"
            className="mb-2 aspect-video w-full rounded-md border object-cover"
          />
        )}
        <h3 className="font-semibold leading-snug group-hover:text-primary">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h3>
      </Link>
    </article>
  );
}

/** Bài cột phải: tiêu đề trái, ảnh nhỏ phải */
function BaiCotPhai({ a }: { a: ArticleListItem }) {
  const img = anhBia(a.coverImage);
  return (
    <article className="border-b pb-4 last:border-0">
      <Link href={`/huong-dan/${a.slug}`} className="group flex items-start gap-3">
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug group-hover:text-primary">
          <NhanRiengTu visibility={a.visibility} />
          {a.title}
        </h3>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={112}
            height={72}
            loading="lazy"
            className="h-[72px] w-28 shrink-0 rounded-md border object-cover"
          />
        )}
      </Link>
    </article>
  );
}

export default async function TrangChu() {
  // Đọc người dùng trước vì danh sách bài phụ thuộc quyền xem của họ
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader platformName={settings.platformName} isLoggedIn={!!user} />
      <CategoryNav categories={categories} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {!noiBat ? (
          <div className="rounded-lg border border-dashed py-20 text-center">
            <p className="text-muted-foreground">Chưa có bài viết nào được đăng.</p>
            {user && (
              <Link
                href="/articles/new"
                className="mt-2 inline-block text-primary underline-offset-2 hover:underline"
              >
                Viết bài đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Lưới 3 cột kiểu trang nhất: phụ · chủ đạo · danh sách */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)]">
              <div className="order-2 space-y-4 lg:order-1">
                {cotTrai.map((a) => (
                  <BaiCotTrai key={a.id} a={a} />
                ))}
              </div>
              <div className="order-1 lg:order-2">
                <BaiNoiBat a={noiBat} />
              </div>
              <div className="order-3 space-y-4">
                {cotPhai.map((a) => (
                  <BaiCotPhai key={a.id} a={a} />
                ))}
              </div>
            </div>

            {conLai.length > 0 && (
              <section className="mt-10 border-t pt-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Bài khác
                </h2>
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {conLai.map((a) => (
                    <article key={a.id}>
                      <Link href={`/huong-dan/${a.slug}`} className="group block">
                        <h3 className="font-semibold leading-snug group-hover:text-primary">
                          <NhanRiengTu visibility={a.visibility} />
                          {a.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}</span>
                          <span className="flex items-center gap-1">
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

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {settings.platformName} ·{" "}
        <Link href="/dong-ho" className="underline-offset-2 hover:underline">
          Đồng hồ thế giới
        </Link>
      </footer>
    </div>
  );
}
