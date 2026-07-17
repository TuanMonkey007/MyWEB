// Mã hóa đầu-cuối cho Kho mật khẩu — CHẠY TRONG TRÌNH DUYỆT (Web Crypto API).
// Khóa dẫn xuất từ mật khẩu chủ bằng PBKDF2-SHA256, mã hóa AES-256-GCM.
// Server chỉ nhận bản mã: mật khẩu chủ và khóa không bao giờ rời máy người dùng.
"use client";

const KDF_ITERS = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomSaltB64(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

// Dẫn xuất khóa AES-GCM từ mật khẩu chủ + salt
async function deriveKey(master: string, salt: Uint8Array, iters: number): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(master),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iters, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// "Verifier": băm SHA-256 của (salt || raw key material) — dùng để kiểm tra
// mật khẩu chủ đúng khi mở khóa, KHÔNG lộ mật khẩu (tách riêng khóa mã hóa).
async function computeVerifier(master: string, salt: Uint8Array, iters: number): Promise<string> {
  const bits = await crypto.subtle.importKey("raw", enc.encode(master), "PBKDF2", false, ["deriveBits"]);
  const raw = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iters, hash: "SHA-256" },
    bits,
    256
  );
  const tag = enc.encode("myweb-vault-verifier");
  const combined = new Uint8Array(raw.byteLength + tag.byteLength);
  combined.set(new Uint8Array(raw), 0);
  combined.set(tag, raw.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", combined as BufferSource);
  return toB64(new Uint8Array(digest));
}

export type VaultKey = { key: CryptoKey; salt: Uint8Array; iters: number };

// Khởi tạo vault mới: sinh salt, khóa và verifier để lưu server
export async function createVaultKey(master: string): Promise<{
  vaultKey: VaultKey;
  saltB64: string;
  verifier: string;
  kdfIters: number;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(master, salt, KDF_ITERS);
  const verifier = await computeVerifier(master, salt, KDF_ITERS);
  return {
    vaultKey: { key, salt, iters: KDF_ITERS },
    saltB64: toB64(salt),
    verifier,
    kdfIters: KDF_ITERS,
  };
}

// Mở khóa: dẫn xuất khóa từ mật khẩu chủ + salt server, kiểm tra verifier
export async function unlockVaultKey(
  master: string,
  saltB64: string,
  verifier: string,
  iters: number
): Promise<VaultKey | null> {
  const salt = fromB64(saltB64);
  const check = await computeVerifier(master, salt, iters);
  if (check !== verifier) return null; // sai mật khẩu chủ
  const key = await deriveKey(master, salt, iters);
  return { key, salt, iters };
}

// Mã hóa payload bí mật ({password, notes}) → base64(iv||ciphertext)
export async function encryptSecret(vaultKey: VaultKey, plain: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    vaultKey.key,
    enc.encode(JSON.stringify(plain))
  );
  const ctBytes = new Uint8Array(ct);
  const out = new Uint8Array(iv.byteLength + ctBytes.byteLength);
  out.set(iv, 0);
  out.set(ctBytes, iv.byteLength);
  return toB64(out);
}

export async function decryptSecret<T = unknown>(vaultKey: VaultKey, cipher: string): Promise<T> {
  const data = fromB64(cipher);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    vaultKey.key,
    ct as BufferSource
  );
  return JSON.parse(dec.decode(plain)) as T;
}

// ===== Sinh mật khẩu mạnh (kiểu KeePassXC) =====
export type GenOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean; // bỏ ký tự dễ nhầm: O0oI1l|...
};

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};
const AMBIGUOUS = new Set("O0oI1l|`'\"{}[]".split(""));

export function generatePassword(opts: GenOptions): string {
  let pool = "";
  const required: string[] = [];
  for (const k of ["upper", "lower", "digits", "symbols"] as const) {
    if (!opts[k]) continue;
    let set = SETS[k];
    if (opts.avoidAmbiguous) set = [...set].filter((c) => !AMBIGUOUS.has(c)).join("");
    pool += set;
    if (set) required.push(set);
  }
  if (!pool) return "";
  const len = Math.max(opts.length, required.length);

  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars: string[] = required.map((set) => pick(set)); // đảm bảo mỗi loại ≥1
  while (chars.length < len) chars.push(pick(pool));

  // Xáo trộn Fisher–Yates với nguồn ngẫu nhiên mật mã
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// Ước lượng độ mạnh (bit entropy) để hiển thị thanh strength
export function passwordStrength(pw: string): { bits: number; label: string } {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 24;
  const bits = pw.length ? Math.round(pw.length * Math.log2(pool || 1)) : 0;
  const label = bits < 40 ? "Yếu" : bits < 70 ? "Trung bình" : bits < 100 ? "Mạnh" : "Rất mạnh";
  return { bits, label };
}
