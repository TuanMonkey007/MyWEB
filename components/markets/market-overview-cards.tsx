"use client";

import React from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Scale,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MarketTickerData {
  timestamp: string;
  usdVnd: number;
  btc: {
    price: number | null;
    change24h: number | null;
    high24h: number | null;
    low24h: number | null;
    volume: number | null;
    symbol: string;
  };
  gold: {
    priceUsd: number | null;
    priceVndLuong: number | null;
    unit: string;
    updatedAt: string | null;
  };
}

interface MarketOverviewCardsProps {
  data: MarketTickerData | null;
  loading: boolean;
  onRefresh: () => void;
}

export function MarketOverviewCards({
  data,
  loading,
  onRefresh,
}: MarketOverviewCardsProps) {
  const btcChange = data?.btc?.change24h ?? 0;
  const isBtcPositive = btcChange >= 0;

  const formatUsd = (val?: number | null, decimals = 2) => {
    if (val === null || val === undefined) return "---";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatVnd = (val?: number | null) => {
    if (!val) return "---";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-3">
      {/* Header Bar with Live Indicator and Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Dữ liệu Trực tiếp (Live)</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Tự động cập nhật mỗi 30 giây
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="border-2 border-[#1C1917] bg-white text-xs font-bold shadow-neo-sm hover:bg-stone-100 dark:bg-card dark:border-white/80"
        >
          <RefreshCw
            className={cn("mr-1.5 size-3.5", loading && "animate-spin")}
          />
          Làm mới
        </Button>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Gold */}
        <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo transition-all dark:border-white/80 dark:bg-card">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-amber-400 text-stone-900 shadow-neo-sm dark:border-white/80">
                  <Coins className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Vàng Thế Giới
                  </h3>
                  <span className="font-mono text-xs font-bold text-stone-500">
                    XAU / USD
                  </span>
                </div>
              </div>
              <span className="rounded-xs border border-amber-500/40 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                Giao ngay (Spot)
              </span>
            </div>

            <div className="mt-3">
              <div className="font-mono text-2xl font-black text-foreground sm:text-3xl">
                {formatUsd(data?.gold?.priceUsd, 2)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Đơn vị:</span>
                <span className="font-semibold text-foreground">
                  USD / Troy Ounce (oz)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-[#1C1917]/20 pt-3 dark:border-white/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quy đổi thế giới:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {formatVnd(data?.gold?.priceVndLuong)} / lượng
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground italic">
              * (1 lượng = 1.20565 oz &times; tỷ giá USD/VND, chưa tính thuế/phí)
            </p>
          </div>
        </div>

        {/* Card 2: Bitcoin */}
        <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo transition-all dark:border-white/80 dark:bg-card">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-orange-500 text-white shadow-neo-sm dark:border-white/80">
                  <span className="font-mono text-base font-black">₿</span>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Bitcoin
                  </h3>
                  <span className="font-mono text-xs font-bold text-stone-500">
                    BTC / USDT (Binance)
                  </span>
                </div>
              </div>
              {data?.btc?.change24h !== null && (
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-xs border px-2 py-0.5 text-xs font-bold",
                    isBtcPositive
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                  )}
                >
                  {isBtcPositive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  <span>
                    {isBtcPositive ? "+" : ""}
                    {btcChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="font-mono text-2xl font-black text-foreground sm:text-3xl">
                {formatUsd(data?.btc?.price, 2)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Quy đổi VNĐ:</span>
                <span className="font-mono font-bold text-foreground">
                  {data?.btc?.price && data?.usdVnd
                    ? formatVnd(Math.round(data.btc.price * data.usdVnd))
                    : "---"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-[#1C1917]/20 pt-3 dark:border-white/20">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Đỉnh 24h:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatUsd(data?.btc?.high24h, 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Đáy 24h:
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatUsd(data?.btc?.low24h, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Exchange Rate & Macro Indicators */}
        <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo transition-all dark:border-white/80 dark:bg-card">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-blue-500 text-white shadow-neo-sm dark:border-white/80">
                  <DollarSign className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Tỷ Giá & Vĩ Mô
                  </h3>
                  <span className="font-mono text-xs font-bold text-stone-500">
                    USD / VND
                  </span>
                </div>
              </div>
              <span className="rounded-xs border border-blue-500/40 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                Liên ngân hàng
              </span>
            </div>

            <div className="mt-3">
              <div className="font-mono text-2xl font-black text-foreground sm:text-3xl">
                {data?.usdVnd
                  ? `${Math.round(data.usdVnd).toLocaleString("vi-VN")} ₫`
                  : "---"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Scale className="size-3.5 text-stone-500" />
                <span>Quy chuẩn tính giá vàng & tài sản</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-[#1C1917]/20 pt-3 dark:border-white/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Vàng SJC tham khảo:</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                ~88.5 - 90.5 tr/lượng
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Vàng nhẫn 9999:</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                ~87.5 - 89.5 tr/lượng
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
