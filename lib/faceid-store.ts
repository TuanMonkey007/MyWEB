// Lưu tạm file FaceID (nguồn upload + kết quả) trong UPLOAD_DIR/faceid,
// dọn tự động sau TTL để không phình đĩa.
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const TTL_MS = 60 * 60 * 1000; // giữ 1 giờ

function faceidDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "faceid");
}

export async function saveTemp(buffer: Buffer, suffix: string): Promise<string> {
  const dir = faceidDir();
  await mkdir(dir, { recursive: true });
  await cleanupOld(dir);
  const token = randomUUID();
  await writeFile(path.join(dir, `${token}.${suffix}`), buffer);
  return token;
}

export function tempPath(token: string, suffix: string): string | null {
  const safe = path.basename(token);
  if (safe !== token || !/^[\w-]+$/.test(safe)) return null;
  return path.join(faceidDir(), `${safe}.${suffix}`);
}

export async function deleteTemp(token: string, suffix: string) {
  const p = tempPath(token, suffix);
  if (p) await unlink(p).catch(() => {});
}

async function cleanupOld(dir: string) {
  const now = Date.now();
  for (const f of await readdir(dir).catch(() => [])) {
    const fp = path.join(dir, f);
    const s = await stat(fp).catch(() => null);
    if (s && now - s.mtimeMs > TTL_MS) await unlink(fp).catch(() => {});
  }
}
