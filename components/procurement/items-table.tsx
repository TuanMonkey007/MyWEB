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
    return <Badge className="bg-emerald-600 text-white">Đã mua</Badge>;
  if (status === "CANCELLED") return <Badge variant="secondary">Huỷ</Badge>;
  return <Badge className="bg-amber-500 text-white">Chờ mua</Badge>;
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
        <h2 className="font-medium">Hạng mục ({items.length})</h2>
        <Button
          size="sm"
          disabled={!canCreate}
          title={canCreate ? undefined : NO_PERM}
          onClick={() => {
            setSelected(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Thêm hạng mục
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có hạng mục nào trong đợt này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead className="min-w-52">Nội dung</TableHead>
                <TableHead className="hidden lg:table-cell">Quỹ</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Đề xuất</TableHead>
                <TableHead className="text-right">Thực tế (VAT)</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow
                  key={it.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelected(it);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="whitespace-pre-line">{it.name}</span>
                      {it.attachments.length > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                          <Paperclip className="size-3.5" />
                          {it.attachments.length}
                        </span>
                      )}
                    </div>
                    {it.reason && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{it.reason}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell">
                    {fundName(it.fundId)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVND(it.proposedAmount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      it.status === "PURCHASED" && "font-medium"
                    )}
                  >
                    {it.actualAmount != null ? formatVND(it.actualAmount) : "—"}
                  </TableCell>
                  <TableCell>
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
