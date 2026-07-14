import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFundOptions } from "@/lib/procurement";
import { formatDate, formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AttachmentList } from "@/components/procurement/attachment-list";
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
    <div className="space-y-4">
      <Link
        href="/procurement/proposals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Các đợt đề xuất
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Đợt đề xuất #{proposal.number} — {formatDate(proposal.proposedAt)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Năm ngân sách {proposal.budgetYear.year}
            {proposal.title ? ` · ${proposal.title}` : ""}
          </p>
        </div>
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

      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Tổng tiền đề xuất</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatVND(totalProposed)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Đã chi thực tế (VAT)</div>
              <div className="text-lg font-semibold tabular-nums text-primary">
                {formatVND(totalActual)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hạng mục</div>
              <div className="text-lg font-semibold tabular-nums">
                {proposal.items.length}
              </div>
            </div>
          </div>
          {proposal.notes && (
            <p className="text-sm text-muted-foreground">{proposal.notes}</p>
          )}
          <Separator />
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
