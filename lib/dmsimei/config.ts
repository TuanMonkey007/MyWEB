// Cau hinh tai khoan IT DMS (AppSetting, tien to "dmsimei.") + client CAS.
// Mat khau luu ma hoa (lib/secret-box), khong bao gio tra ve client.
import { prisma } from "../prisma";
import { isSealed, open, seal } from "../secret-box";

const PREFIX = "dmsimei.";
export const DEFAULT_BASE_URL = "http://huunghiv2.dmsone.vn";

export type DmsImeiConfig = {
  baseUrl: string;
  username: string | null;
  password: string | null;
  broken: string[];
};

function envValue(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export async function getDmsImeiConfig(): Promise<DmsImeiConfig> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { startsWith: PREFIX } },
  });
  const db = new Map(rows.map((r) => [r.key.slice(PREFIX.length), r.value]));
  const broken: string[] = [];

  const read = (field: string, secret: boolean, envName?: string) => {
    const raw = db.get(field);
    if (raw !== undefined && raw !== "") {
      const plain = secret && isSealed(raw) ? open(raw) : raw;
      if (plain === null) {
        broken.push(field);
      } else {
        return plain;
      }
    }
    return envName ? envValue(envName) : null;
  };

  return {
    baseUrl: read("baseUrl", false) || DEFAULT_BASE_URL,
    username: read("username", false, "DMS_USER"),
    password: read("password", true, "DMS_PASSWORD"),
    broken,
  };
}

export function missingDmsImei(cfg: DmsImeiConfig): string[] {
  const m: string[] = [];
  if (!cfg.username) m.push("Tên đăng nhập");
  if (!cfg.password) m.push("Mật khẩu");
  return m;
}

/** Ghi cau hinh. Chuoi rong = giu nguyen (bi mat) hoac xoa ve mac dinh. */
export async function saveDmsImeiConfig(patch: {
  baseUrl?: string | null;
  username?: string | null;
  password?: string | null;
}) {
  if (patch.baseUrl !== undefined) {
    const v = patch.baseUrl?.trim();
    if (!v || v === DEFAULT_BASE_URL) {
      await prisma.appSetting.deleteMany({ where: { key: PREFIX + "baseUrl" } });
    } else {
      await prisma.appSetting.upsert({
        where: { key: PREFIX + "baseUrl" },
        update: { value: v },
        create: { key: PREFIX + "baseUrl", value: v },
      });
    }
  }
  if (patch.username !== undefined) {
    const v = patch.username?.trim();
    if (!v) {
      await prisma.appSetting.deleteMany({ where: { key: PREFIX + "username" } });
    } else {
      await prisma.appSetting.upsert({
        where: { key: PREFIX + "username" },
        update: { value: v },
        create: { key: PREFIX + "username", value: v },
      });
    }
  }
  if (patch.password !== undefined) {
    const v = patch.password?.trim();
    if (v) {
      const stored = seal(v);
      await prisma.appSetting.upsert({
        where: { key: PREFIX + "password" },
        update: { value: stored },
        create: { key: PREFIX + "password", value: stored },
      });
    }
    // Rong = giu nguyen key cu, khong xoa.
  }
}
