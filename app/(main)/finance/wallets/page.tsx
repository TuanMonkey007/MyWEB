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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Ví tiền</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tổng tài sản:{" "}
          <span className="font-semibold text-foreground tabular-nums">
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
