"use client";
import { useState } from "react";

type Row = { date: string; o: number; hi: number; lo: number; c: number; chg: number; pump: number; dump: number; after: number | null };
type Resp = { symbol: string; tf: string; hour_vn: number; days: number; slot_green_pct: number; pump_then_dump_pct: number; avg_pump: number; avg_chg: number; after_up: number; after_down: number; after_down_pct: number; verdict: string; conf: number; rows: Row[]; recent_bars: { t: string; vn_h: number; vn_min: number; o: number; h: number; l: number; c: number; v: number }[]; error?: string };

const SYMS = ["XAUUSDm", "XAUUSD247m", "BTCUSDm", "BTCUSDTm", "EURUSDm", "GBPUSDm", "USDJPYm"];

export default function PredictPage() {
  const [sym, setSym] = useState("XAUUSDm");
  const [tf, setTf] = useState("M30");
  const [hour, setHour] = useState("2");
  const [days, setDays] = useState("60");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true); setData(null);
    try {
      const r = await fetch(`/api/predict?symbol=${sym}&tf=${tf}&hour=${hour}&days=${days}`);
      setData(await r.json());
    } finally { setLoading(false); }
  }

  const bars = data?.recent_bars ?? [];
  const W = 900, H = 260;
  const all = bars.flatMap((b) => [b.h, b.l]);
  const mn = all.length ? Math.min(...all) : 0, mx = all.length ? Math.max(...all) : 1;
  const X = (i: number) => 30 + (i * (W - 50)) / Math.max(1, bars.length - 1);
  const Y = (p: number) => H - 20 - ((p - mn) / Math.max(0.0001, mx - mn)) * (H - 50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold uppercase">Predict — mẫu giờ đêm</h1>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs font-bold">Cặp
          <select value={sym} onChange={(e) => setSym(e.target.value)} className="ml-1 border-2 border-black rounded px-2 py-1">
            {SYMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold">TF
          <select value={tf} onChange={(e) => setTf(e.target.value)} className="ml-1 border-2 border-black rounded px-2 py-1">
            {["M15", "M30", "H1", "H4"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold">Giờ VN
          <input value={hour} onChange={(e) => setHour(e.target.value)} className="ml-1 w-14 border-2 border-black rounded px-2 py-1" />
        </label>
        <label className="text-xs font-bold">Số ngày
          <input value={days} onChange={(e) => setDays(e.target.value)} className="ml-1 w-16 border-2 border-black rounded px-2 py-1" />
        </label>
        <button onClick={run} disabled={loading} className="border-2 border-black bg-black text-white text-xs font-bold px-4 py-1.5 rounded">
          {loading ? "Đang chạy MT5..." : "Chạy"}
        </button>
      </div>

      {data?.error && <p className="text-sm font-bold text-red-600">Lỗi: {data.error} (MT5 mở chưa? Cuối tuần market đóng?)</p>}

      {data && !data.error && (
        <>
          <div className={`border-2 border-black rounded p-3 font-bold ${data.verdict === "DOWN" ? "bg-red-100" : data.verdict === "UP" ? "bg-green-100" : "bg-stone-100"}`}>
            {data.symbol} {data.tf} {data.hour_vn}h VN — verdict {data.verdict} ({data.conf}%) · pump-rồi-xả {data.pump_then_dump_pct}% · sau 2h giảm {data.after_down_pct}% · biên pump TB {data.avg_pump}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full border-2 border-black rounded bg-white">
            {bars.map((b, i) => {
              const up = b.c >= b.o;
              const col = up ? "#16a34a" : "#dc2626";
              return (
                <g key={i}>
                  <line x1={X(i)} y1={Y(b.h)} x2={X(i)} y2={Y(b.l)} stroke={col} strokeWidth={1.5} />
                  <rect x={X(i) - 3} y={Y(Math.max(b.o, b.c))} width={6} height={Math.max(1, Math.abs(Y(b.o) - Y(b.c)))} fill={col} />
                  {i % Math.ceil(bars.length / 12) === 0 && (
                    <text x={X(i)} y={H - 5} fontSize={9} textAnchor="middle">{b.t.slice(5, 16).replace("T", " ")}</text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="border-2 border-black rounded overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead><tr className="bg-black text-white">
                <th className="p-1 text-left">Ngày</th><th>O</th><th>Hi</th><th>Lo</th><th>C</th><th>Chg</th><th>Pump</th><th>Xả</th><th>Sau 2h</th>
              </tr></thead>
              <tbody>
                {[...data.rows].reverse().map((r) => (
                  <tr key={r.date} className="border-t border-stone-200">
                    <td className="p-1 font-bold">{r.date}</td><td>{r.o}</td><td className="text-green-700">{r.hi}</td>
                    <td className="text-red-700">{r.lo}</td><td>{r.c}</td>
                    <td className={r.chg >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{r.chg}</td>
                    <td>{r.pump}</td><td>{r.dump}</td>
                    <td className={r.after != null && r.after < 0 ? "text-red-700 font-bold" : "font-bold"}>{r.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
