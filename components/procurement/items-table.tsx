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
  const canCreate = useCan()("procurement", "create");

  const fundName = (id: string) => fundOptions.find((f) => f.id === id)?.name ?? "?";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-lg font-bold uppercase tracking-tight text-foreground">
          Hạng mục chi tiết ({items.length})
        </h2>
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
        <div className="rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-12 text-center text-sm font-semibold text-muted-foreground shadow-neo dark:bg-card">
          Chưa có hạng mục nào trong đợt này.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
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
              {items.map((it, i) => (
                <TableRow
                  key={it.id}
                  className="cursor-pointer hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15] transition-colors"
                  onClick={() => {
                    setSelected(it);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell className="text-muted-foreground font-bold py-2 px-3.5 text-xs border-r-2 border-[#1C1917]">{i + 1}</TableCell>
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
