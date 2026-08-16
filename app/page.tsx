"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// Landing public: đồng hồ thế giới — nhiều thành phố, kim chạy mượt (rAF),
// nền gradient chuyển động, card đổi màu theo ngày/đêm của từng nơi.
type City = {
  name: string;
  tz: string;
  flag: string;
  accent: string; // màu kim + vòng
};

const CITIES: City[] = [
  { name: "Hà Nội", tz: "Asia/Ho_Chi_Minh", flag: "🇻🇳", accent: "#ff5470" },
  { name: "Tokyo", tz: "Asia/Tokyo", flag: "🇯🇵", accent: "#ff8a3d" },
  { name: "Singapore", tz: "Asia/Singapore", flag: "🇸🇬", accent: "#ffd23f" },
  { name: "Dubai", tz: "Asia/Dubai", flag: "🇦🇪", accent: "#37d67a" },
  { name: "Paris", tz: "Europe/Paris", flag: "🇫🇷", accent: "#2dd4bf" },
  { name: "London", tz: "Europe/London", flag: "🇬🇧", accent: "#4cc9f0" },
  { name: "New York", tz: "America/New_York", flag: "🇺🇸", accent: "#7c8cff" },
  { name: "Los Angeles", tz: "America/Los_Angeles", flag: "🇺🇸", accent: "#c77dff" },
];

type Parts = { hour: number; minute: number; second: number; dateLabel: string };

// Trả 0 cho tới khi mount (SSR và lần render client đầu khớp nhau → không lỗi
// hydration vì thời gian máy chủ khác máy khách), sau đó chạy theo rAF.
function useClockTick() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return now;
}

function readParts(
  timeFmt: Intl.DateTimeFormat,
  dateFmt: Intl.DateTimeFormat,
  ms: number
): Parts {
  const d = new Date(ms);
  const p = timeFmt.formatToParts(d);
  const val = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return {
    hour: val("hour"),
    minute: val("minute"),
    second: val("second") + (ms % 1000) / 1000, // mượt sub-giây
    dateLabel: dateFmt.format(d),
  };
}

