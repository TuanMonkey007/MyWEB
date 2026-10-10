import { redirect } from "next/navigation";
import { CircleUser } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { MODULE_REGISTRY } from "@/lib/modules";
import { MODULE_CAPS, parsePermissions, userModules } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const moduleIds = userModules(user);
  const perms = parsePermissions(user);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Tài khoản của tôi
        </h1>
        <LogoutButton className="md:hidden" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <CircleUser className="size-5 text-[#F25C2B]" /> Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[8rem_1fr] gap-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên đăng nhập</span>
              <span className="font-bold font-mono text-foreground">{user.username}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên hiển thị</span>
              <span className="font-bold text-foreground">{user.displayName ?? "—"}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vai trò</span>
              <span>
                {user.role === "ADMIN" ? (
                  <Badge variant="default">Quản trị viên</Badge>
                ) : (
                  <Badge variant="secondary">Người dùng</Badge>
                )}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quyền được cấp</span>
              <span className="space-y-1.5">
                {moduleIds.length === 0 && "—"}
                {MODULE_REGISTRY.filter((m) => moduleIds.includes(m.id)).map((m) => {
                  const caps = isAdmin
                    ? MODULE_CAPS[m.id].map((c) => c.id)
                    : perms[m.id] ?? [];
                  return (
                    <span key={m.id} className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline">{m.label}</Badge>
                      {MODULE_CAPS[m.id]
                        .filter((c) => caps.includes(c.id))
                        .map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.label}
                          </Badge>
                        ))}
                    </span>
                  );
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
