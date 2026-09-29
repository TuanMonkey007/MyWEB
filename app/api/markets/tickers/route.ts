import { NextResponse } from "next/server";

export const revalidate = 20; // Cache 20s

export async function GET() {
  try {
    // 1. Fetch Bitcoin ticker from Binance
    const btcPromise = fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
      { next: { revalidate: 15 } }
    )
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    // 2. Fetch Gold price from gold-api.com
    const goldPromise = fetch("https://api.gold-api.com/price/XAU", {
      next: { revalidate: 30 },
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    // 3. Fetch USD/VND rate
    const fxPromise = fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    const [btcData, goldData, fxData] = await Promise.all([
      btcPromise,
      goldPromise,
      fxPromise,
    ]);

    const usdVnd = Number(fxData?.rates?.VND) || 25450;

    // BTC Calculations
    const btcPrice = btcData ? Number(btcData.lastPrice) : null;
    const btcChangePercent = btcData
      ? Number(btcData.priceChangePercent)
      : null;
    const btcHigh = btcData ? Number(btcData.highPrice) : null;
    const btcLow = btcData ? Number(btcData.lowPrice) : null;
    const btcVolume = btcData ? Number(btcData.volume) : null;

    // Gold Calculations
    // 1 troy oz = 31.1034768 grams, 1 lượng (cây) = 37.5 grams = 1.205653 oz
    const goldPriceUsd = goldData?.price ? Number(goldData.price) : null;
    let goldVndPerLuong: number | null = null;
    if (goldPriceUsd) {
      goldVndPerLuong = Math.round(goldPriceUsd * 1.205653 * usdVnd);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      usdVnd,
      btc: {
        price: btcPrice,
        change24h: btcChangePercent,
        high24h: btcHigh,
        low24h: btcLow,
        volume: btcVolume,
        symbol: "BTCUSDT",
      },
      gold: {
        priceUsd: goldPriceUsd,
        priceVndLuong: goldVndPerLuong, // Giá thế giới quy đổi (VNĐ/lượng)
        unit: "USD/oz",
        updatedAt: goldData?.updatedAt ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market data", details: String(error) },
      { status: 500 }
    );
  }
}
