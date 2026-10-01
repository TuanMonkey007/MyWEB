import { cn } from "@/lib/utils";

export function ArticleLayoutWrapper({
  sidebar,
  children,
  className,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-8 lg:grid-cols-12 items-start", className)}>
      {/* Cột Nội dung chính (Bên Trái) */}
      <div className="min-w-0 lg:col-span-8">
        {children}
      </div>

      {/* Cột Sidebar bài viết & thumbnail (Mặc định cố định Bên Phải) */}
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-20 space-y-6">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
