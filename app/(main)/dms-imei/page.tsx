import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ImeiManager } from "@/components/dmsimei/imei-manager";
import { getDmsImeiConfig, missingDmsImei } from "@/lib/dmsimei/config";

export const dynamic = "force-dynamic";

// Chi ADMIN (IT) duoc dung — user thuong da bi proxy chan tu path prefix.
export default async function DmsImeiPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const cfg = await getDmsImeiConfig();
  const missing = missingDmsImei(cfg);

  return (
    <div className="space-y-4">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Reset IMEI DMS
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
          Clear IMEI tablet nhân viên Hữu Nghị để đăng nhập máy khác — khỏi mở web DMS tay.
        </p>
      </div>
      {missing.length > 0 && (
        <div className="rounded-sm border-2 border-red-600 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Chưa cấu hình tài khoản IT (thiếu: {missing.join(", ")}). Vào Cài đặt hệ thống →
          Tài khoản IT DMS để nhập.
        </div>
      )}
      <ImeiManager />
    </div>
  );
}
