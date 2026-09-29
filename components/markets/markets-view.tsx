"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  LayoutGrid,
  Maximize2,
  Gauge,
  Info,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TradingViewChart } from "./tradingview-chart";
import { TradingViewTechnical } from "./tradingview-technical";
import { TradingViewTickerTape } from "./tradingview-ticker-tape";
import {
  MarketOverviewCards,
  type MarketTickerData,
} from "./market-overview-cards";

type ViewTab = "split" | "gold" | "btc" | "technical";

export function MarketsView({
  initialTickerData,
}: {
  initialTickerData?: MarketTickerData | null;
}) {
  const [activeTab, setActiveTab] = useState<ViewTab>("split");
  const [tickerData, setTickerData] = useState<MarketTickerData | null>(
    initialTickerData ?? null
  );
  const [loading, setLoading] = useState(false);

  const fetchTickers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/markets/tickers");
      if (res.ok) {
        const json = await res.json();
        setTickerData(json);
      }
    } catch {
      // silently handle, ticker card displays fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialTickerData) {
      fetchTickers();
    }
    const timer = setInterval(fetchTickers, 30000); // Auto-refresh 30s
    return () => clearInterval(timer);
  }, [fetchTickers, initialTickerData]);

  return (
    <div className="space-y-6">
      {/* 1. Top Ticker Tape Streamer */}
      <TradingViewTickerTape />

      {/* 2. Real-time Price Metric Cards */}
      <MarketOverviewCards
        data={tickerData}
        loading={loading}
        onRefresh={fetchTickers}
      />

      {/* 3. Navigation View Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1C1917] pb-3 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("split")}
            className={cn(
              "cursor-pointer rounded-xs border-2 text-xs font-black uppercase tracking-wider transition-all",
              activeTab === "split"
                ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm dark:border-white/80"
                : "border-[#1C1917] bg-white text-stone-700 hover:bg-stone-100 shadow-neo-sm dark:bg-card dark:border-white/80 dark:text-stone-300"
            )}
          >
            <LayoutGrid className="mr-1.5 size-3.5" />
            Xem song song
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("gold")}
            className={cn(
              "cursor-pointer rounded-xs border-2 text-xs font-black uppercase tracking-wider transition-all",
              activeTab === "gold"
                ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm dark:border-white/80"
                : "border-[#1C1917] bg-white text-stone-700 hover:bg-stone-100 shadow-neo-sm dark:bg-card dark:border-white/80 dark:text-stone-300"
            )}
          >
            <Coins className="mr-1.5 size-3.5 text-amber-500" />
            Vàng (XAU/USD)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("btc")}
            className={cn(
              "cursor-pointer rounded-xs border-2 text-xs font-black uppercase tracking-wider transition-all",
              activeTab === "btc"
                ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm dark:border-white/80"
                : "border-[#1C1917] bg-white text-stone-700 hover:bg-stone-100 shadow-neo-sm dark:bg-card dark:border-white/80 dark:text-stone-300"
            )}
          >
            <span className="mr-1.5 font-mono text-sm text-orange-500 font-bold">
              ₿
            </span>
            Bitcoin (BTC/USDT)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("technical")}
            className={cn(
              "cursor-pointer rounded-xs border-2 text-xs font-black uppercase tracking-wider transition-all",
              activeTab === "technical"
                ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm dark:border-white/80"
                : "border-[#1C1917] bg-white text-stone-700 hover:bg-stone-100 shadow-neo-sm dark:bg-card dark:border-white/80 dark:text-stone-300"
            )}
          >
            <Gauge className="mr-1.5 size-3.5" />
            Đồng hồ kỹ thuật
          </Button>
        </div>

        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Info className="size-3.5 text-stone-500" />
          <span>Biểu đồ tương tác đầy đủ công cụ kỹ thuật</span>
        </div>
      </div>

      {/* 4. Chart Views according to Tab */}

      {/* TAB 1: SPLIT VIEW (Song song 2 biểu đồ) */}
      {activeTab === "split" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Gold Chart */}
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                <span className="font-editorial text-base font-bold text-foreground">
                  Biểu Đồ Vàng (XAU/USD)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("gold")}
                className="h-7 text-xs font-bold"
              >
                <Maximize2 className="mr-1 size-3" />
                Phóng to
              </Button>
            </div>
            <TradingViewChart
              symbol="OANDA:XAUUSD"
              height={580}
              interval="D"
            />
          </div>

          {/* Right: Bitcoin Chart */}
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-orange-500">
                  ₿
                </span>
                <span className="font-editorial text-base font-bold text-foreground">
                  Biểu Đồ Bitcoin (BTC/USDT)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("btc")}
                className="h-7 text-xs font-bold"
              >
                <Maximize2 className="mr-1 size-3" />
                Phóng to
              </Button>
            </div>
            <TradingViewChart
              symbol="BINANCE:BTCUSDT"
              height={580}
              interval="D"
            />
          </div>
        </div>
      )}

      {/* TAB 2: GOLD FOCUS (Toàn màn hình Vàng + Phân tích kỹ thuật) */}
      {activeTab === "gold" && (
        <div className="space-y-6">
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-2 flex items-center justify-between border-b-2 border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                <span className="font-editorial text-lg font-bold text-foreground">
                  Vàng Giao Ngay Thế Giới (XAU/USD) - Đa khung thời gian
                </span>
              </div>
            </div>
            <TradingViewChart
              symbol="OANDA:XAUUSD"
              height={650}
              interval="D"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo dark:border-white/80 dark:bg-card">
              <div className="mb-3 flex items-center gap-2 border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
                <Gauge className="size-4 text-primary" />
                <h4 className="font-editorial text-base font-bold">
                  Đồng Hồ Đo Xu Hướng Kỹ Thuật (XAU/USD)
                </h4>
              </div>
              <TradingViewTechnical symbol="OANDA:XAUUSD" height={420} />
            </div>

            <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:border-white/80 dark:bg-card">
              <div>
                <h4 className="font-editorial text-lg font-bold text-foreground">
                  Thông Tin Cần Biết Về Giá Vàng
                </h4>
                <div className="mt-3 space-y-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  <p>
                    <strong>Tỷ giá & Đơn vị đo lường:</strong> 1 Troy Ounce (oz)
                    tương đương <strong>31.1035 grams</strong>. Một lượng vàng
                    Việt Nam (cây vàng) tương đương <strong>37.5 grams</strong>{" "}
                    hay xấp xỉ <strong>1.20565 troy ounce</strong>.
                  </p>
                  <p>
                    <strong>Chênh lệch giá vàng nội địa & thế giới:</strong> Giá
                    vàng miếng SJC và vàng nhẫn 9999 tại Việt Nam thường có mức
                    chênh lệch nhất định so với giá thế giới quy đổi do chi phí
                    nhập khẩu, gia công, thuế phí và cung cầu thị trường trong
                    nước.
                  </p>
                  <p>
                    <strong>Các yếu tố tác động mạnh:</strong> Lãi suất của Cục
                    Dự trữ Liên bang Mỹ (Fed), chỉ số sức mạnh đồng USD (DXY),
                    lạm phát toàn cầu và căng thẳng địa chính trị.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xs border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <span className="font-bold">Mẹo:</span> Bạn có thể đổi khung
                thời gian (15m, 1h, 4h, 1D, 1W) hoặc bấm vào góc biểu đồ để thêm
                các đường MA, RSI, MACD trực tiếp trên TradingView.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BITCOIN FOCUS (Toàn màn hình BTC + Phân tích kỹ thuật) */}
      {activeTab === "btc" && (
        <div className="space-y-6">
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-2 flex items-center justify-between border-b-2 border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-orange-500">
                  ₿
                </span>
                <span className="font-editorial text-lg font-bold text-foreground">
                  Bitcoin (BTC/USDT) - Dữ liệu sàn Binance
                </span>
              </div>
            </div>
            <TradingViewChart
              symbol="BINANCE:BTCUSDT"
              height={650}
              interval="D"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo dark:border-white/80 dark:bg-card">
              <div className="mb-3 flex items-center gap-2 border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
                <Gauge className="size-4 text-primary" />
                <h4 className="font-editorial text-base font-bold">
                  Đồng Hồ Đo Xu Hướng Kỹ Thuật (BTC/USDT)
                </h4>
              </div>
              <TradingViewTechnical symbol="BINANCE:BTCUSDT" height={420} />
            </div>

            <div className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:border-white/80 dark:bg-card">
              <div>
                <h4 className="font-editorial text-lg font-bold text-foreground">
                  Thông Tin Trọng Yếu Về Bitcoin
                </h4>
                <div className="mt-3 space-y-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  <p>
                    <strong>Cặp giao dịch phổ biến:</strong> BTC/USDT trên sàn
                    Binance là cặp giao dịch có thanh khoản và khối lượng lớn
                    nhất toàn cầu, phản ánh sát nhất nhịp đập của thị trường tiền
                    mã hóa.
                  </p>
                  <p>
                    <strong>Chu kỳ thị trường (Halving):</strong> Cứ mỗi 210,000
                    khối (khoảng 4 năm một lần), phần thưởng khối cho thợ đào
                    Bitcoin giảm đi một nửa, thường tạo nên chu kỳ biến động lớn.
                  </p>
                  <p>
                    <strong>Tính tương quan:</strong> Bitcoin thường được ví như
                    &quot;Vàng kỹ thuật số&quot; (Digital Gold) do giới hạn tổng cung tối
                    đa là 21 triệu đồng coin và khả năng lưu chuyển phi tập
                    trung.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xs border border-orange-300 bg-orange-50 p-3 text-xs text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300">
                <span className="font-bold">Lưu ý:</span> Thị trường Crypto hoạt
                động 24/7 không có ngày nghỉ lễ hay đóng phiên cuối tuần như thị
                trường vàng truyền thống.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICAL ANALYSIS COMPARISON */}
      {activeTab === "technical" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                <h3 className="font-editorial text-base font-bold">
                  Phân Tích Kỹ Thuật Vàng (XAU/USD)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                OANDA:XAUUSD
              </span>
            </div>
            <TradingViewTechnical symbol="OANDA:XAUUSD" height={450} />
          </div>

          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:border-white/80 dark:bg-card">
            <div className="mb-3 flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-orange-500">
                  ₿
                </span>
                <h3 className="font-editorial text-base font-bold">
                  Phân Tích Kỹ Thuật Bitcoin (BTC/USDT)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                BINANCE:BTCUSDT
              </span>
            </div>
            <TradingViewTechnical symbol="BINANCE:BTCUSDT" height={450} />
          </div>
        </div>
      )}
    </div>
  );
}
