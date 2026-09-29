import Link from "next/link";
import { Suspense } from "react";
import { FileText, Paperclip } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { resolveBudgetYear } from "@/lib/procurement";
import { formatDate, formatVND } from "@/lib/format";
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
import { YearSelect } from "@/components/procurement/year-select";
import { NewProposalButton } from "@/components/procurement/proposal-dialog";
import { ImportProposalButton } from "@/components/procurement/import-proposal-dialog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const { years, selected } = await resolveBudgetYear(yearParam);

  if (!selected) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-card py-20 text-center">
        <FileText className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Chưa có năm ngân sách — thiết lập ngân sách trước khi tạo đề xuất.
        </p>
        <Button asChild size="sm">
          <Link href="/procurement/budget">Thiết lập ngân sách</Link>
        </Button>
      </div>
    );
  }

  const proposals = await prisma.proposal.findMany({
    where: { budgetYearId: selected.id },
    orderBy: { number: "desc" },
    include: {
      items: { select: { status: true, proposedAmount: true, actualAmount: true } },
      _count: { select: { attachments: true } },
    },
  });
  const nextNumber = (proposals[0]?.number ?? 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Đợt đề xuất mua hàng
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Năm {selected.year} · {proposals.length} đợt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <YearSelect years={years.map((y) => y.year)} selectedYear={selected.year} />
          </Suspense>
          <ImportProposalButton budgetYearId={selected.id} />
          <NewProposalButton budgetYearId={selected.id} nextNumber={nextNumber} />
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Chưa có đợt đề xuất nào trong năm {selected.year}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <TableHead className="w-20 py-2.5 px-3">Đợt số</TableHead>
                <TableHead className="w-28 py-2.5 px-3">Ngày</TableHead>
                <TableHead className="py-2.5 px-3">Hạng mục</TableHead>
                <TableHead className="text-right py-2.5 px-3">Tổng đề xuất</TableHead>
                <TableHead className="text-right py-2.5 px-3">Đã chi (VAT)</TableHead>
                <TableHead className="w-40 py-2.5 px-3">Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {proposals.map((p) => {
                const active = p.items.filter((i) => i.status !== "CANCELLED");
                const purchased = p.items.filter((i) => i.status === "PURCHASED");
                const pending = p.items.filter((i) => i.status === "PENDING");
                const totalProposed = active.reduce((s, i) => s + i.proposedAmount, 0);
                const totalActual = purchased.reduce(
                  (s, i) => s + (i.actualAmount ?? 0),
                  0
                );
                return (
                  <TableRow key={p.id} className="relative cursor-pointer hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold py-2.5 px-3 text-xs">
                      <Link
                        href={`/procurement/proposals/${p.id}`}
                        className="after:absolute after:inset-0 text-primary hover:underline font-bold"
                      >
                        #{p.number}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground py-2.5 px-3 text-xs">
                      {formatDate(p.proposedAt)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-xs">
                      <span className="font-medium text-foreground">{p.items.length} hạng mục</span>
                      {p.title && (
                        <span className="text-muted-foreground"> · {p.title}</span>
                      )}
                      {p._count.attachments > 0 && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Paperclip className="size-3" />
                          {p._count.attachments}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums py-2.5 px-3 text-xs font-medium text-foreground">
                      {formatVND(totalProposed)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums py-2.5 px-3 text-xs text-primary">
                      {formatVND(totalActual)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {purchased.length > 0 && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            {purchased.length} đã mua
                          </Badge>
                        )}
                        {pending.length > 0 && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                            {pending.length} chờ
                          </Badge>
                        )}
                        {p.items.length - active.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {p.items.length - active.length} huỷ
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
