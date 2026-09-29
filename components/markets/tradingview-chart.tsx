"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  height?: number | string;
  allowSymbolChange?: boolean;
}

function TradingViewChartComponent({
  symbol,
  interval = "D",
  height = 560,
  allowSymbolChange = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Asia/Ho_Chi_Minh",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1", // 1 = Candlestick
      locale: "vi_VN",
      enable_publishing: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      hide_volume: false,
      hide_side_toolbar: false,
      support_host: "https://www.tradingview.com",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, interval, resolvedTheme, allowSymbolChange]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
