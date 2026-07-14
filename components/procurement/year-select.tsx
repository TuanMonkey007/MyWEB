"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearSelect({
  years,
  selectedYear,
}: {
  years: number[];
  selectedYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Select
      value={String(selectedYear)}
      onValueChange={(v) => {
        const next = new URLSearchParams(params.toString());
        next.set("year", v);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            Năm {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
