"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ProposalDialog, type ProposalDTO } from "./proposal-dialog";

export function ProposalActions({
  proposal,
  budgetYearId,
  itemCount,
}: {
  proposal: ProposalDTO;
  budgetYearId: string;
  itemCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
    setConfirmDelete(false);
    if (res.ok) {
      toast.success(`Đã xóa đợt đề xuất số ${proposal.number}`);
      router.push("/procurement/proposals");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Xóa thất bại");
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="size-4" /> Sửa
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" /> Xóa đợt
      </Button>

      <ProposalDialog
        budgetYearId={budgetYearId}
        proposal={proposal}
        open={editing}
        onClose={() => setEditing(false)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đợt đề xuất số {proposal.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemCount > 0
                ? `Toàn bộ ${itemCount} hạng mục và file bằng chứng trong đợt sẽ bị xóa theo. Không thể hoàn tác.`
                : "Đợt chưa có hạng mục nào. Không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa đợt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
