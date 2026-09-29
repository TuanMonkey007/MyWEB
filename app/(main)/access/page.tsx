import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parsePermissions } from "@/lib/permissions";
import { AccessManager } from "@/components/access/access-manager";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Phân quyền người dùng
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
          Quản lý tài khoản và cấp quyền chi tiết (xem / thêm / sửa / xóa và các tính
          năng đặc biệt) cho từng module trong hệ thống.
        </p>
      </div>

      <AccessManager
        currentUserId={currentUser.id}
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          permissions: JSON.stringify(parsePermissions(u)),
          active: u.active,
        }))}
      />
    </div>
  );
}
