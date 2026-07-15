import { NextResponse } from "next/server";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/procurement";
import {
  TODO_PRIORITIES,
  TODO_STATUSES,
  type TodoPriority,
  type TodoStatus,
} from "@/lib/todos-constants";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Body chung cho Expense/Income (FR-2, FR-3)
export type TransactionBody = {
  title: string;
  amount: number;
  categoryId: string;
  walletId: string;
  occurredAt: Date;
  imagePath: string | null;
};

export function parseTransactionBody(
  body: Record<string, unknown>
): TransactionBody | { error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Tên giao dịch là bắt buộc" };

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Số tiền phải là số dương" };

  if (typeof body.categoryId !== "string" || !body.categoryId)
    return { error: "Danh mục là bắt buộc" };
  if (typeof body.walletId !== "string" || !body.walletId)
    return { error: "Ví là bắt buộc" };

  const occurredAt = new Date(String(body.occurredAt ?? ""));
  if (isNaN(occurredAt.getTime())) return { error: "Ngày không hợp lệ" };

  const imagePath =
    typeof body.imagePath === "string" && body.imagePath ? body.imagePath : null;

  return {
    title,
    amount,
    categoryId: body.categoryId,
    walletId: body.walletId,
    occurredAt,
    imagePath,
  };
}

// Body cho Transfer (FR-4)
export type TransferBody = {
  title: string | null;
  amount: number;
  fromWalletId: string;
  toWalletId: string;
  occurredAt: Date;
  imagePath: string | null;
};

export function parseTransferBody(
  body: Record<string, unknown>
): TransferBody | { error: string } {
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Số tiền phải là số dương" };

  const fromWalletId = typeof body.fromWalletId === "string" ? body.fromWalletId : "";
  const toWalletId = typeof body.toWalletId === "string" ? body.toWalletId : "";
  if (!fromWalletId || !toWalletId)
    return { error: "Phải chọn ví nguồn và ví đích" };
  if (fromWalletId === toWalletId)
    return { error: "Ví nguồn phải khác ví đích (BR-6)" };

  const occurredAt = new Date(String(body.occurredAt ?? ""));
  if (isNaN(occurredAt.getTime())) return { error: "Ngày không hợp lệ" };

  return {
    title:
      typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
    amount,
    fromWalletId,
    toWalletId,
    occurredAt,
    imagePath:
      typeof body.imagePath === "string" && body.imagePath ? body.imagePath : null,
  };
}

// Phân bổ 12 tháng của quỹ (module mua hàng)
export function parseMonths(raw: unknown): number[] | { error: string } {
  if (!Array.isArray(raw) || raw.length !== 12)
    return { error: "Phân bổ tháng phải gồm 12 giá trị" };
  const months = raw.map((v) => Math.round(Number(v) || 0));
  if (months.some((v) => v < 0)) return { error: "Phân bổ tháng không được âm" };
  return months;
}

export function monthsToData(months: number[]) {
  const [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12] = months;
  return { m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12 };
}

// Hạng mục đề xuất mua hàng
export type ItemBody = {
  name: string;
  fundId: string;
  unit: string | null;
  quantity: number;
  specs: string | null;
  reason: string | null;
  status: ItemStatus;
  proposedAmount: number;
  actualAmount: number | null;
  purchasedAt: Date | null;
  notes: string | null;
};

function optText(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// Việc trong module Todolist
export type TodoBody = {
  title: string;
  notes: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate: Date | null;
};

export function parseTodoBody(body: Record<string, unknown>): TodoBody | { error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Tên việc là bắt buộc" };

  const priority = String(body.priority ?? "MEDIUM") as TodoPriority;
  if (!TODO_PRIORITIES.includes(priority)) return { error: "Ưu tiên không hợp lệ" };

  const status = String(body.status ?? "TODO") as TodoStatus;
  if (!TODO_STATUSES.includes(status)) return { error: "Trạng thái không hợp lệ" };

  let dueDate: Date | null = null;
  if (body.dueDate) {
    dueDate = new Date(String(body.dueDate));
    if (isNaN(dueDate.getTime())) return { error: "Hạn không hợp lệ" };
  }

  return { title, notes: optText(body.notes), priority, status, dueDate };
}

export function parseItemBody(body: Record<string, unknown>): ItemBody | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return { error: "Tên hạng mục là bắt buộc" };
  if (typeof body.fundId !== "string" || !body.fundId)
    return { error: "Phải chọn nguồn ngân sách (quỹ)" };

  const status = String(body.status ?? "PENDING") as ItemStatus;
  if (!ITEM_STATUSES.includes(status)) return { error: "Trạng thái không hợp lệ" };

  const proposedAmount = Math.round(Number(body.proposedAmount) || 0);
  if (proposedAmount < 0) return { error: "Tiền đề xuất không được âm" };

  let actualAmount: number | null = null;
  let purchasedAt: Date | null = null;
  if (status === "PURCHASED") {
    actualAmount = Math.round(Number(body.actualAmount));
    if (!Number.isFinite(actualAmount) || actualAmount < 0)
      return { error: "Hạng mục Đã mua phải nhập tiền mua thực tế (VAT)" };
    if (body.purchasedAt) {
      purchasedAt = new Date(String(body.purchasedAt));
      if (isNaN(purchasedAt.getTime())) return { error: "Ngày mua không hợp lệ" };
    }
  }

  const quantity = Number(body.quantity);
  return {
    name,
    fundId: body.fundId,
    unit: optText(body.unit),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    specs: optText(body.specs),
    reason: optText(body.reason),
    status,
    proposedAmount,
    actualAmount,
    purchasedAt,
    notes: optText(body.notes),
  };
}
