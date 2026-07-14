"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatVND } from "@/lib/format";
import type { MonthPoint } from "@/lib/reports";

// Cặp màu thu/chi đã validate CVD (ΔE 13.3, mode light)
const INCOME_COLOR = "#008300";
const EXPENSE_COLOR = "#e34948";

const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => compact.format(v)}
            width={44}
          />
          <Tooltip
            formatter={(value, name) => [
              formatVND(Number(value)),
              name === "income" ? "Thu" : "Chi",
            ]}
            labelFormatter={(label) => `Tháng ${String(label).slice(1)}`}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Legend
            formatter={(value) => (value === "income" ? "Thu" : "Chi")}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 13 }}
          />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
