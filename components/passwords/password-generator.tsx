"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  generatePassword,
  passwordStrength,
  type GenOptions,
} from "@/lib/vault-crypto";
import { cn } from "@/lib/utils";

const DEFAULT_OPTS: GenOptions = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: false,
};

// Bảng tùy chọn sinh mật khẩu kiểu KeePassXC. onGenerate trả về mật khẩu mới.
export function PasswordGenerator({ onUse }: { onUse: (pw: string) => void }) {
  const [opts, setOpts] = useState<GenOptions>(DEFAULT_OPTS);
  const [pw, setPw] = useState("");

  const regen = (o: GenOptions) => setPw(generatePassword(o));
  useEffect(() => regen(DEFAULT_OPTS), []);

  function update(patch: Partial<GenOptions>) {
    const next = { ...opts, ...patch };
    // luôn còn ít nhất 1 bộ ký tự
    if (!next.upper && !next.lower && !next.digits && !next.symbols) return;
    setOpts(next);
    regen(next);
  }

  const strength = passwordStrength(pw);
  const pct = Math.min(100, (strength.bits / 128) * 100);
  const barColor =
    strength.bits < 40 ? "bg-red-500" : strength.bits < 70 ? "bg-amber-500" : "bg-emerald-500";

  const toggles: [keyof GenOptions, string][] = [
    ["upper", "A-Z"],
    ["lower", "a-z"],
    ["digits", "0-9"],
    ["symbols", "!@#$"],
    ["avoidAmbiguous", "Bỏ ký tự dễ nhầm"],
  ];

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-sm">
          {pw || "—"}
        </code>
        <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => regen(opts)}>
          <RefreshCw className="size-4" />
        </Button>
        <Button type="button" size="sm" onClick={() => onUse(pw)}>
          Dùng
        </Button>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full transition-all", barColor)} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{strength.label}</span>
          <span>{strength.bits} bit · {pw.length} ký tự</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="shrink-0 text-xs">Độ dài: {opts.length}</Label>
        <input
          type="range"
          min={6}
          max={64}
          value={opts.length}
          onChange={(e) => update({ length: Number(e.target.value) })}
          className="flex-1 accent-primary"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {toggles.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => update({ [key]: !opts[key] } as Partial<GenOptions>)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
              opts[key]
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
