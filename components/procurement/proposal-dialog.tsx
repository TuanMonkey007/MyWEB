"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/format";
import { useCan, NO_PERM } from "@/components/permissions-provider";

export type ProposalDTO = {
  id: string;
  number: number;
  title: string | null;
  proposedAt: string;
  notes: string | null;
};

export function ProposalDialog({
  budgetYearId,
  proposal = null,
  open,
  onClose,
  nextNumber,
}: {
  budgetYearId: string;
  proposal?: ProposalDTO | null;
  open: boolean;
  onClose: () => void;
  nextNumber?: number;
}) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNumber(proposal ? String(proposal.number) : String(nextNumber ?? ""));
    setDate(toDateInputValue(proposal?.proposedAt ?? new Date()));
    setTitle(proposal?.title ?? "");
    setNotes(proposal?.notes ?? "");
  }, [open, proposal, nextNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        proposal ? `/api/proposals/${proposal.id}` : "/api/proposals",
        {
          method: proposal ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetYearId,
            number: Number(number) || undefined,
            proposedAt: new Date(`${date}T00:00:00`).toISOString(),
            title,
            notes,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Lưu thất bại");
      }
      const saved = await res.json();
      toast.success(proposal ? "Đã cập nhật đợt đề xuất" : "Đã tạo đợt đề xuất");
      onClose();
      if (proposal) router.refresh();
      else router.push(`/procurement/proposals/${saved.id}`);
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
          <DialogTitle>
            {proposal ? `Sửa đợt đề xuất số ${proposal.number}` : "Tạo đợt đề xuất mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pr-number">Đợt số</Label>
              <Input
                id="pr-number"
                type="number"
                min="1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr-date">Ngày đề xuất</Label>
              <Input
                id="pr-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-title">Tiêu đề (tùy chọn)</Label>
            <Input
              id="pr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="vd: Đề xuất mua hàng tháng 7"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="pr-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Đang lưu..." : proposal ? "Cập nhật" : "Tạo đợt"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewProposalButton({
  budgetYearId,
  nextNumber,
}: {
  budgetYearId: string;
  nextNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const canCreate = useCan()("procurement", "create");
  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!canCreate}
        title={canCreate ? undefined : NO_PERM}
      >
        <Plus className="size-4" /> Tạo đợt đề xuất
      </Button>
      <ProposalDialog
        budgetYearId={budgetYearId}
        open={open}
        onClose={() => setOpen(false)}
        nextNumber={nextNumber}
      />
    </>
  );
}
