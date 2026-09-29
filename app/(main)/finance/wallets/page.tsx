import { getWalletsWithBalances, getTotalAssets } from "@/lib/balance";
import { formatVND } from "@/lib/format";
import { WalletList } from "@/components/wallets/wallet-list";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  const [wallets, totalAssets] = await Promise.all([
    getWalletsWithBalances(),
    getTotalAssets(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-sm border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          Ví tiền & Nguồn vốn
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
          Tổng tài sản khả dụng:{" "}
          <span className="font-editorial text-lg sm:text-xl font-bold text-[#F25C2B] tabular-nums">
            {formatVND(totalAssets)}
          </span>
        </p>
      </div>

      <WalletList
        wallets={wallets.map((w) => ({
          id: w.id,
          name: w.name,
          type: w.type,
          initialBalance: w.initialBalance,
          balanceUSD: w.balanceUSD,
          exchangeRate: w.exchangeRate,
          adjustment: w.adjustment,
          notes: w.notes,
          url: w.url,
          balance: w.balance,
          transactionCount: w.transactionCount,
        }))}
      />
    </div>
  );
}
