"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatVND } from "@/lib/format";

// Palette phân loại đã validate CVD (worst adjacent ΔE 24.2, mode light)
const SLOT_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];
const OTHER_COLOR = "#9b9a94";

type Slice = { name: string; amount: number };

// Màu theo danh mục (ổn định theo tên, không theo thứ hạng); >8 gộp vào "Khác"
function buildSlices(data: Slice[]): (Slice & { color: string })[] {
  const shown = data.slice(0, 8);
  const rest = data.slice(8);
  const byName = [...shown].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const colorByName = new Map(byName.map((s, i) => [s.name, SLOT_COLORS[i]]));
  const slices = shown.map((s) => ({ ...s, color: colorByName.get(s.name)! }));
  if (rest.length > 0)
    slices.push({
      name: "Khác",
      amount: rest.reduce((sum, s) => sum + s.amount, 0),
      color: OTHER_COLOR,
    });
  return slices;
}

export function ExpenseDonut({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Chưa có khoản chi nào trong tháng này.
      </div>
    );
  }

  const slices = buildSlices(data);
  const total = slices.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatVND(Number(value))}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Tổng chi</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatVND(total)}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {formatVND(s.amount)}
            </span>
            <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
              {total > 0 ? Math.round((s.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
