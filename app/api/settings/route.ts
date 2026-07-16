import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import {
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  getSettings,
  reconcileModuleOrder,
  setSetting,
} from "@/lib/settings";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (body.platformName !== undefined) {
    const name = String(body.platformName).trim();
    if (!name) return jsonError("Tên platform không được để trống");
    await setSetting("platformName", name.slice(0, 60));
  }
  if (body.fontFamily !== undefined) {
    if (!FONT_OPTIONS.some((f) => f.id === body.fontFamily))
      return jsonError("Font không hợp lệ");
    await setSetting("fontFamily", body.fontFamily);
  }
  if (body.fontSize !== undefined) {
    if (!FONT_SIZE_OPTIONS.some((s) => s.id === String(body.fontSize)))
      return jsonError("Cỡ chữ không hợp lệ");
    await setSetting("fontSize", String(body.fontSize));
  }
  if (body.moduleOrder !== undefined) {
    if (!Array.isArray(body.moduleOrder))
      return jsonError("Thứ tự module không hợp lệ");
    await setSetting("moduleOrder", reconcileModuleOrder(body.moduleOrder.map(String)).join(","));
  }

  return NextResponse.json(await getSettings());
}
