"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";

function TradingViewTickerTapeComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "OANDA:XAUUSD", title: "Vàng (XAU/USD)" },
        { proName: "BINANCE:BTCUSDT", title: "Bitcoin (BTC)" },
        { proName: "BINANCE:ETHUSDT", title: "Ethereum (ETH)" },
        { proName: "FX_IDC:USDVND", title: "USD/VND" },
        { proName: "INDEX:DXY", title: "DXY Index" },
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      locale: "vi_VN",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = "";
    };
  }, [resolvedTheme]);

  return (
    <div className="w-full overflow-hidden rounded-xs border-2 border-[#1C1917] bg-white shadow-neo-sm dark:border-stone-800 dark:bg-card">
      <div ref={containerRef} className="h-[46px] w-full" />
    </div>
  );
}

export const TradingViewTickerTape = memo(TradingViewTickerTapeComponent);
