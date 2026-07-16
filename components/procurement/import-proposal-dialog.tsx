"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCan, NO_PERM } from "@/components/permissions-provider";

type FundOpt = { id: string; name: string; groupCode: string };
type ParsedItem = {
  name: string;
  unit: string | null;
  quantity: number;
  specs: string | null;
  reason: string | null;
  notes: string | null;
  fundName: string;
  fundId: string | null;
  amountRaw: number;
};

export function ImportProposalButton({ budgetYearId }: { budgetYearId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [funds, setFunds] = useState<FundOpt[]>([]);
  const [proposedAt, setProposedAt] = useState<string | null>(null);
  const [unit, setUnit] = useState<"million" | "dong">("million");
  const [fileName, setFileName] = useState("");
  const canCreate = useCan()("procurement", "create");

  const multiplier = unit === "million" ? 1_000_000 : 1;

  function reset() {
    setItems([]);
    setFunds([]);
    setProposedAt(null);
    setFileName("");
    setUnit("million");
  }

  async function parse(file: File) {
    setParsing(true);
    try {
      const res = await fetch(
        `/api/proposals/import/parse?budgetYearId=${encodeURIComponent(budgetYearId)}`,
        { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Đọc file thất bại");
      setItems(data.items);
      setFunds(data.funds);
      setProposedAt(data.proposedAt);
      setFileName(file.name);
      const unmatched = data.items.length - data.matchedCount;
      toast.success(
        `Đọc được ${data.items.length} hạng mục` +
          (unmatched ? ` · ${unmatched} hạng mục chưa khớp quỹ` : " · tất cả đã khớp quỹ")
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đọc file thất bại");
    } finally {
      setParsing(false);
    }
  }

  async function create() {
    if (items.some((it) => !it.fundId)) {
      toast.error("Còn hạng mục chưa chọn quỹ");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/proposals/import/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetYearId,
          proposedAt,
          items: items.map((it) => ({
            name: it.name,
            unit: it.unit,
            quantity: it.quantity,
            specs: it.specs,
            reason: it.reason,
            notes: it.notes,
            fundId: it.fundId,
            proposedAmount: Math.round(it.amountRaw * multiplier),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Tạo đợt thất bại");
      toast.success("Đã tạo đợt đề xuất từ file");
      setOpen(false);
      reset();
      router.push(`/procurement/proposals/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tạo đợt thất bại");
    } finally {
      setCreating(false);
    }
  }

  const unmatched = items.filter((it) => !it.fundId).length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!canCreate}
        title={canCreate ? undefined : NO_PERM}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <FileUp className="size-4" /> Nhập từ Excel
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nhập đợt đề xuất từ file Excel</DialogTitle>
          </DialogHeader>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) parse(e.target.files[0]);
              e.target.value = "";
            }}
          />

          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-center hover:border-primary hover:bg-primary/5"
            >
              {parsing ? (
                <>
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Đang đọc file...</span>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm">Chọn file phiếu đề xuất (.xlsx) đã điền</span>
                  <span className="text-xs text-muted-foreground">
                    Hệ thống đọc các hạng mục và khớp nguồn ngân sách theo tên quỹ
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{fileName}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {items.length} hạng mục
                    {unmatched > 0 && (
                      <span className="text-amber-600"> · {unmatched} chưa khớp quỹ</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Đơn vị cột dự trù</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as "million" | "dong")}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="million">Triệu đồng</SelectItem>
                      <SelectItem value="dong">Đồng (VNĐ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead className="min-w-40">Nội dung</TableHead>
                      <TableHead className="w-12 text-right">SL</TableHead>
                      <TableHead className="min-w-52">Nguồn ngân sách (quỹ)</TableHead>
                      <TableHead className="text-right">Dự trù</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, i) => (
                      <TableRow key={i} className={cn(!it.fundId && "bg-amber-500/5")}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{it.name}</div>
                          {it.reason && (
                            <div className="text-xs text-muted-foreground">{it.reason}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                        <TableCell>
                          <Select
                            value={it.fundId ?? ""}
                            onValueChange={(v) =>
                              setItems((arr) =>
                                arr.map((x, xi) => (xi === i ? { ...x, fundId: v } : x))
                              )
                            }
                          >
                            <SelectTrigger className={cn("h-8 w-full", !it.fundId && "border-amber-500")}>
                              <SelectValue placeholder="Chọn quỹ..." />
                            </SelectTrigger>
                            <SelectContent>
                              {funds.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.groupCode} · {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!it.fundId && it.fundName && (
                            <div className="mt-0.5 text-[11px] text-amber-600">
                              File ghi: &quot;{it.fundName}&quot;
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatVND(Math.round(it.amountRaw * multiplier))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Tổng dự trù:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatVND(items.reduce((s, it) => s + Math.round(it.amountRaw * multiplier), 0))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => reset()}>
                    Chọn file khác
                  </Button>
                  <Button onClick={create} disabled={creating || unmatched > 0}>
                    {creating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Đang tạo...
                      </>
                    ) : (
                      <>Tạo đợt ({items.length} hạng mục)</>
                    )}
                  </Button>
                </div>
              </div>
              {unmatched > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    {unmatched}
                  </Badge>
                  hạng mục chưa khớp quỹ — chọn quỹ cho các dòng nền vàng trước khi tạo.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
