import { NextResponse } from "next/server";
import { execFile } from "child_process";

const SCRIPT = "C:/Users/tuannm/AppData/Local/hermes/scripts/mt5_predict.py";

function run(sym: string, tf: string, hour: string, days: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("python", [SCRIPT, sym, tf, hour, days], { timeout: 90000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sym = (u.searchParams.get("symbol") || "XAUUSDm").replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "XAUUSDm";
  const tf = ["M15", "M30", "H1", "H4"].includes(u.searchParams.get("tf") || "") ? u.searchParams.get("tf")! : "M30";
  const hour = Math.min(23, Math.max(0, parseInt(u.searchParams.get("hour") || "2", 10) || 0)).toString();
  const days = Math.min(120, Math.max(7, parseInt(u.searchParams.get("days") || "60", 10) || 60)).toString();
  try {
    const out = await run(sym, tf, hour, days);
    return NextResponse.json(JSON.parse(out));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "predict failed" }, { status: 500 });
  }
}
