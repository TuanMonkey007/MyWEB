"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";

interface TradingViewTechnicalProps {
  symbol: string;
  interval?: string;
  height?: number | string;
}

function TradingViewTechnicalComponent({
  symbol,
  interval = "1D",
  height = 420,
}: TradingViewTechnicalProps) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval,
      width: "100%",
      isTransparent: true,
      height: "100%",
      symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "vi_VN",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, interval, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}

export const TradingViewTechnical = memo(TradingViewTechnicalComponent);
