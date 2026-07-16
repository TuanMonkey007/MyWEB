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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Phân quyền</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tài khoản và cấp quyền chi tiết (xem / thêm / sửa / xóa và các tính
          năng đặc biệt) cho từng module.
        </p>
      </div>

      <AccessManager
        currentUserId={currentUser.id}
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          // quyền hiệu lực (kèm suy ra từ cột modules cũ) để hiển thị đúng
          permissions: JSON.stringify(parsePermissions(u)),
          active: u.active,
        }))}
      />
    </div>
  );
}
