// Cấu hình mail: đọc từ DB (bảng AppSetting, tiền tố "mail.") và lấy .env làm
// dự phòng. DB được ưu tiên — admin sửa trên giao diện là có hiệu lực ngay,
// khỏi sửa .env rồi restart máy chủ.
//
// Bí mật (API key, mật khẩu SMTP) lưu vào DB dạng đã mã hóa (lib/secret-box).
import { prisma } from "../prisma";
import { isSealed, open, seal } from "../secret-box";
import {
  DRIVERS,
  DRIVER_REQUIRED,
  FIELD_META,
  MAIL_FIELDS,
  type DriverName,
  type MailField,
} from "./constants";

export * from "./constants";

const DB_PREFIX = "mail.";

export type MailConfig = {
  driver: DriverName;
  values: Record<MailField, string | null>;
  /** Mỗi trường đang lấy từ đâu — để giao diện nói rõ "theo DB" hay "theo .env" */
  sources: Partial<Record<MailField, "db" | "env">>;
  /** Bí mật lưu trong DB nhưng không giải mã được (đổi APP_SECRET / mất file khóa) */
  broken: MailField[];
};

function envValue(field: MailField): string | null {
  const v = process.env[FIELD_META[field].envName];
  return v && v.trim() ? v.trim() : null;
}

export async function getMailConfig(): Promise<MailConfig> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { startsWith: DB_PREFIX } },
  });
  const db = new Map(rows.map((r) => [r.key.slice(DB_PREFIX.length), r.value]));

  const values = {} as Record<MailField, string | null>;
  const sources: Partial<Record<MailField, "db" | "env">> = {};
  const broken: MailField[] = [];

  for (const field of MAIL_FIELDS) {
    const raw = db.get(field);
    if (raw !== undefined && raw !== "") {
      const plain = isSealed(raw) ? open(raw) : raw;
      if (plain === null) {
        // Có lưu nhưng giải mã hỏng → coi như chưa có, báo cho admin nhập lại
        broken.push(field);
      } else {
        values[field] = plain;
        sources[field] = "db";
        continue;
      }
    }
    const fromEnv = envValue(field);
    values[field] = fromEnv;
    if (fromEnv !== null) sources[field] = "env";
  }

  const rawDriver = (values.driver || "log").toLowerCase();
  const driver = (DRIVERS as readonly string[]).includes(rawDriver)
    ? (rawDriver as DriverName)
    : "log";

  return { driver, values, sources, broken };
}

/** Trường còn thiếu để gửi được — dùng cả ở API lẫn giao diện */
export function missingFields(cfg: MailConfig): MailField[] {
  if (cfg.driver === "log") return [];
  const need: MailField[] = ["from", ...DRIVER_REQUIRED[cfg.driver]];
  return need.filter((f) => !cfg.values[f]);
}

export function isConfigured(cfg: MailConfig): boolean {
  return cfg.driver !== "log" && missingFields(cfg).length === 0;
}

/** Ghi cấu hình xuống DB. Giá trị rỗng/null = xóa dòng để rơi lại về .env. */
export async function saveMailConfig(patch: Partial<Record<MailField, string | null>>) {
  for (const [field, value] of Object.entries(patch) as [MailField, string | null][]) {
    const key = DB_PREFIX + field;
    const trimmed = value?.trim();
    if (!trimmed) {
      await prisma.appSetting.deleteMany({ where: { key } });
      continue;
    }
    const stored = FIELD_META[field].secret ? seal(trimmed) : trimmed;
    await prisma.appSetting.upsert({
      where: { key },
      update: { value: stored },
      create: { key, value: stored },
    });
  }
}
