// Client goi DMS Huu Nghi tu server MyWEB (port tu script dms_reset_imei.py).
// Flow: login CAS -> GET /home + /catalog/unit-tree/info (session context) ->
// search-staff-group -> view-staff -> change-Staff-Info (imeiTabletStaff='')
// -> view-staff verify. Token xoay vong moi response.
import { getDmsImeiConfig, missingDmsImei } from "./config";

export type DmsStaff = {
  staffId: number;
  shopId: number;
  staffCode: string;
  staffName: string;
  imei: string;
};

export type DmsResetResult = {
  staff: DmsStaff;
  imeiBefore: string;
  imeiAfter: string;
  unlocked: boolean;
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyWEB-dmsimei";

type Jar = Map<string, string>;

function cookieHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(jar: Jar, res: Response) {
  // undici gom Set-Cookie (getSetCookie co tu Node 19.7)
  const get = (res.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie?.() ?? [];
  for (const c of get) {
    const m = /^([^=;]+)=([^;]*)/.exec(c);
    if (m) jar.set(m[1].trim(), m[2].trim());
  }
}

function form(data: Record<string, string | string[]>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else p.append(k, v);
  }
  return p.toString();
}

async function dmsFetch(
  jar: Jar, base: string, path: string,
  data?: Record<string, string | string[]>,
  ajax = true,
): Promise<{ status: number; location: string | null; text: string }> {
  const headers: Record<string, string> = { "User-Agent": UA };
  const ck = cookieHeader(jar);
  if (ck) headers.Cookie = ck;
  if (ajax) {
    headers["X-Requested-With"] = "XMLHttpRequest";
    headers.Referer = `${base}/catalog/unit-tree/info`;
  }
  const res = await fetch(base + path, {
    method: data ? "POST" : "GET",
    headers: {
      ...headers,
      ...(data ? { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" } : {}),
    },
    body: data ? form(data) : undefined,
    redirect: "manual",
  });
  storeCookies(jar, res);
  return {
    status: res.status,
    location: res.headers.get("location"),
    text: await res.text(),
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&agrave;/g, "à").replace(/&Agrave;/g, "À")
    .replace(/&aacute;/g, "á").replace(/&eacute;/g, "é")
    .replace(/&Ecirc;/g, "Ê").replace(/&ecirc;/g, "ê")
    .replace(/&ocirc;/g, "ô").replace(/&Ocirc;/g, "Ô")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function inputVal(page: string, id: string): string {
  const tag = new RegExp(`<(?:input|select)[^>]*id="${id}"[^>]*>`, "i").exec(page);
  if (!tag) return "";
  const v = /value="([^"]*)"/i.exec(tag[0]);
  return v ? decodeEntities(v[1]) : "";
}

export async function lookupStaff(code: string): Promise<DmsStaff> {
  const cfg = await getDmsImeiConfig();
  const missing = missingDmsImei(cfg);
  if (missing.length) throw new Error(`Chưa cấu hình DMS — thiếu: ${missing.join(", ")}`);
  const base = cfg.baseUrl.replace(/\/$/, "");
  const jar: Jar = new Map();
  const token = await login(jar, base, cfg.username!, cfg.password!);

  // Search exact theo ma
  const s = await dmsFetch(jar, base, "/catalog/unit-tree/search-staff-group", {
    "unitFilter.unitCode": code.trim(), page: "1", rows: "10",
  });
  let data: { rows?: Record<string, unknown>[]; token?: string };
  try {
    data = JSON.parse(s.text);
  } catch {
    throw new Error("DMS trả về không phải JSON (mất session?)");
  }
  const rows = (data.rows ?? []).filter(
    (r) => String(r.staffCode ?? "").toUpperCase() === code.trim().toUpperCase(),
  );
  if (!rows.length) throw new Error(`Không tìm thấy NV mã ${code.trim()}`);
  if (rows.length > 1) throw new Error(`Mã ${code.trim()} trùng ${rows.length} NV`);
  const r = rows[0];
  const staffId = Number(r.staffId ?? r.id);
  const shopId = Number(r.shopId);

  const v = await dmsFetch(jar, base, "/catalog/unit-tree/view-staff", {
    staffId: String(staffId), shopId: String(shopId),
  });
  if (!v.text.includes("imeiTabletStaff"))
    throw new Error("Không đọc được form NV (mất session?)");
  const imei = inputVal(v.text, "imeiTabletStaff");
  void token;
  void data.token;
  return {
    staffId, shopId,
    staffCode: String(r.staffCode ?? ""),
    staffName: decodeEntities(String(r.staffName ?? "")),
    imei,
  };
}

/** Clear IMEI + (tuy chon) unlock app. Verify rong that sau khi luu. */
export async function resetImei(code: string, unlock: boolean): Promise<DmsResetResult> {
  const cfg = await getDmsImeiConfig();
  const missing = missingDmsImei(cfg);
  if (missing.length) throw new Error(`Chưa cấu hình DMS — thiếu: ${missing.join(", ")}`);
  const base = cfg.baseUrl.replace(/\/$/, "");
  const jar: Jar = new Map();
  let token = await login(jar, base, cfg.username!, cfg.password!);

  const s = await dmsFetch(jar, base, "/catalog/unit-tree/search-staff-group", {
    "unitFilter.unitCode": code.trim(), page: "1", rows: "10",
  });
  let data: { rows?: Record<string, unknown>[]; token?: string };
  try {
    data = JSON.parse(s.text);
  } catch {
    throw new Error("DMS trả về không phải JSON (mất session?)");
  }
  token = data.token || token;
  const rows = (data.rows ?? []).filter(
    (r) => String(r.staffCode ?? "").toUpperCase() === code.trim().toUpperCase(),
  );
  if (!rows.length) throw new Error(`Không tìm thấy NV mã ${code.trim()}`);
  if (rows.length > 1) throw new Error(`Mã ${code.trim()} trùng ${rows.length} NV`);
  const r = rows[0];
  const staffId = Number(r.staffId ?? r.id);
  const shopId = Number(r.shopId);

  // view-staff: lay form hien tai de giu nguyen cac field khac
  const v = await dmsFetch(jar, base, "/catalog/unit-tree/view-staff", {
    staffId: String(staffId), shopId: String(shopId),
  });
  if (!v.text.includes("imeiTabletStaff"))
    throw new Error("Không đọc được form NV (mất session?)");
  const page = v.text;
  const imeiBefore = inputVal(page, "imeiTabletStaff");
  const attrIds = [...page.matchAll(/id="attributeId_\d+"[^>]*value="([^"]*)"/g)].map((m) => m[1]);
  const attrTypes = [...page.matchAll(/id="attributeColumnValueType_\d+"[^>]*value="([^"]*)"/g)].map((m) => m[1]);

  const payload: Record<string, string | string[]> = {
    staffId: inputVal(page, "staffId") || String(staffId),
    nodeTypeId: inputVal(page, "nodeTypeId"),
    nodeType: inputVal(page, "nodeType"),
    shopId: inputVal(page, "nodeShopId") || String(shopId),
    orgId: inputVal(page, "orgId"),
    staffCode: inputVal(page, "staffCode"),
    staffName: inputVal(page, "staffName"),
    gender: inputVal(page, "gender") || "-1",
    workStartDate: inputVal(page, "workStartDate"),
    status: inputVal(page, "status") || inputVal(page, "statusHidden") || "1",
    staffPhone: inputVal(page, "staffPhone"),
    staffTelephone: inputVal(page, "staffTelephone"),
    email: inputVal(page, "email"),
    areaId: inputVal(page, "areaId") || "-2",
    houseNumber: inputVal(page, "houseNumber"),
    imeiTabletStaff: "",
    isLockPBCT_NVBH: inputVal(page, "isLockPBCT_NVBH") || "0",
    token,
  };
  if (attrIds.length) {
    payload.lstAttributeId = attrIds;
    payload.lstAttributeColumnValueType = attrTypes;
    payload.lstAttributeValue = attrIds.map(() => "");
  }

  const save = await dmsFetch(jar, base, "/catalog/unit-tree/change-Staff-Info", payload);
  let res: { error?: boolean; errMsg?: string; token?: string };
  try {
    res = JSON.parse(save.text);
  } catch {
    throw new Error("Lưu thất bại: DMS không trả JSON");
  }
  token = res.token || token;
  if (res.error) throw new Error(`Lưu thất bại: ${res.errMsg ?? "không rõ"}`);

  // Verify: doc lai IMEI
  const v2 = await dmsFetch(jar, base, "/catalog/unit-tree/view-staff", {
    staffId: String(staffId), shopId: String(shopId),
  });
  const imeiAfter = inputVal(v2.text, "imeiTabletStaff");
  if (imeiAfter.trim()) throw new Error(`Clear thất bại: IMEI vẫn còn '${imeiAfter}'`);

  let unlocked = false;
  if (unlock) {
    const u = await dmsFetch(jar, base, "/catalog/unit-tree/unLockStatusApp", {
      staffId: String(staffId), token,
    });
    let ur: { error?: boolean; errMsg?: string };
    try {
      ur = JSON.parse(u.text);
    } catch {
      throw new Error("Mở khóa thất bại: DMS không trả JSON");
    }
    if (ur.error) throw new Error(`Mở khóa thất bại: ${ur.errMsg ?? "không rõ"}`);
    unlocked = true;
  }

  return {
    staff: {
      staffId, shopId,
      staffCode: String(r.staffCode ?? ""),
      staffName: decodeEntities(String(r.staffName ?? "")),
      imei: imeiAfter,
    },
    imeiBefore,
    imeiAfter,
    unlocked,
  };
}

export type DmsPassResult = {
  staffCode: string;
  staffName: string;
};

/** Reset password NV ve mac dinh. Server tu set, khong can biet gia tri. */
export async function resetPasscode(code: string): Promise<DmsPassResult> {
  const cfg = await getDmsImeiConfig();
  const missing = missingDmsImei(cfg);
  if (missing.length) throw new Error(`Chưa cấu hình DMS — thiếu: ${missing.join(", ")}`);
  const base = cfg.baseUrl.replace(/\/$/, "");
  const jar: Jar = new Map();
  let token = await login(jar, base, cfg.username!, cfg.password!);

  const s = await dmsFetch(jar, base, "/catalog/unit-tree/search-staff-group", {
    "unitFilter.unitCode": code.trim(), page: "1", rows: "10",
  });
  let data: { rows?: Record<string, unknown>[]; token?: string };
  try {
    data = JSON.parse(s.text);
  } catch {
    throw new Error("DMS trả về không phải JSON (mất session?)");
  }
  token = data.token || token;
  const rows = (data.rows ?? []).filter(
    (r) => String(r.staffCode ?? "").toUpperCase() === code.trim().toUpperCase(),
  );
  if (!rows.length) throw new Error(`Không tìm thấy NV mã ${code.trim()}`);
  const r = rows[0];
  const staffId = Number(r.staffId ?? r.id);

  const p = await dmsFetch(jar, base, "/catalog/unit-tree/resetPass", {
    staffId: String(staffId), token,
  });
  let res: { error?: boolean; errMsg?: string };
  try {
    res = JSON.parse(p.text);
  } catch {
    throw new Error("Reset pass thất bại: DMS không trả JSON");
  }
  if (res.error) throw new Error(`Reset pass thất bại: ${res.errMsg ?? "không rõ"}`);
  return {
    staffCode: String(r.staffCode ?? ""),
    staffName: decodeEntities(String(r.staffName ?? "")),
  };
}

async function login(jar: Jar, base: string, user: string, pass: string): Promise<string> {
  const g = await dmsFetch(jar, base, "/login", undefined, false);
  const lt = /name="lt" value="([^"]*)"/.exec(g.text)?.[1] ?? "";
  // POST credentials, manual redirect de bat 302
  const res = await fetch(base + "/login", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      ...(cookieHeader(jar) ? { Cookie: cookieHeader(jar) } : {}),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: user, password: pass, lt, _eventId: "submit" }).toString(),
    redirect: "manual",
  });
  storeCookies(jar, res);
  const loc = res.headers.get("location") ?? "";
  if (!/index\.jsp|\/home/.test(loc))
    throw new Error("Đăng nhập DMS thất bại (sai user/pass?)");
  // Hoan tat session context (thieu la AJAX bi da ve login)
  for (const p of ["/home", "/catalog/unit-tree/info"]) {
    const r = await fetch(base + p, {
      headers: { "User-Agent": UA, ...(cookieHeader(jar) ? { Cookie: cookieHeader(jar) } : {}) },
      redirect: "manual",
    });
    storeCookies(jar, r);
    await r.text().catch(() => "");
  }
  return "";
}
