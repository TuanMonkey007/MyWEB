import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { CategoryManager } from "@/components/settings/category-manager";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ExportTemplateCard } from "@/components/settings/export-template-card";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true, incomes: true } } },
    }),
    getSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">
            Giao diện chung, mẫu xuất phiếu và danh mục thu/chi.
          </p>
        </div>
        <LogoutButton className="md:hidden" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppearanceSettings settings={settings} />
        <ExportTemplateCard templateName={settings.exportTemplateName} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Danh mục thu/chi (module Tài chính)</h2>
        <CategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            kind: c.kind,
            usageCount: c._count.expenses + c._count.incomes,
          }))}
        />
      </div>
    </div>
  );
}
