"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type UserDTO = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  modules: string;
  active: boolean;
};

function UserDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserDTO | null; // null = tạo mới
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [modules, setModules] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setDisplayName(user?.displayName ?? "");
    setPassword("");
    setRole(user?.role ?? "USER");
    setModules(user ? user.modules.split(",").filter(Boolean) : []);
    setActive(user?.active ?? true);
  }, [open, user]);

  function toggleModule(id: string) {
    setModules((ms) => (ms.includes(id) ? ms.filter((m) => m !== id) : [...ms, id]));
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
          modules,
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
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
              Quản trị viên dùng được mọi module + trang Cài đặt + quản lý tài khoản.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Module được sử dụng</Label>
              <div className="space-y-1.5">
                {MODULE_REGISTRY.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={modules.includes(m.id)}
                      onChange={() => toggleModule(m.id)}
                      className="size-4 accent-primary"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
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
              Đang hoạt động (bỏ tick = khóa tài khoản, đăng xuất ngay mọi thiết bị)
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

export function UserManager({
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

  const moduleLabel = (id: string) => MODULE_REGISTRY.find((m) => m.id === id)?.label ?? id;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Tài khoản & phân quyền</CardTitle>
        <Button size="sm" onClick={() => setDialog({ open: true, user: null })}>
          <Plus className="size-4" /> Thêm tài khoản
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-2.5">
              <UserRound
                className={cn(
                  "size-5 shrink-0",
                  u.active ? "text-muted-foreground" : "text-red-500"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{u.displayName || u.username}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  {u.id === currentUserId && (
                    <Badge variant="outline" className="text-[10px]">
                      bạn
                    </Badge>
                  )}
                  {!u.active && <Badge variant="destructive">Đã khóa</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {u.role === "ADMIN" ? (
                    <Badge className="text-[10px]">Quản trị viên — mọi module</Badge>
                  ) : u.modules ? (
                    u.modules
                      .split(",")
                      .filter(Boolean)
                      .map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">
                          {moduleLabel(m)}
                        </Badge>
                      ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Chưa được cấp module nào
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setDialog({ open: true, user: u })}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                disabled={u.id === currentUserId}
                onClick={() => setDeleting(u)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
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
