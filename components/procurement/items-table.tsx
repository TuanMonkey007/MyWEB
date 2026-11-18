"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, GripVertical, Loader2, Paperclip, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ItemDialog, type FundOption, type ItemDTO } from "./item-dialog";
import { InheritItemsButton } from "./inherit-items-dialog";
import { useCan, NO_PERM } from "@/components/permissions-provider";

export function ItemStatusBadge({ status }: { status: string }) {
  if (status === "PURCHASED")
    return (
      <Badge variant="success">
        Đã mua
      </Badge>
    );
  if (status === "CANCELLED") return <Badge variant="secondary">Huỷ</Badge>;
  return (
    <Badge variant="warning">
      Chờ mua
    </Badge>
  );
}

export function ItemsTable({
  items,
  proposalId,
  fundOptions,
}: {
  items: ItemDTO[];
  proposalId: string;
  fundOptions: FundOption[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ItemDTO | null>(null);
  const router = useRouter();
  const can = useCan();
  const canCreate = can("procurement", "create");
  const canEdit = can("procurement", "edit");

  // Chế độ sắp xếp: kéo thả (máy tính) hoặc nút lên/xuống (điện thoại), bấm Lưu mới ghi DB
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const sorting = order !== null;
  const byId = new Map(items.map((it) => [it.id, it]));
  const rows = sorting ? order.map((id) => byId.get(id)).filter((x): x is ItemDTO => !!x) : items;
  const changed = sorting && order.some((id, i) => id !== items[i]?.id);

  function move(id: string, to: number) {
    setOrder((prev) => {
      if (!prev) return prev;
      const from = prev.indexOf(id);
      if (from < 0 || to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, id);
      return next;
    });
  }

  async function saveOrder() {
    if (!order) return;
    if (!changed) {
      setOrder(null);
      return;
    }
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: order }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Lưu thứ tự thất bại");
      toast.success("Đã lưu thứ tự hạng mục");
      setOrder(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thứ tự thất bại");
    } finally {
      setSavingOrder(false);
    }
  }

  const fundName = (id: string) => fundOptions.find((f) => f.id === id)?.name ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-editorial text-lg font-bold uppercase tracking-tight text-foreground">
          Hạng mục chi tiết ({items.length})
        </h2>
        {sorting ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
              Kéo thả dòng hoặc dùng nút ↑ ↓
            </span>
            <Button size="sm" variant="outline" onClick={() => setOrder(null)} disabled={savingOrder}>
              <X className="size-3.5" /> Huỷ
            </Button>
            <Button size="sm" onClick={saveOrder} disabled={savingOrder}>
              {savingOrder ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Lưu thứ tự
            </Button>
          </div>
        ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {items.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              disabled={!canEdit}
              title={canEdit ? "Đổi thứ tự hạng mục (áp dụng cho cả phiếu xuất)" : NO_PERM}
              onClick={() => setOrder(items.map((it) => it.id))}
            >
              <ArrowUpDown className="size-3.5" /> Sắp xếp
            </Button>
          )}
          <InheritItemsButton proposalId={proposalId} fundOptions={fundOptions} />
          <Button
            size="sm"
            disabled={!canCreate}
            title={canCreate ? undefined : NO_PERM}
            onClick={() => {
              setSelected(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Thêm hạng mục
          </Button>
        </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-12 text-center text-sm font-semibold text-muted-foreground shadow-neo dark:bg-card">
          Chưa có hạng mục nào trong đợt này.
          <span className="text-xs font-medium">
            Mua lại hàng của tháng trước? Kế thừa để khỏi nhập lại từ đầu.
          </span>
          <InheritItemsButton proposalId={proposalId} fundOptions={fundOptions} variant="default" />
        </div>
      ) : (
        <div
          className={cn(
            "overflow-x-auto rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card",
            sorting && "ring-2 ring-[#F25C2B] ring-offset-2 ring-offset-background"
          )}
        >
          <Table className="border-0 shadow-none">
            <TableHeader>
              <TableRow className="border-b-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#2C1F15]">
                <TableHead className="w-10 py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">#</TableHead>
                <TableHead className="min-w-52 py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">Nội dung</TableHead>
                <TableHead className="hidden lg:table-cell py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">Quỹ</TableHead>
                <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">SL</TableHead>
                <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">Đề xuất</TableHead>
                <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">Thực tế (VAT)</TableHead>
                <TableHead className="py-2.5 px-3.5 text-xs font-black uppercase text-[#1C1917] dark:text-[#FAF7F0]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y-2 divide-border/60">
              {rows.map((it, i) => (
                <TableRow
                  key={it.id}
                  draggable={sorting}
                  onDragStart={(e) => {
                    if (!sorting) return;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", it.id); // Firefox cần có dữ liệu mới cho kéo
                    setDragId(it.id);
                  }}
                  onDragOver={(e) => {
                    if (!sorting || !dragId) return;
                    e.preventDefault();
                    if (dragId !== it.id) move(dragId, i);
                  }}
                  onDrop={(e) => e.preventDefault()}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "transition-colors",
                    sorting
                      ? "cursor-grab active:cursor-grabbing hover:bg-[#FDF1EA] dark:hover:bg-[#2C1F15]"
                      : "cursor-pointer hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15]",
                    dragId === it.id && "bg-[#FDF1EA] opacity-60 dark:bg-[#2C1F15]"
                  )}
                  onClick={() => {
                    if (sorting) return;
                    setSelected(it);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell className="text-muted-foreground font-bold py-2 px-3.5 text-xs border-r-2 border-[#1C1917]">
                    {sorting ? (
                      <div className="flex items-center gap-1">
                        <GripVertical className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                        <span className="w-4 text-center tabular-nums">{i + 1}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            aria-label={`Đưa "${it.name}" lên`}
                            disabled={i === 0}
                            onClick={() => move(it.id, i - 1)}
                            className="rounded-xs p-0.5 hover:bg-muted disabled:opacity-25"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Đưa "${it.name}" xuống`}
                            disabled={i === rows.length - 1}
                            onClick={() => move(it.id, i + 1)}
                            className="rounded-xs p-0.5 hover:bg-muted disabled:opacity-25"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      i + 1
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3.5 text-xs border-r-2 border-[#1C1917]">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className="whitespace-pre-line">{it.name}</span>
                      {it.attachments.length > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-muted-foreground">
                          <Paperclip className="size-3.5" />
                          {it.attachments.length}
                        </span>
                      )}
                    </div>
                    {it.reason && (
                      <div className="mt-0.5 text-xs font-medium text-muted-foreground">{it.reason}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground font-semibold lg:table-cell py-2 px-3.5 text-xs border-r-2 border-[#1C1917]">
                    {fundName(it.fundId)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums py-2 px-3.5 text-xs font-bold border-r-2 border-[#1C1917]">{it.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums py-2 px-3.5 text-xs font-bold text-foreground border-r-2 border-[#1C1917]">
                    {formatVND(it.proposedAmount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums py-2 px-3.5 text-xs font-black border-r-2 border-[#1C1917]",
                      it.status === "PURCHASED" ? "text-[#F25C2B]" : "text-muted-foreground"
                    )}
                  >
                    {it.actualAmount != null ? formatVND(it.actualAmount) : "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3.5">
                    <ItemStatusBadge status={it.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        proposalId={proposalId}
        item={selected}
        fundOptions={fundOptions}
      />
    </div>
  );
}
