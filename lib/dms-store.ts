// Lưu tạm file kết quả DMS trong UPLOAD_DIR/dms, tự dọn sau 1 giờ.
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const TTL_MS = 60 * 60 * 1000;

function dmsDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "dms");
}

export async function saveResult(buffer: Buffer): Promise<string> {
  const dir = dmsDir();
  await mkdir(dir, { recursive: true });
  const now = Date.now();
  for (const f of await readdir(dir).catch(() => [])) {
    const fp = path.join(dir, f);
    const s = await stat(fp).catch(() => null);
    if (s && now - s.mtimeMs > TTL_MS) await unlink(fp).catch(() => {});
  }
  const token = randomUUID();
  await writeFile(path.join(dir, `${token}.xlsx`), buffer);
  return token;
}

export function resultPath(token: string): string | null {
  const safe = path.basename(token);
  if (safe !== token || !/^[\w-]+$/.test(safe)) return null;
  return path.join(dmsDir(), `${safe}.xlsx`);
}

export async function deleteResult(token: string) {
  const p = resultPath(token);
  if (p) await unlink(p).catch(() => {});
}
