"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCan, NO_PERM } from "@/components/permissions-provider";
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
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/money-input";
import { formatVND } from "@/lib/format";

export type FundNode = {
  id: string;
  name: string;
  months: number[];
  notes: string | null;
  itemCount: number;
};

export type GroupNode = {
  id: string;
  code: string;
  name: string;
  funds: FundNode[];
};

// ===== Năm ngân sách =====
export function NewYearButton({
  currentYearId,
  currentYearLabel,
}: {
  currentYearId: string | null;
  currentYearLabel: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [title, setTitle] = useState("");
  const [copyStructure, setCopyStructure] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/budget-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(year),
          title,
          copyFromId: copyStructure && currentYearId ? currentYearId : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Tạo thất bại");
      }
      const created = await res.json();
      toast.success(`Đã tạo năm ngân sách ${created.year}`);
      setOpen(false);
      router.replace(`/procurement/budget?year=${created.year}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Thêm năm
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo năm ngân sách mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="y-year">Năm</Label>
              <Input
                id="y-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-title">Tiêu đề (tùy chọn)</Label>
              <Input
                id="y-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="vd: Kế hoạch ngân sách CNTT 2027"
              />
            </div>
            {currentYearId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={copyStructure}
                  onChange={(e) => setCopyStructure(e.target.checked)}
                  className="size-4"
                />
                Sao chép cấu trúc nhóm/quỹ từ {currentYearLabel} (số tiền để 0)
              </label>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo năm"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Nhóm khoản mục =====
function GroupDialog({
  budgetYearId,
  group,
  open,
  onClose,
}: {
  budgetYearId: string;
  group: GroupNode | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(group?.code ?? "");
    setName(group?.name ?? "");
  }, [open, group]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        group ? `/api/budget-groups/${group.id}` : "/api/budget-groups",
        {
          method: group ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ budgetYearId, code, name }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(group ? "Đã cập nhật nhóm" : "Đã thêm nhóm");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Sửa nhóm khoản mục" : "Thêm nhóm khoản mục"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="g-code">Mã</Label>
              <Input
                id="g-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-name">Tên nhóm</Label>
              <Input
                id="g-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: Chi phí Vận hành hạ tầng IT"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Đang lưu..." : group ? "Cập nhật" : "Thêm nhóm"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== Quỹ với phân bổ 12 tháng =====
function FundDialog({
  groupId,
  fund,
  open,
  onClose,
}: {
  groupId: string;
  fund: FundNode | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [months, setMonths] = useState<number[]>(Array(12).fill(0));
  const [quickTotal, setQuickTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(fund?.name ?? "");
    setMonths(fund?.months ?? Array(12).fill(0));
    setQuickTotal(0);
  }, [open, fund]);

  const total = months.reduce((s, v) => s + v, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nhập tên quỹ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(fund ? `/api/budget-funds/${fund.id}` : "/api/budget-funds", {
        method: fund ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, name, months }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      toast.success(fund ? "Đã cập nhật quỹ" : "Đã thêm quỹ");
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
          <DialogTitle>{fund ? "Sửa quỹ" : "Thêm quỹ"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="f-name">Tên quỹ (khoản mục chi phí)</Label>
            <Input
              id="f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Sửa chữa, thay thế thiết bị IT"
              autoFocus={!fund}
            />
          </div>

          <div className="space-y-2">
            <Label>Nhập nhanh phân bổ</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <MoneyInput value={quickTotal} onChange={setQuickTotal} placeholder="Tổng năm" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const per = Math.round(quickTotal / 12);
                  const spread = Array(12).fill(per);
                  spread[11] = quickTotal - per * 11; // dồn phần lẻ vào T12
                  setMonths(spread);
                }}
              >
                Chia đều 12 tháng
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phân bổ từng tháng (VNĐ)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {months.map((v, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-xs text-muted-foreground">Tháng {i + 1}</span>
                  <MoneyInput
                    value={v}
                    onChange={(nv) =>
                      setMonths((m) => m.map((x, xi) => (xi === i ? nv : x)))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-right text-sm">
              Tổng năm: <span className="font-semibold tabular-nums">{formatVND(total)}</span>
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Đang lưu..." : fund ? "Cập nhật" : "Thêm quỹ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== Cây nhóm → quỹ =====
export function BudgetManager({
  budgetYearId,
  groups,
}: {
  budgetYearId: string;
  groups: GroupNode[];
}) {
  const router = useRouter();
  const canBudget = useCan()("procurement", "budget");
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group: GroupNode | null }>({
    open: false,
    group: null,
  });
  const [fundDialog, setFundDialog] = useState<{
    open: boolean;
    groupId: string;
    fund: FundNode | null;
  }>({ open: false, groupId: "", fund: null });
  const [deleting, setDeleting] = useState<
    | { kind: "group"; node: GroupNode }
    | { kind: "fund"; node: FundNode }
    | null
  >(null);

  async function handleDelete() {
    if (!deleting) return;
    const url =
      deleting.kind === "group"
        ? `/api/budget-groups/${deleting.node.id}`
        : `/api/budget-funds/${deleting.node.id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!canBudget}
          title={canBudget ? undefined : NO_PERM}
          onClick={() => setGroupDialog({ open: true, group: null })}
        >
          <FolderPlus className="size-4" /> Thêm nhóm
        </Button>
      </div>

      {groups.map((g) => (
        <Card key={g.id} className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {g.code}. {g.name}
            </CardTitle>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={!canBudget}
                title={canBudget ? undefined : NO_PERM}
                onClick={() => setFundDialog({ open: true, groupId: g.id, fund: null })}
              >
                <Plus className="size-4" /> Quỹ
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={!canBudget}
                title={canBudget ? undefined : NO_PERM}
                onClick={() => setGroupDialog({ open: true, group: g })}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                disabled={!canBudget}
                title={canBudget ? undefined : NO_PERM}
                onClick={() => setDeleting({ kind: "group", node: g })}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {g.funds.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có quỹ trong nhóm.</p>
            ) : (
              <ul className="divide-y">
                {g.funds.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1">{f.name}</span>
                    {f.itemCount > 0 && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {f.itemCount} hạng mục
                      </Badge>
                    )}
                    <span className="w-32 shrink-0 text-right font-medium tabular-nums">
                      {formatVND(f.months.reduce((s, v) => s + v, 0))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={!canBudget}
                      title={canBudget ? undefined : NO_PERM}
                      onClick={() => setFundDialog({ open: true, groupId: g.id, fund: f })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      disabled={!canBudget}
                      title={canBudget ? undefined : NO_PERM}
                      onClick={() => setDeleting({ kind: "fund", node: f })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      <GroupDialog
        budgetYearId={budgetYearId}
        group={groupDialog.group}
        open={groupDialog.open}
        onClose={() => setGroupDialog({ open: false, group: null })}
      />
      <FundDialog
        groupId={fundDialog.groupId}
        fund={fundDialog.fund}
        open={fundDialog.open}
        onClose={() => setFundDialog({ open: false, groupId: "", fund: null })}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa {deleting?.kind === "group" ? "nhóm" : "quỹ"} &quot;
              {deleting?.kind === "group"
                ? (deleting.node as GroupNode).name
                : (deleting?.node as FundNode)?.name}
              &quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Chỉ xóa được khi không còn hạng mục đề xuất tham chiếu. Không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
