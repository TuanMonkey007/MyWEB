import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { RouteConverter } from "@/components/dms/route-converter";

export const dynamic = "force-dynamic";

export default async function DmsPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <RouteConverter
      savedTemplate={settings.dmsTemplateName}
      isAdmin={user?.role === "ADMIN"}
    />
  );
}
