import type { Metadata } from "next";
import { TrendingUp, Sparkles } from "lucide-react";
import { MarketsView } from "@/components/markets/markets-view";

export const metadata: Metadata = {
  title: "Giá Vàng & Bitcoin Hôm Nay - Biểu Đồ Trực Tiếp",
  description: "Theo dõi trực tiếp biểu đồ giá Vàng (XAU/USD) thế giới, quy đổi VNĐ và giá Bitcoin (BTC/USDT) theo thời gian thực",
};

export default async function MarketsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b-2 border-[#1C1917] pb-4 dark:border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
                Thị Trường Tài Chính
              </h1>
              <p className="text-xs font-semibold text-muted-foreground">
                Biểu đồ nến kỹ thuật & giá Vàng (XAU/USD) - Bitcoin (BTC/USDT) thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="rounded-xs border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary shadow-neo-sm">
              <Sparkles className="mr-1 inline-block size-3.5" />
              Công khai 24/7
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Market Views */}
      <MarketsView />
    </div>
  );
}
