"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  BarChart3,
  Search,
  X,
  Coins,
  Flame,
  Globe,
  DollarSign,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TradingViewChart } from "./tradingview-chart";
import { cn } from "@/lib/utils";

export interface CustomChartConfig {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  interval?: string;
}

const PRESET_OPTIONS: CustomChartConfig[] = [
  {
    id: "silver",
    name: "Bạc Thế Giới (Silver - XAG/USD)",
    symbol: "TVC:SILVER",
    category: "Kim loại quý",
  },
  {
    id: "oil",
    name: "Dầu Thô WTI (Crude Oil)",
    symbol: "TVC:USOIL",
    category: "Năng lượng",
  },
  {
    id: "eth",
    name: "Ethereum (ETH/USDT)",
    symbol: "BINANCE:ETHUSDT",
    category: "Tiền mã hóa",
  },
  {
    id: "sol",
    name: "Solana (SOL/USDT)",
    symbol: "BINANCE:SOLUSDT",
    category: "Tiền mã hóa",
  },
  {
    id: "dxy",
    name: "Chỉ Số Đô La Mỹ (DXY Index)",
    symbol: "INDEX:DXY",
    category: "Chỉ số tiền tệ",
  },
  {
    id: "usdvnd",
    name: "Tỷ Giá USD / VND",
    symbol: "FX_IDC:USDVND",
    category: "Ngoại hối",
  },
  {
    id: "sp500",
    name: "Chỉ Số S&P 500 (Hoa Kỳ)",
    symbol: "FOREXCOM:SPXUSD",
    category: "Chứng khoán Mỹ",
  },
  {
    id: "vnindex",
    name: "Chỉ Số VN-Index (Việt Nam)",
    symbol: "INDEX:VNINDEX",
    category: "Chứng khoán VN",
  },
  {
    id: "nvda",
    name: "Cổ Phiếu NVIDIA (NVDA)",
    symbol: "NASDAQ:NVDA",
    category: "Cổ phiếu Công nghệ",
  },
  {
    id: "tsla",
    name: "Cổ Phiếu Tesla (TSLA)",
    symbol: "NASDAQ:TSLA",
    category: "Cổ phiếu Công nghệ",
  },
];

const STORAGE_KEY = "hnf_added_market_charts_v1";

