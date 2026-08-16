import Link from "next/link";
import type { Metadata } from "next";
import { Eye, Lock, MessageSquareText, Pin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listArticles, listCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { thoiGianTuongDoi } from "@/lib/article-format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Hướng dẫn kỹ thuật · ${settings.platformName}`,
    description: "Tổng hợp bài hướng dẫn, thủ thuật và tài liệu kỹ thuật.",
  };
}

export default async function HuongDanPage({
  searchParams,
}: {
  searchParams: Promise<{ "chuyen-muc"?: string }>;
}) {
  const { "chuyen-muc": chuyenMuc } = await searchParams;
  const user = await getCurrentUser();
  const [articles, categories] = await Promise.all([
    listArticles(user, chuyenMuc),
    listCategories(),
  ]);

  // Gom bài theo chuyên mục — kiểu diễn đàn: mỗi chuyên mục là một khu,
  // trong đó là danh sách chủ đề.
  const groups = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      items: articles.filter((a) => a.category?.id === c.id),
    })),
    {
      id: "none",
      name: "Chưa phân loại",
      description: null,
      items: articles.filter((a) => !a.category),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hướng dẫn kỹ thuật</h1>
        <p className="text-sm text-muted-foreground">
          {articles.length > 0
            ? `${articles.length} bài trong ${groups.length} chuyên mục.`
            : "Chưa có bài viết nào."}
          {!user && " Đăng nhập để xem thêm các bài nội bộ."}
        </p>
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <MessageSquareText className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Chưa có bài hướng dẫn nào được đăng.
          </p>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.id} className="overflow-hidden rounded-lg border">
          <header className="border-b bg-muted/50 px-4 py-2.5">
            <h2 className="text-sm font-semibold">{g.name}</h2>
            {g.description && (
              <p className="text-xs text-muted-foreground">{g.description}</p>
            )}
          </header>
          <ul className="divide-y">
            {g.items.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/huong-dan/${a.slug}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    {a.pinned && <Pin className="size-3.5 shrink-0 self-center text-primary" />}
                    {a.visibility !== "PUBLIC" && (
                      <Lock
                        className="size-3.5 shrink-0 self-center text-muted-foreground"
                        aria-label={a.visibility === "DRAFT" ? "Bản nháp" : "Bài nội bộ"}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="font-medium">{a.title}</span>
                      {a.summary && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.summary}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>{a.author.displayName || a.author.username}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {a.views}
                    </span>
                    <span className="w-24 text-right">
                      {thoiGianTuongDoi(a.publishedAt ?? a.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
