export const WALLET_TYPES = ["CASH", "BANK", "EWALLET", "INVEST"] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  CASH: "Tiền mặt",
  BANK: "Ngân hàng",
  EWALLET: "Ví điện tử",
  INVEST: "Đầu tư",
};

export const CATEGORY_KINDS = ["EXPENSE", "INCOME"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export type TransactionType = "expense" | "income" | "transfer";

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Khoản chi",
  income: "Khoản thu",
  transfer: "Chuyển khoản",
};

// Dòng gộp cho danh sách giao dịch (FR-6)
export type TransactionRow = {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  occurredAt: string;
  imagePath: string | null;
  categoryId: string | null;
  categoryName: string | null;
  walletId: string | null; // ví chi/thu
  walletName: string | null;
  fromWalletId: string | null; // chỉ transfer
  fromWalletName: string | null;
  toWalletId: string | null;
  toWalletName: string | null;
};
