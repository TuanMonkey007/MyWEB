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
      <div className="flex flex-col items-center gap-4 rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-20 text-center shadow-neo dark:bg-card">
        <FileText className="size-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-muted-foreground">
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
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo flex flex-wrap items-center justify-between gap-4 dark:bg-card">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            Đợt đề xuất mua hàng
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Năm {selected.year} · {proposals.length} đợt đề xuất trong năm
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
        <div className="rounded-sm border-2 border-dashed border-[#1C1917] bg-white py-16 text-center text-sm font-semibold text-muted-foreground dark:bg-card">
          Chưa có đợt đề xuất nào trong năm {selected.year}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card">
          <Table className="border-0 shadow-none">
            <TableHeader>
              <TableRow className="border-b-2 border-[#1C1917] bg-[#F5EFEB] dark:bg-[#2C1F15]">
                <TableHead className="w-20 py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Đợt số</TableHead>
                <TableHead className="w-28 py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Ngày</TableHead>
                <TableHead className="py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Hạng mục</TableHead>
                <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Tổng đề xuất</TableHead>
                <TableHead className="text-right py-2.5 px-3.5 border-r-2 border-[#1C1917] text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Đã chi (VAT)</TableHead>
                <TableHead className="w-40 py-2.5 px-3.5 text-xs font-black uppercase tracking-wider text-[#1C1917] dark:text-[#FAF7F0]">Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y-2 divide-border/60">
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
                  <TableRow key={p.id} className="relative cursor-pointer hover:bg-[#FAF7F0] dark:hover:bg-[#2C1F15] transition-colors">
                    <TableCell className="font-bold py-2.5 px-3.5 text-xs border-r-2 border-[#1C1917]">
                      <Link
                        href={`/procurement/proposals/${p.id}`}
                        className="after:absolute after:inset-0 text-[#F25C2B] hover:underline font-black"
                      >
                        #{p.number}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground font-semibold py-2.5 px-3.5 text-xs border-r-2 border-[#1C1917]">
                      {formatDate(p.proposedAt)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3.5 text-xs border-r-2 border-[#1C1917]">
                      <span className="font-bold text-foreground">{p.items.length} hạng mục</span>
                      {p.title && (
                        <span className="text-muted-foreground font-medium"> · {p.title}</span>
                      )}
                      {p._count.attachments > 0 && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
                          <Paperclip className="size-3" />
                          {p._count.attachments}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums py-2.5 px-3.5 text-xs font-bold text-foreground border-r-2 border-[#1C1917]">
                      {formatVND(totalProposed)}
                    </TableCell>
                    <TableCell className="text-right font-black tabular-nums py-2.5 px-3.5 text-xs text-[#F25C2B] border-r-2 border-[#1C1917]">
                      {formatVND(totalActual)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {purchased.length > 0 && (
                          <Badge variant="success">
                            {purchased.length} đã mua
                          </Badge>
                        )}
                        {pending.length > 0 && (
                          <Badge variant="warning">
                            {pending.length} chờ
                          </Badge>
                        )}
                        {p.items.length - active.length > 0 && (
                          <Badge variant="secondary">
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
