import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/settings/category-manager";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: { _count: { select: { expenses: true, incomes: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý danh mục thu/chi. Danh mục đang dùng trong giao dịch không
            thể xóa.
          </p>
        </div>
        <LogoutButton className="md:hidden" />
      </div>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          usageCount: c._count.expenses + c._count.incomes,
        }))}
      />
    </div>
  );
}
