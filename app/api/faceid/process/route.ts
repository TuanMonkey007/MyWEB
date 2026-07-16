import { readFile } from "fs/promises";
import { jsonError } from "@/lib/api";
import { DEFAULTS, readRows, runPipeline, type ProcessParams } from "@/lib/faceid";
import { deleteTemp, saveTemp, tempPath } from "@/lib/faceid-store";

// Xử lý file và STREAM log ra client (mỗi dòng 1 JSON, ngăn cách \n).
// Dòng cuối: {"done":true,"resultToken":...,"fileName":...} để tải kết quả.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const srcPath = tempPath(token, "src");
  if (!srcPath) return jsonError("Token không hợp lệ");

  let srcBuffer: Buffer;
  try {
    srcBuffer = await readFile(srcPath);
  } catch {
    return jsonError("Phiên tải file đã hết hạn — hãy tải lại file", 410);
  }

  const params: ProcessParams = {
    excludeIds: Array.isArray(body.excludeIds) ? body.excludeIds.map(String) : [],
    exceptionIds: Array.isArray(body.exceptionIds) ? body.exceptionIds.map(String) : [],
    dedupWindowSeconds: Number(body.dedupWindowSeconds) || DEFAULTS.dedupWindowSeconds,
    shiftStart: typeof body.shiftStart === "string" ? body.shiftStart : DEFAULTS.shiftStart,
    shiftEnd: typeof body.shiftEnd === "string" ? body.shiftEnd : DEFAULTS.shiftEnd,
    breakWindows: typeof body.breakWindows === "string" ? body.breakWindows : DEFAULTS.breakWindows,
    exceptionWindowMinutes: Number(body.exceptionWindowMinutes) || DEFAULTS.exceptionWindowMinutes,
  };
  const outputName =
    typeof body.outputName === "string" && body.outputName.trim()
      ? body.outputName.trim().replace(/[\\/]/g, "")
      : "ket_qua.xlsx";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const log = (msg: string) => send({ log: msg });
      try {
        const { rows, columns } = await readRows(srcBuffer);
        const buffer = await runPipeline(rows, columns, params, log);
        const resultToken = await saveTemp(buffer, "out");
        const fileName = outputName.toLowerCase().endsWith(".xlsx") ? outputName : `${outputName}.xlsx`;
        send({ done: true, resultToken, fileName });
      } catch (e) {
        send({ error: e instanceof Error ? e.message : "Lỗi xử lý" });
      } finally {
        await deleteTemp(token, "src");
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
