"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote,
  ExternalLink,
  Landmark,
  LineChart,
  MoreVertical,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatUSD, formatVND, formatAmountInput } from "@/lib/format";
import { WALLET_TYPE_LABELS, type WalletType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WalletFormDialog, type WalletDTO } from "./wallet-form";

const TYPE_ICONS: Record<WalletType, typeof Banknote> = {
  CASH: Banknote,
  BANK: Landmark,
  EWALLET: Smartphone,
  INVEST: LineChart,
};

export function WalletList({ wallets }: { wallets: WalletDTO[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WalletDTO | null>(null);
  const [deleting, setDeleting] = useState<WalletDTO | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/wallets/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Đã xóa ví "${deleting.name}"`);
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
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="size-4" /> Thêm ví
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map((w) => {
          const Icon = TYPE_ICONS[w.type as WalletType] ?? Banknote;
          return (
            <Card key={w.id} className="gap-3">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium leading-tight">{w.name}</div>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {WALLET_TYPE_LABELS[w.type as WalletType] ?? w.type}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(w)}>
                      <Pencil className="size-4" /> Sửa
                    </DropdownMenuItem>
                    {w.url && (
                      <DropdownMenuItem asChild>
                        <a href={w.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" /> Mở link
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(w)}
                    >
                      <Trash2 className="size-4" /> Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    w.balance < 0 && "text-red-600"
                  )}
                >
                  {formatVND(w.balance)}
                </div>
                {w.type === "INVEST" && (
                  <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {formatUSD(w.balanceUSD ?? 0)} × tỷ giá{" "}
                    {formatAmountInput(w.exchangeRate ?? 0) || "0"}
                  </div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {w.transactionCount} giao dịch
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <WalletFormDialog
        open={creating || !!editing}
        wallet={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ví &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.transactionCount > 0
                ? `Ví này còn ${deleting.transactionCount} giao dịch liên quan — tất cả sẽ bị xóa theo. Hành động không thể hoàn tác.`
                : "Ví chưa có giao dịch nào. Hành động không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa ví
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
