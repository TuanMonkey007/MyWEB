"use client";

import { useState } from "react";
import { Paperclip, Plus } from "lucide-react";
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
import { useCan, NO_PERM } from "@/components/permissions-provider";

export function ItemStatusBadge({ status }: { status: string }) {
  if (status === "PURCHASED")
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
        Đã mua
      </Badge>
    );
  if (status === "CANCELLED") return <Badge variant="secondary" className="text-[10px]">Huỷ</Badge>;
  return (
    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
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
  const canCreate = useCan()("procurement", "create");

  const fundName = (id: string) => fundOptions.find((f) => f.id === id)?.name ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Hạng mục ({items.length})</h2>
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

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
          Chưa có hạng mục nào trong đợt này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <TableHead className="w-8 py-2 px-3">#</TableHead>
                <TableHead className="min-w-52 py-2 px-3">Nội dung</TableHead>
                <TableHead className="hidden lg:table-cell py-2 px-3">Quỹ</TableHead>
                <TableHead className="text-right py-2 px-3">SL</TableHead>
                <TableHead className="text-right py-2 px-3">Đề xuất</TableHead>
                <TableHead className="text-right py-2 px-3">Thực tế (VAT)</TableHead>
                <TableHead className="py-2 px-3">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {items.map((it, i) => (
                <TableRow
                  key={it.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => {
                    setSelected(it);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell className="text-muted-foreground py-2 px-3 text-xs">{i + 1}</TableCell>
                  <TableCell className="py-2 px-3 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span className="whitespace-pre-line">{it.name}</span>
                      {it.attachments.length > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                          <Paperclip className="size-3.5" />
                          {it.attachments.length}
                        </span>
                      )}
                    </div>
                    {it.reason && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{it.reason}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell py-2 px-3 text-xs">
                    {fundName(it.fundId)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums py-2 px-3 text-xs">{it.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums py-2 px-3 text-xs font-medium text-foreground">
                    {formatVND(it.proposedAmount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums py-2 px-3 text-xs",
                      it.status === "PURCHASED" ? "font-semibold text-primary" : "text-muted-foreground"
                    )}
                  >
                    {it.actualAmount != null ? formatVND(it.actualAmount) : "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3">
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
