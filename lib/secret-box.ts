// Mã hóa các bí mật lưu trong DB (API key mail...) bằng AES-256-GCM.
//
// Vì sao phải mã hóa: script backup chép cả file .db ra C:\backup, nếu để
// key dạng thô thì mọi bản backup đều mang theo key.
//
// Khóa chủ KHÔNG nằm trong DB, lấy theo thứ tự:
//   1. APP_SECRET trong .env — khuyến nghị cho production
//   2. file .app-secret sinh tự động CẠNH file database. File này không lọt
//      vào backup vì backup.ps1 chỉ chép finance.db + thư mục uploads.
// Mất khóa chủ = không giải mã được key cũ, phải nhập lại (không mất dữ liệu khác).
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const PREFIX = "enc:v1:";
const SECRET_FILE = ".app-secret";

// Thư mục chứa file SQLite (DATABASE_URL tương đối thì tính từ prisma/)
function dbDir(): string {
  const raw = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "");
  const abs = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), "prisma", raw);
  return path.dirname(abs);
}

let cachedKey: Buffer | null = null;

function masterKey(): Buffer {
  if (cachedKey) return cachedKey;

  if (process.env.APP_SECRET) {
    cachedKey = scryptSync(process.env.APP_SECRET, "myweb.secret-box", 32);
    return cachedKey;
  }

  const file = path.join(dbDir(), SECRET_FILE);
  if (existsSync(file)) {
    const hex = readFileSync(file, "utf8").trim();
    if (!/^[0-9a-f]{64}$/.test(hex))
      throw new Error(`File khóa ${file} hỏng — xóa file rồi nhập lại các key đã lưu`);
    cachedKey = Buffer.from(hex, "hex");
    return cachedKey;
  }

  const key = randomBytes(32);
  writeFileSync(file, key.toString("hex"), { mode: 0o600 });
  // Windows bỏ qua mode ở writeFileSync → siết lại cho chắc (lỗi thì kệ)
  try {
    chmodSync(file, 0o600);
  } catch {
    /* hệ thống không hỗ trợ chmod */
  }
  cachedKey = key;
  return cachedKey;
}

export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return (
    PREFIX +
    [iv, cipher.getAuthTag(), ct].map((b) => b.toString("base64")).join(":")
  );
}

// Trả null nếu không giải mã được (đổi APP_SECRET, mất file khóa, dữ liệu hỏng)
// — nơi gọi hiển thị "nhập lại key" thay vì làm sập app.
export function open(sealed: string): string | null {
  if (!isSealed(sealed)) return null;
  try {
    const [iv, tag, ct] = sealed.slice(PREFIX.length).split(":");
    const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(ct, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

// Che bớt bí mật để hiện lên giao diện: re_abc...WXYZ → re_a••••WXYZ
export function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}${"•".repeat(6)}${value.slice(-4)}`;
}
