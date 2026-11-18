"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAmountInput, formatDate, formatVND, parseAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCan, NO_PERM } from "@/components/permissions-provider";
import { ItemStatusBadge } from "./items-table";
import type { FundOption } from "./item-dialog";

type SourceItem = {
  id: string;
  name: string;
  unit: string | null;
  quantity: number;
  specs: string | null;
  reason: string | null;
  status: string;
  proposedAmount: number;
  fundName: string;
  targetFundId: string | null;
  alreadyInTarget: boolean;
};
type Source = {
  id: string;
  number: number;
  title: string | null;
  proposedAt: string;
  year: number;
  items: SourceItem[];
};
type Pick = { quantity: string; amount: string; fundId: string };

const ALL = "__all__";

export function InheritItemsButton({
  proposalId,
  fundOptions,
  variant = "outline",
}: {
  proposalId: string;
  fundOptions: FundOption[];
  variant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const canCreate = useCan()("procurement", "create");
  return (
    <>
      <Button
        size="sm"
        variant={variant}
        disabled={!canCreate}
        title={canCreate ? "Chọn lại mặt hàng đã đề xuất ở các đợt trước" : NO_PERM}
        onClick={() => setOpen(true)}
      >
        <History className="size-3.5" /> Kế thừa từ đợt trước
      </Button>
      {open && (
        <InheritDialog
          proposalId={proposalId}
          fundOptions={fundOptions}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function InheritDialog({
  proposalId,
  fundOptions,
  onClose,
}: {
  proposalId: string;
  fundOptions: FundOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [sources, setSources] = useState<Source[] | null>(null);
  const [sourceId, setSourceId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Component chỉ được dựng lúc mở hộp thoại → tải danh sách một lần
  useEffect(() => {
    let alive = true;
    fetch(`/api/proposals/${proposalId}/inherit`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Không tải được danh sách");
        if (!alive) return;
        setSources(data.sources);
        setSourceId(data.defaultSourceId ?? ALL);
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"));
    return () => {
      alive = false;
    };
  }, [proposalId]);

  // Mặt hàng thuộc quỹ năm khác mà năm nay không có quỹ trùng tên → bắt chọn quỹ
  const fundSelect = (it: SourceItem, pick: Pick, className?: string) => (
    <Select value={pick.fundId} onValueChange={(v) => update(it.id, { fundId: v })}>
      <SelectTrigger
        className={cn("h-8 w-56 max-w-full text-xs", !pick.fundId && "border-destructive", className)}
      >
        <SelectValue placeholder="Chọn quỹ năm nay…" />
      </SelectTrigger>
      <SelectContent>
        {fundOptions.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.groupCode} · {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const itemSource = useMemo(() => {
    const m = new Map<string, Source>();
    for (const s of sources ?? []) for (const it of s.items) m.set(it.id, s);
    return m;
  }, [sources]);

  const allItems = useMemo(() => (sources ?? []).flatMap((s) => s.items), [sources]);

  const visible = useMemo(() => {
    const pool =
      sourceId === ALL ? allItems : (sources ?? []).find((s) => s.id === sourceId)?.items ?? [];
    const q = query.trim().normalize("NFC").toLowerCase();
    return pool.filter(
      (it) =>
        (showPending || it.status === "PURCHASED") &&
        (!q || it.name.normalize("NFC").toLowerCase().includes(q))
    );
  }, [sources, allItems, sourceId, query, showPending]);

  const pendingHidden = useMemo(() => {
    if (showPending) return 0;
    const pool =
      sourceId === ALL ? allItems : (sources ?? []).find((s) => s.id === sourceId)?.items ?? [];
    return pool.filter((it) => it.status !== "PURCHASED").length;
  }, [sources, allItems, sourceId, showPending]);

  const pickedIds = Object.keys(picks);
  const total = pickedIds.reduce((s, id) => s + parseAmountInput(picks[id].amount), 0);
  const missingFund = pickedIds.filter((id) => !picks[id].fundId).length;

  function toggle(it: SourceItem, on: boolean) {
    setPicks((prev) => {
      const next = { ...prev };
      if (on)
        next[it.id] = {
          quantity: String(it.quantity),
          amount: formatAmountInput(it.proposedAmount),
          fundId: it.targetFundId ?? "",
        };
      else delete next[it.id];
      return next;
    });
  }
  const update = (id: string, patch: Partial<Pick>) =>
    setPicks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const allVisiblePicked = visible.length > 0 && visible.every((it) => picks[it.id]);
  function toggleAll() {
    if (allVisiblePicked) {
      setPicks((prev) => {
        const next = { ...prev };
        for (const it of visible) delete next[it.id];
        return next;
      });
    } else {
      for (const it of visible) if (!picks[it.id]) toggle(it, true);
    }
  }

  async function submit() {
    if (pickedIds.length === 0) return;
    if (missingFund) {
      toast.error(`Còn ${missingFund} mặt hàng chưa chọn quỹ`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/inherit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: pickedIds.map((id) => ({
            sourceItemId: id,
            quantity: Number(picks[id].quantity.replace(",", ".")),
            proposedAmount: parseAmountInput(picks[id].amount),
            fundId: picks[id].fundId,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Thêm thất bại");
      toast.success(`Đã thêm ${data.created} mặt hàng vào đợt (trạng thái Chờ mua)`);
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thêm thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-3 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Kế thừa mặt hàng từ đợt trước</DialogTitle>
          <DialogDescription>
            Chọn mặt hàng muốn mua lại. Mặt hàng được thêm vào đợt này ở trạng thái Chờ mua; có thể
            sửa số lượng và tiền đề xuất trước khi thêm.
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="rounded-sm border-2 border-destructive p-4 text-sm font-semibold text-destructive">
            {loadError}
          </p>
        ) : sources === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </div>
        ) : sources.length === 0 ? (
          <p className="py-16 text-center text-sm font-semibold text-muted-foreground">
            Chưa có đợt đề xuất nào khác để kế thừa.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả các đợt</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Đợt {s.number} · {formatDate(s.proposedAt)} · {s.items.length} mặt hàng
                      {s.title ? ` · ${s.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative min-w-48 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên mặt hàng…"
                  className="pl-8"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3.5 accent-[#F25C2B]"
                  checked={showPending}
                  onChange={(e) => setShowPending(e.target.checked)}
                />
                Hiện cả hàng chờ mua{pendingHidden > 0 ? ` (${pendingHidden})` : ""}
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-sm border-2 border-[#1C1917]">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm font-semibold text-muted-foreground">
                  {pendingHidden > 0 && !query.trim() ? (
                    <>
                      Đợt này chưa có mặt hàng nào đã mua.
                      <Button size="sm" variant="outline" onClick={() => setShowPending(true)}>
                        Hiện {pendingHidden} mặt hàng chờ mua
                      </Button>
                    </>
                  ) : (
                    "Không có mặt hàng phù hợp."
                  )}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-[#F5EFEB] dark:bg-[#2C1F15]">
                    <tr className="border-b-2 border-[#1C1917] text-left font-black uppercase tracking-wider">
                      <th className="w-9 px-2.5 py-2">
                        <input
                          type="checkbox"
                          aria-label="Chọn tất cả"
                          className="size-3.5 accent-[#F25C2B]"
                          checked={allVisiblePicked}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="px-2.5 py-2">Mặt hàng</th>
                      <th className="hidden px-2.5 py-2 md:table-cell">Quỹ</th>
                      <th className="w-20 px-2.5 py-2 text-right">SL</th>
                      <th className="w-36 px-2.5 py-2 text-right">Tiền đề xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((it) => {
                      const pick = picks[it.id];
                      const src = itemSource.get(it.id)!;
                      return (
                        <tr
                          key={it.id}
                          className={cn(
                            "align-top transition-colors",
                            pick ? "bg-[#FDF1EA] dark:bg-[#2C1F15]" : "hover:bg-muted/40"
                          )}
                        >
                          <td className="px-2.5 py-2">
                            <input
                              type="checkbox"
                              aria-label={`Chọn ${it.name}`}
                              className="mt-0.5 size-3.5 accent-[#F25C2B]"
                              checked={!!pick}
                              onChange={(e) => toggle(it, e.target.checked)}
                            />
                          </td>
                          <td
                            className="cursor-pointer px-2.5 py-2"
                            onClick={() => toggle(it, !pick)}
                          >
                            <div className="font-bold whitespace-pre-line">{it.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <ItemStatusBadge status={it.status} />
                              {sourceId === ALL && (
                                <span>
                                  Đợt {src.number} · {formatDate(src.proposedAt)}
                                </span>
                              )}
                              {it.unit && <span>ĐVT {it.unit}</span>}
                              {it.alreadyInTarget && (
                                <span className="font-bold text-[#E65100]">Đã có trong đợt này</span>
                              )}
                            </div>
                            {it.specs && (
                              <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                                {it.specs}
                              </div>
                            )}
                            {pick && !it.targetFundId && (
                              <div className="mt-1.5 md:hidden" onClick={(e) => e.stopPropagation()}>
                                {fundSelect(it, pick)}
                              </div>
                            )}
                          </td>
                          <td className="hidden px-2.5 py-2 md:table-cell">
                            {pick && !it.targetFundId ? (
                              fundSelect(it, pick)
                            ) : (
                              <span className="text-muted-foreground">{it.fundName}</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            {pick ? (
                              <Input
                                inputMode="decimal"
                                value={pick.quantity}
                                onChange={(e) => update(it.id, { quantity: e.target.value })}
                                className="h-8 w-16 text-right text-xs"
                              />
                            ) : (
                              <span className="tabular-nums">{it.quantity.toLocaleString("vi-VN")}</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            {pick ? (
                              <Input
                                inputMode="numeric"
                                value={pick.amount}
                                onChange={(e) =>
                                  update(it.id, {
                                    amount: formatAmountInput(parseAmountInput(e.target.value)),
                                  })
                                }
                                className="h-8 w-32 text-right text-xs tabular-nums"
                              />
                            ) : (
                              <span className="font-semibold tabular-nums">
                                {formatVND(it.proposedAmount)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {missingFund > 0 && (
              <p className="text-xs font-semibold text-destructive">
                {missingFund} mặt hàng thuộc quỹ năm khác, năm nay không có quỹ trùng tên — hãy chọn
                quỹ cho các mặt hàng có viền đỏ.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#1C1917] pt-3">
              <div className="text-sm font-semibold">
                Đã chọn <b>{pickedIds.length}</b> mặt hàng · Tổng{" "}
                <b className="tabular-nums">{formatVND(total)}</b>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Huỷ
                </Button>
                <Button size="sm" onClick={submit} disabled={saving || pickedIds.length === 0}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <History className="size-3.5" />}
                  Thêm {pickedIds.length || ""} mặt hàng vào đợt
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
