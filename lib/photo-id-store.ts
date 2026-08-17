// Lưu tạm ảnh của một phiên xử lý trong UPLOAD_DIR/anh-the, tự dọn sau 2 giờ.
// Giữ cả ảnh GỐC vì người dùng còn nhích khung cắt — mỗi lần nhích là cắt lại
// từ ảnh gốc, không cắt chồng lên ảnh đã cắt (cắt chồng sẽ mất nét dần).
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const TTL_MS = 2 * 60 * 60 * 1000;

function goc(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads", "anh-the");
}

function thuMucPhien(phien: string): string | null {
  const safe = path.basename(phien);
  if (safe !== phien || !/^[\w-]+$/.test(safe)) return null;
  return path.join(goc(), safe);
}

export async function taoPhien(): Promise<string> {
  const dir = goc();
  await mkdir(dir, { recursive: true });
  await donCu(dir);
  const phien = randomUUID();
  await mkdir(path.join(dir, phien), { recursive: true });
  return phien;
}

export async function luuAnhGoc(phien: string, id: string, buf: Buffer) {
  const dir = thuMucPhien(phien);
  if (!dir) throw new Error("Phiên không hợp lệ");
  await writeFile(path.join(dir, `${id}.goc`), buf);
}

export async function docAnhGoc(phien: string, id: string): Promise<Buffer | null> {
  const dir = thuMucPhien(phien);
  if (!dir || !/^[\w-]+$/.test(id)) return null;
  return readFile(path.join(dir, `${id}.goc`)).catch(() => null);
}

export async function luuKetQua(phien: string, id: string, buf: Buffer) {
  const dir = thuMucPhien(phien);
  if (!dir) throw new Error("Phiên không hợp lệ");
  await writeFile(path.join(dir, `${id}.jpg`), buf);
}

export async function docKetQua(phien: string, id: string): Promise<Buffer | null> {
  const dir = thuMucPhien(phien);
  if (!dir || !/^[\w-]+$/.test(id)) return null;
  return readFile(path.join(dir, `${id}.jpg`)).catch(() => null);
}

async function donCu(dir: string) {
  const now = Date.now();
  for (const f of await readdir(dir).catch(() => [])) {
    const p = path.join(dir, f);
    const s = await stat(p).catch(() => null);
    if (s && now - s.mtimeMs > TTL_MS) await rm(p, { recursive: true, force: true }).catch(() => {});
  }
}
