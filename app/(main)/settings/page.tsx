import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CategoryManager } from "@/components/settings/category-manager";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ExportTemplateCard } from "@/components/settings/export-template-card";
import { ModuleOrderCard } from "@/components/settings/module-order-card";
import { DmsImeiConfigCard, type DmsImeiView } from "@/components/dmsimei/dmsimei-config-card";
import { getDmsImeiConfig, missingDmsImei } from "@/lib/dmsimei/config";
import { maskSecret } from "@/lib/secret-box";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/login");

  const [categories, settings, dmsImei] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true, incomes: true } } },
    }),
    getSettings(),
    getDmsImeiConfig(),
  ]);

  const dmsImeiView: DmsImeiView = {
    baseUrl: dmsImei.baseUrl,
    username: dmsImei.username,
    hasPassword: !!dmsImei.password,
    masked: dmsImei.password ? maskSecret(dmsImei.password) : null,
    broken: dmsImei.broken,
    missing: missingDmsImei(dmsImei),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
          Giao diện chung, thứ tự module, mẫu xuất phiếu, danh mục thu/chi.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppearanceSettings settings={settings} />
        <ModuleOrderCard order={settings.moduleOrder} />
        <ExportTemplateCard templateName={settings.exportTemplateName} />
        <DmsImeiConfigCard config={dmsImeiView} />
      </div>

      <div className="space-y-3">
        <h2 className="font-editorial text-xl font-bold text-foreground">Danh mục thu / chi (Tài chính)</h2>
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
