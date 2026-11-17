"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatDate, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ItemStatusBadge } from "./items-table";

export type FundTarget = {
  title: string;
  subtitle: string;
  fundIds: string[];
  total: number;
  spent: number;
  pending: number;
  remaining: number;
};

type Item = {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  status: string;
  proposedAmount: number;
  actualAmount: number | null;
  notes: string | null;
  fund: { id: string; name: string };
  proposal: {
    id: string;
    number: number;
    title: string | null;
    proposedAt: string;
  };
};

// Số tiền tính vào quỹ — khớp cách tính trên bảng ngân sách:
// Đã mua lấy tiền thực tế (chưa nhập thì lấy tiền đề xuất), Chờ mua lấy tiền đề xuất
function amountOf(it: Item): number {
  if (it.status === "PURCHASED") return it.actualAmount ?? it.proposedAmount;
  return it.proposedAmount;
}

export function FundItemsSheet({
  target,
  onOpenChange,
}: {
  target: FundTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!target} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl gap-0 p-0"
      >
        {/* key theo quỹ: mở quỹ khác là dựng lại từ đầu, state cũ không lẫn sang */}
        {target && <SheetBody key={target.fundIds.join(",")} target={target} />}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ target }: { target: FundTarget }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const key = target.fundIds.join(",");

  useEffect(() => {
    let alive = true;
    fetch(`/api/proposal-items?fundIds=${encodeURIComponent(key)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Không tải được danh sách");
        if (alive) setItems(data);
      })
      .catch(
        (e) =>
          alive && setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"),
      );
    return () => {
      alive = false;
    };
  }, [key]);

  const multiFund = target.fundIds.length > 1;
  const cancelledCount =
    items?.filter((i) => i.status === "CANCELLED").length ?? 0;

  // Gom theo đợt đề xuất, đợt cũ trước
  const batches = useMemo(() => {
    const visible = (items ?? []).filter(
      (i) => showCancelled || i.status !== "CANCELLED",
    );
    const map = new Map<
      string,
      { proposal: Item["proposal"]; items: Item[] }
    >();
    for (const it of visible) {
      const b = map.get(it.proposal.id) ?? { proposal: it.proposal, items: [] };
      b.items.push(it);
      map.set(it.proposal.id, b);
    }
    return [...map.values()];
  }, [items, showCancelled]);

  return (
    <>
      <SheetHeader className="border-b-2 border-[#1C1917] bg-[#FAF7F0] p-5 pr-12 dark:bg-[#22170F]">
        <SheetDescription className="text-xs font-bold uppercase tracking-wider">
          {target.subtitle}
        </SheetDescription>
        <SheetTitle className="font-editorial text-xl font-bold leading-snug">
          {target.title}
        </SheetTitle>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Tổng quỹ" value={target.total} />
          <Stat label="Đã chi" value={target.spent} cls="text-primary" />
          <Stat label="Chờ mua" value={target.pending} cls="text-[#E65100]" />
          <Stat
            label="Còn lại"
            value={target.remaining}
            cls={
              target.remaining < 0
                ? "text-destructive"
                : "text-emerald-700 dark:text-emerald-400"
            }
          />
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {error ? (
          <p className="rounded-sm border-2 border-destructive p-4 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : items === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm font-semibold text-muted-foreground">
            Chưa có đề xuất nào dùng {multiFund ? "nhóm" : "quỹ"} này.
          </p>
        ) : (
          <div className="space-y-4">
            {cancelledCount > 0 && (
              <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3.5 accent-[#F25C2B]"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                />
                Hiện cả {cancelledCount} mục đã huỷ
              </label>
            )}

            {batches.length === 0 && (
              <p className="py-10 text-center text-sm font-semibold text-muted-foreground">
                Chỉ có các mục đã huỷ.
              </p>
            )}

            {batches.map(({ proposal, items: list }) => {
              const sum = list
                .filter((i) => i.status !== "CANCELLED")
                .reduce((s, i) => s + amountOf(i), 0);
              return (
                <section
                  key={proposal.id}
                  className="overflow-hidden rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card"
                >
                  <Link
                    href={`/procurement/proposals/${proposal.id}`}
                    className="group flex items-center justify-between gap-3 border-b-2 border-[#1C1917] bg-[#F5EFEB] px-3.5 py-2 hover:bg-[#EDE3DB] dark:bg-[#2C1F15] dark:hover:bg-[#3A2A1D]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black">
                        Đợt {proposal.number}
                        <span className="font-semibold text-muted-foreground">
                          {" "}
                          · {formatDate(proposal.proposedAt)}
                        </span>
                      </div>
                      {proposal.title && (
                        <div className="truncate text-xs font-semibold text-muted-foreground">
                          {proposal.title}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-sm font-black tabular-nums">
                      {formatVND(sum)}
                      <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </Link>
                  <ul className="divide-y divide-border">
                    {list.map((it) => {
                      const cancelled = it.status === "CANCELLED";
                      const differs =
                        it.status === "PURCHASED" &&
                        it.actualAmount != null &&
                        it.actualAmount !== it.proposedAmount;
                      return (
                        <li
                          key={it.id}
                          className="flex items-start gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "text-sm font-semibold",
                                cancelled &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {it.name}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              SL {it.quantity.toLocaleString("vi-VN")}
                              {it.unit ? ` ${it.unit}` : ""}
                              {multiFund && <> · {it.fund.name}</>}
                              {it.notes && <> · {it.notes}</>}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                cancelled &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {formatVND(amountOf(it))}
                            </span>
                            {differs && (
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                ĐX {formatVND(it.proposedAmount)}
                              </span>
                            )}
                            <ItemStatusBadge status={it.status} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls?: string;
}) {
  return (
    <div className="rounded-sm border-2 border-[#1C1917] bg-white px-2.5 py-1.5 dark:bg-card">
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-sm font-black tabular-nums", cls)}>
        {formatVND(value)}
      </div>
    </div>
  );
}
