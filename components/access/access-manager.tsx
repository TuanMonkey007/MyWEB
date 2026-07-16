"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODULE_REGISTRY } from "@/lib/modules";
import { MODULE_CAPS, type PermMap } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export type UserDTO = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  permissions: string; // JSON
  active: boolean;
};

function parsePerms(json: string): PermMap {
  try {
    const raw = JSON.parse(json || "{}");
    const map: PermMap = {};
    for (const [k, v] of Object.entries(raw))
      if (Array.isArray(v)) map[k as keyof PermMap] = v.map(String);
    return map;
  } catch {
    return {};
  }
}

function PermissionMatrix({
  perms,
  onToggle,
}: {
  perms: PermMap;
  onToggle: (module: string, cap: string) => void;
}) {
  return (
    <div className="space-y-3">
      {MODULE_REGISTRY.map((m) => {
        const caps = perms[m.id] ?? [];
        const hasView = caps.includes("view");
        return (
          <div key={m.id} className="rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">{m.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {MODULE_CAPS[m.id].map((c) => {
                const active = caps.includes(c.id);
                const isView = c.id === "view";
                const disabled = !isView && !hasView;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(m.id, c.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? isView
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-emerald-500 bg-emerald-500 text-white"
                        : "text-muted-foreground hover:bg-accent",
                      disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserDTO | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [perms, setPerms] = useState<PermMap>({});
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setDisplayName(user?.displayName ?? "");
    setPassword("");
    setRole(user?.role ?? "USER");
    setPerms(user ? parsePerms(user.permissions) : {});
    setActive(user?.active ?? true);
  }, [open, user]);

  function toggle(module: string, cap: string) {
    setPerms((p) => {
      const next: PermMap = { ...p };
      const cur = new Set(next[module as keyof PermMap] ?? []);
      if (cap === "view") {
        if (cur.has("view")) delete next[module as keyof PermMap];
        else next[module as keyof PermMap] = ["view"];
        return next;
      }
      if (cur.has(cap)) cur.delete(cap);
      else {
        cur.add(cap);
        cur.add("view");
      }
      if (cur.size === 0) delete next[module as keyof PermMap];
      else next[module as keyof PermMap] = [...cur];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
        method: user ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          role,
          permissions: perms,
          active,
          ...(user ? { newPassword: password || undefined } : { password }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(user ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? `Sửa tài khoản @${user.username}` : "Thêm tài khoản"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="u-username">Tên đăng nhập</Label>
              <Input
                id="u-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: nam.nv"
                disabled={!!user}
                autoFocus={!user}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-name">Tên hiển thị</Label>
              <Input
                id="u-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="vd: Nguyễn Văn Nam"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="u-pass">
                {user ? "Đặt lại mật khẩu (bỏ trống = giữ)" : "Mật khẩu (≥6 ký tự)"}
              </Label>
              <Input
                id="u-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Người dùng</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {role === "ADMIN" ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Quản trị viên có toàn quyền mọi module + trang Cài đặt + Phân quyền.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Phân quyền theo module</Label>
              <p className="text-xs text-muted-foreground">
                Bật &quot;Xem&quot; để cấp quyền truy cập module, rồi chọn thêm các
                quyền thao tác.
              </p>
              <PermissionMatrix perms={perms} onToggle={toggle} />
            </div>
          )}

          {user && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 accent-primary"
              />
              Đang hoạt động (bỏ tick = khóa, đăng xuất ngay mọi thiết bị)
            </label>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={saving || (!user && (!username || password.length < 6))}
          >
            {saving ? "Đang lưu..." : user ? "Cập nhật" : "Tạo tài khoản"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AccessManager({
  users,
  currentUserId,
}: {
  users: UserDTO[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ open: boolean; user: UserDTO | null }>({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState<UserDTO | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Đã xóa tài khoản @${deleting.username}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
    setDeleting(null);
  }

  function summary(u: UserDTO) {
    if (u.role === "ADMIN") return null;
    const perms = parsePerms(u.permissions);
    return MODULE_REGISTRY.filter((m) => (perms[m.id] ?? []).includes("view")).map((m) => {
      const caps = perms[m.id] ?? [];
      const labels = MODULE_CAPS[m.id]
        .filter((c) => caps.includes(c.id) && c.id !== "view")
        .map((c) => c.label);
      return { label: m.label, extra: labels };
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-5" /> Tài khoản & phân quyền
        </CardTitle>
        <Button size="sm" onClick={() => setDialog({ open: true, user: null })}>
          <Plus className="size-4" /> Thêm tài khoản
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {users.map((u) => {
            const mods = summary(u);
            return (
              <li key={u.id} className="flex items-start gap-3 py-2.5">
                <UserRound
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    u.active ? "text-muted-foreground" : "text-red-500"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{u.displayName || u.username}</span>
                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                    {u.id === currentUserId && (
                      <Badge variant="outline" className="text-[10px]">bạn</Badge>
                    )}
                    {!u.active && <Badge variant="destructive">Đã khóa</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {u.role === "ADMIN" ? (
                      <Badge className="text-[10px]">Quản trị viên — toàn quyền</Badge>
                    ) : mods && mods.length ? (
                      mods.map((m) => (
                        <Badge key={m.label} variant="secondary" className="text-[10px]">
                          {m.label}
                          {m.extra.length ? `: ${m.extra.join(", ")}` : " (chỉ xem)"}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Chưa được cấp quyền nào
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => setDialog({ open: true, user: u })}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive hover:text-destructive"
                  disabled={u.id === currentUserId}
                  onClick={() => setDeleting(u)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <UserDialog
        open={dialog.open}
        user={dialog.user}
        onClose={() => setDialog({ open: false, user: null })}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài khoản @{deleting?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản bị đăng xuất khỏi mọi thiết bị và không đăng nhập được nữa.
              Dữ liệu trong các module không bị ảnh hưởng. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