function AnalogClock({
  parts,
  size,
  accent,
  isDay,
}: {
  parts: Parts;
  size: number;
  accent: string;
  isDay: boolean;
}) {
  const { hour, minute, second } = parts;
  const secDeg = second * 6;
  const minDeg = minute * 6 + second / 10;
  const hourDeg = (hour % 12) * 30 + minute * 0.5;
  const c = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={`face-${accent}-${size}`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={isDay ? "#ffffff18" : "#ffffff10"} />
          <stop offset="100%" stopColor="#00000040" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={c - 2} fill={`url(#face-${accent}-${size})`} />
      <circle
        cx={c}
        cy={c}
        r={c - 2}
        fill="none"
        stroke={accent}
        strokeWidth={size > 200 ? 3 : 2}
        strokeOpacity={0.55}
      />
      {/* vạch giờ */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r1 = c - (size > 200 ? 16 : 9);
        const r2 = c - (size > 200 ? 8 : 5);
        const major = i % 3 === 0;
        return (
          <line
            key={i}
            x1={c + r1 * Math.sin(a)}
            y1={c - r1 * Math.cos(a)}
            x2={c + r2 * Math.sin(a)}
            y2={c - r2 * Math.cos(a)}
            stroke="currentColor"
            strokeOpacity={major ? 0.9 : 0.35}
            strokeWidth={major ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* kim giờ */}
      <line
        x1={c}
        y1={c}
        x2={c}
        y2={c - size * 0.26}
        stroke="currentColor"
        strokeWidth={size > 200 ? 5 : 3}
        strokeLinecap="round"
        transform={`rotate(${hourDeg} ${c} ${c})`}
      />
      {/* kim phút */}
      <line
        x1={c}
        y1={c}
        x2={c}
        y2={c - size * 0.37}
        stroke="currentColor"
        strokeWidth={size > 200 ? 3.5 : 2}
        strokeLinecap="round"
        transform={`rotate(${minDeg} ${c} ${c})`}
      />
      {/* kim giây */}
      <line
        x1={c}
        y1={c + size * 0.08}
        x2={c}
        y2={c - size * 0.42}
        stroke={accent}
        strokeWidth={size > 200 ? 2 : 1.3}
        strokeLinecap="round"
        transform={`rotate(${secDeg} ${c} ${c})`}
      />
      <circle cx={c} cy={c} r={size > 200 ? 6 : 4} fill={accent} />
      <circle cx={c} cy={c} r={size > 200 ? 2.5 : 1.8} fill="#0b0b12" />
    </svg>
  );
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function CityCard({ city, now }: { city: City; now: number }) {
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: city.tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    [city.tz]
  );
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        timeZone: city.tz,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    [city.tz]
  );
  const parts = readParts(timeFmt, dateFmt, now);
  const isDay = parts.hour >= 6 && parts.hour < 18;

  return (
    <div
      className="clock-card group relative overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: isDay
          ? "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))"
          : "linear-gradient(160deg, rgba(20,20,45,0.55), rgba(0,0,0,0.25))",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
        style={{ background: city.accent }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{city.flag}</span>
          <span className="font-medium text-white">{city.name}</span>
        </div>
        <span className="text-xs text-white/50">{isDay ? "☀️" : "🌙"}</span>
      </div>

      <div className="my-3 flex justify-center text-white/90">
        <AnalogClock parts={parts} size={120} accent={city.accent} isDay={isDay} />
      </div>

      <div className="text-center">
        <div className="font-mono text-2xl font-semibold tabular-nums text-white tracking-tight">
          {pad(parts.hour)}:{pad(parts.minute)}
          <span className="text-white/40">:{pad(parts.second)}</span>
        </div>
        <div className="text-xs capitalize text-white/50">{parts.dateLabel}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const now = useClockTick();
  const hero = CITIES[0];

  const heroTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: hero.tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    [hero.tz]
  );
  const heroDateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        timeZone: hero.tz,
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [hero.tz]
  );
  const heroParts = readParts(heroTimeFmt, heroDateFmt, now);
  const heroIsDay = heroParts.hour >= 6 && heroParts.hour < 18;
  const mounted = now > 0;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#070712] text-white">
      {/* nền gradient chuyển động */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="ring ring-spin" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
          tuandeptrai.io.vn
        </span>
        <Link
          href="/login"
          className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/15"
        >
          Đăng nhập →
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16">
        {!mounted ? (
          // giữ chiều cao khi chưa mount để tránh nhảy layout (không lỗi hydration:
          // SSR và client-render đầu đều chưa mount)
          <div className="min-h-[70vh]" />
        ) : (
          <div className="animate-in fade-in duration-700">
        {/* Hero: đồng hồ lớn Hà Nội */}
        <section className="flex flex-col items-center gap-6 py-8 text-center md:py-12">
          <div className="relative text-white" style={{ color: heroIsDay ? "#fff" : "#e8e8ff" }}>
            <div
              className="absolute inset-0 -z-10 rounded-full blur-3xl"
              style={{ background: `${hero.accent}55` }}
            />
            <AnalogClock parts={heroParts} size={260} accent={hero.accent} isDay={heroIsDay} />
          </div>
          <div>
            <div className="font-mono text-5xl font-bold tabular-nums sm:text-6xl">
              {pad(heroParts.hour)}
              <span className="animate-pulse text-white/50">:</span>
              {pad(heroParts.minute)}
              <span className="text-3xl text-white/40 sm:text-4xl tracking-tight">
                :{pad(heroParts.second)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-white/70">
              <span className="text-lg">{hero.flag}</span>
              <span className="font-medium">{hero.name}</span>
              <span className="text-white/40">·</span>
              <span className="capitalize">{heroParts.dateLabel}</span>
            </div>
          </div>
          <h1 className="max-w-xl bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl tracking-tight">
            Đồng hồ thế giới
          </h1>
        </section>

        {/* Lưới thành phố */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CITIES.map((city) => (
            <CityCard key={city.tz} city={city} now={now} />
          ))}
        </section>
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Tuấn — Platform cá nhân dạng module
      </footer>

      <style jsx>{`
        .aurora {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          opacity: 0.55;
          mix-blend-mode: screen;
        }
        .aurora-1 {
          width: 46vw;
          height: 46vw;
          left: -8vw;
          top: -10vw;
          background: radial-gradient(circle, #ff5470, transparent 70%);
          animation: drift1 18s ease-in-out infinite alternate;
        }
        .aurora-2 {
          width: 42vw;
          height: 42vw;
          right: -6vw;
          top: 4vw;
          background: radial-gradient(circle, #4cc9f0, transparent 70%);
          animation: drift2 22s ease-in-out infinite alternate;
        }
        .aurora-3 {
          width: 50vw;
          height: 50vw;
          left: 20vw;
          bottom: -18vw;
          background: radial-gradient(circle, #c77dff, transparent 70%);
          animation: drift3 26s ease-in-out infinite alternate;
        }
        .ring {
          position: absolute;
          left: 50%;
          top: 18%;
          width: 620px;
          height: 620px;
          margin-left: -310px;
          border-radius: 9999px;
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .ring::after {
          content: "";
          position: absolute;
          inset: 60px;
          border-radius: 9999px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .ring-spin {
          animation: spin 120s linear infinite;
        }
        @keyframes drift1 {
          to {
            transform: translate(6vw, 8vw) scale(1.15);
          }
        }
        @keyframes drift2 {
          to {
            transform: translate(-7vw, 6vw) scale(1.2);
          }
        }
        @keyframes drift3 {
          to {
            transform: translate(4vw, -6vw) scale(1.1);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora,
          .ring-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