export function AdditionalChartsSection() {
  const [charts, setCharts] = useState<CustomChartConfig[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customSymbolInput, setCustomSymbolInput] = useState("");
  const [customNameInput, setCustomNameInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Load saved charts from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCharts(parsed);
          return;
        }
      }
    } catch {
      // fallback to empty
    }
  }, []);

  // Save to localStorage whenever charts change
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
    } catch {
      // ignore
    }
  }, [charts, isMounted]);

  const addChart = (item: CustomChartConfig) => {
    // If already added, don't duplicate
    if (charts.some((c) => c.symbol === item.symbol)) {
      setIsDropdownOpen(false);
      return;
    }
    const newCharts = [
      ...charts,
      { ...item, id: `${item.id}-${Date.now()}`, interval: "D" },
    ];
    setCharts(newCharts);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const removeChart = (chartId: string) => {
    setCharts(charts.filter((c) => c.id !== chartId));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbolInput.trim()) return;
    const symbol = customSymbolInput.trim().toUpperCase();
    const name = customNameInput.trim() || symbol;
    addChart({
      id: `custom-${Date.now()}`,
      name,
      symbol,
      category: "Tự nhập",
      interval: "D",
    });
    setCustomSymbolInput("");
    setCustomNameInput("");
  };

  const changeInterval = (chartId: string, newInterval: string) => {
    setCharts(
      charts.map((c) =>
        c.id === chartId ? { ...c, interval: newInterval } : c
      )
    );
  };

  const filteredPresets = PRESET_OPTIONS.filter((p) => {
    const isAlready = charts.some((c) => c.symbol === p.symbol);
    if (isAlready) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.symbol.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mt-8 space-y-6 border-t-2 border-[#1C1917] pt-8 dark:border-stone-800">
      {/* Section Header with Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <h3 className="font-editorial text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
              Xem Thêm Biểu Đồ Khác
            </h3>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            Bấm chọn để thêm biểu đồ Bạc, Dầu thô, Ethereum, VN-Index, DXY, S&P 500 hoặc nhập mã tùy ý
          </p>
        </div>

        <div className="relative">
          <Button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="cursor-pointer gap-2 border-2 border-[#1C1917] bg-primary font-black uppercase tracking-wider text-primary-foreground shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Thêm biểu đồ khác</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )}
            />
          </Button>

          {/* Dropdown Menu Modal */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xs border-2 border-[#1C1917] bg-white p-4 shadow-neo-lg dark:border-white/80 dark:bg-card">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#1C1917]/20 dark:border-white/20">
                <span className="font-editorial text-sm font-bold uppercase text-foreground">
                  Chọn Biểu Đồ Cần Xem
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="rounded-xs p-1 hover:bg-stone-100 text-stone-600 dark:hover:bg-stone-800 dark:text-stone-300"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm: Bạc, Dầu, ETH, DXY..."
                  className="h-8 pl-8 text-xs font-semibold"
                />
              </div>

              {/* Preset List */}
              <div className="mt-3 max-h-56 overflow-y-auto space-y-1 pr-1">
                {filteredPresets.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy biểu đồ phù hợp
                  </p>
                ) : (
                  filteredPresets.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => addChart(item)}
                      className="group flex w-full cursor-pointer items-center justify-between rounded-xs border border-transparent px-2.5 py-1.5 text-left text-xs transition-colors hover:border-[#1C1917] hover:bg-[#FAF7F0] dark:hover:bg-stone-800 dark:hover:border-white/40"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-bold text-foreground group-hover:text-primary">
                          {item.name}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {item.symbol} {item.category && `· ${item.category}`}
                        </div>
                      </div>
                      <Plus className="size-4 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>

              {/* Custom Symbol Form */}
              <div className="mt-3 border-t-2 border-dashed border-[#1C1917]/20 pt-3 dark:border-white/20">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Hoặc nhập mã bất kỳ (TradingView):
                </span>
                <form onSubmit={handleAddCustom} className="flex gap-2">
                  <Input
                    value={customSymbolInput}
                    onChange={(e) => setCustomSymbolInput(e.target.value)}
                    placeholder="vd: BINANCE:ETHUSDT, NASDAQ:AAPL"
                    className="h-8 text-xs font-mono font-semibold uppercase"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 shrink-0 text-xs font-bold"
                  >
                    Thêm
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Active Additional Charts */}
      {charts.length === 0 ? (
        <div className="rounded-xs border-2 border-dashed border-[#1C1917]/30 bg-white/50 p-8 text-center dark:border-white/30 dark:bg-card/50">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] text-primary shadow-neo-sm dark:bg-[#22170F]">
            <TrendingUp className="size-6" />
          </div>
          <h4 className="mt-3 font-editorial text-lg font-bold text-foreground">
            Chưa có biểu đồ bổ sung nào
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Bấm vào nút <strong>&quot;Thêm biểu đồ khác&quot;</strong> ở trên để xem thêm giá Bạc, Dầu thô WTI, Ethereum, VN-Index, Tỷ giá USD/VND hoặc bất kỳ mã tài chính nào bạn muốn.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {PRESET_OPTIONS.slice(0, 4).map((preset) => (
              <Button
                key={preset.symbol}
                variant="outline"
                size="sm"
                onClick={() => addChart(preset)}
                className="gap-1 border-2 border-[#1C1917] bg-white text-xs font-bold shadow-neo-sm hover:bg-stone-100 dark:bg-card dark:border-white/80"
              >
                <Plus className="size-3 text-primary" />
                <span>{preset.name.split(" ")[0]}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="flex flex-col justify-between rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:border-white/80 dark:bg-card"
            >
              {/* Chart Box Header */}
              <div className="mb-2 flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-2 dark:border-white/20">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    <h4 className="truncate font-editorial text-base font-bold text-foreground">
                      {chart.name}
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {chart.symbol}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Timeframe selector */}
                  <div className="flex items-center rounded-xs border border-[#1C1917] bg-stone-100 p-0.5 text-xs font-bold dark:border-white/40 dark:bg-stone-800">
                    {["15", "60", "D", "W"].map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => changeInterval(chart.id, tf)}
                        className={cn(
                          "cursor-pointer px-1.5 py-0.5 rounded-xs transition-colors",
                          (chart.interval ?? "D") === tf
                            ? "bg-primary text-primary-foreground font-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tf === "15" ? "15m" : tf === "60" ? "1h" : tf}
                      </button>
                    ))}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeChart(chart.id)}
                    title="Xóa biểu đồ này"
                    className="h-7 w-7 p-0 border-2 border-[#1C1917] text-destructive hover:bg-destructive/10 shadow-neo-sm dark:border-white/80"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* TradingView Chart Frame */}
              <div className="min-h-[500px] w-full">
                <TradingViewChart
                  symbol={chart.symbol}
                  height={520}
                  interval={chart.interval ?? "D"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
