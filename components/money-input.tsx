"use client";

import { Input } from "@/components/ui/input";
import { formatAmountInput, parseAmountInput } from "@/lib/format";

// Ô nhập tiền VNĐ: tự phân tách hàng nghìn khi gõ (BR-7)
export function MoneyInput({
  value,
  onChange,
  id,
  placeholder = "0",
  required,
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={formatAmountInput(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(parseAmountInput(e.target.value))}
        className="pr-8 text-right font-medium tabular-nums"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₫
      </span>
    </div>
  );
}
