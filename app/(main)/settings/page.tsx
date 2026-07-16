import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { CategoryManager } from "@/components/settings/category-manager";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ExportTemplateCard } from "@/components/settings/export-template-card";
import { UserManager } from "@/components/settings/user-manager";
import { ModuleOrderCard } from "@/components/settings/module-order-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/login");

  const [categories, settings, users] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true, incomes: true } } },
    }),
    getSettings(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Tài khoản & phân quyền, giao diện chung, mẫu xuất phiếu, danh mục thu/chi.
        </p>
      </div>

      <UserManager
        currentUserId={currentUser.id}
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          modules: u.modules,
          active: u.active,
        }))}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AppearanceSettings settings={settings} />
        <ModuleOrderCard order={settings.moduleOrder} />
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
