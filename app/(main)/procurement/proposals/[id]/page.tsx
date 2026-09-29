import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFundOptions } from "@/lib/procurement";
import { formatDate, formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AttachmentList } from "@/components/procurement/attachment-list";
import { ExportMenu } from "@/components/procurement/export-menu";
import { ItemsTable } from "@/components/procurement/items-table";
import { ProposalActions } from "@/components/procurement/proposal-actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProposalDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      budgetYear: true,
      attachments: { orderBy: { createdAt: "asc" } },
      items: {
        orderBy: { createdAt: "asc" },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!proposal) notFound();

  const fundOptions = await getFundOptions(proposal.budgetYearId);

  const active = proposal.items.filter((i) => i.status !== "CANCELLED");
  const totalProposed = active.reduce((s, i) => s + i.proposedAmount, 0);
  const totalActual = proposal.items
    .filter((i) => i.status === "PURCHASED")
    .reduce((s, i) => s + (i.actualAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/procurement/proposals"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-[#1C1917] px-2 py-1 rounded-xs transition-all"
      >
        <ArrowLeft className="size-4" /> Các đợt đề xuất
      </Link>

      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-start justify-between gap-4 dark:bg-card">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Đợt đề xuất #{proposal.number} — {formatDate(proposal.proposedAt)}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            Năm ngân sách {proposal.budgetYear.year}
            {proposal.title ? ` · ${proposal.title}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu proposalId={proposal.id} />
          <ProposalActions
            proposal={{
              id: proposal.id,
              number: proposal.number,
              title: proposal.title,
              proposedAt: proposal.proposedAt.toISOString(),
              notes: proposal.notes,
            }}
            budgetYearId={proposal.budgetYearId}
            itemCount={proposal.items.length}
          />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-3.5 shadow-neo-sm dark:bg-card">
              <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Tổng tiền đề xuất</div>
              <div className="font-editorial text-xl font-bold tabular-nums text-foreground mt-1">
                {formatVND(totalProposed)}
              </div>
            </div>
            <div className="rounded-xs border-2 border-[#1C1917] bg-[#FDF1EA] p-3.5 shadow-neo-sm dark:bg-card">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#F25C2B]">Đã chi thực tế (VAT)</div>
              <div className="font-editorial text-xl font-bold tabular-nums text-[#F25C2B] mt-1">
                {formatVND(totalActual)}
              </div>
            </div>
            <div className="rounded-xs border-2 border-[#1C1917] bg-stone-100 p-3.5 shadow-neo-sm dark:bg-stone-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Hạng mục</div>
              <div className="font-editorial text-xl font-bold tabular-nums text-foreground mt-1">
                {proposal.items.length} hạng mục
              </div>
            </div>
          </div>
          {proposal.notes && (
            <p className="text-xs sm:text-sm font-medium text-muted-foreground bg-muted p-3 rounded-xs border border-[#1C1917]">{proposal.notes}</p>
          )}
          <Separator className="border-t-2 border-[#1C1917]" />
          <AttachmentList
            attachments={proposal.attachments.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              mimeType: a.mimeType,
              size: a.size,
            }))}
            proposalId={proposal.id}
          />
        </CardContent>
      </Card>

      <ItemsTable
        proposalId={proposal.id}
        fundOptions={fundOptions}
        items={proposal.items.map((it) => ({
          id: it.id,
          name: it.name,
          fundId: it.fundId,
          unit: it.unit,
          quantity: it.quantity,
          specs: it.specs,
          reason: it.reason,
          status: it.status,
          proposedAmount: it.proposedAmount,
          actualAmount: it.actualAmount,
          purchasedAt: it.purchasedAt?.toISOString() ?? null,
          notes: it.notes,
          attachments: it.attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            mimeType: a.mimeType,
            size: a.size,
          })),
        }))}
      />
    </div>
  );
}
