import { getCurrentUser } from "@/lib/auth";
import { MailRelay } from "@/components/mailtest/mail-relay";
import { FIELD_META, getMailConfig, missingFields } from "@/lib/mail";
import { maskSecret } from "@/lib/secret-box";

export const dynamic = "force-dynamic";

// Đọc cấu hình mail phía server. API key KHÔNG bao giờ xuống client — chỉ gửi
// bản che (re_a••••WXYZ) và cờ "đã có key hay chưa".
export default async function MailTestPage() {
  const user = await getCurrentUser();
  const cfg = await getMailConfig();

  const isAdmin = user?.role === "ADMIN";
  const values: Record<string, string | null> = {};
  const hasSecret: Record<string, boolean> = {};

  for (const [field, meta] of Object.entries(FIELD_META)) {
    const v = cfg.values[field as keyof typeof cfg.values];
    if (!meta.secret) {
      values[field] = v;
      continue;
    }
    // Bí mật: chỉ admin mới thấy bản che; user thường không nhận gì cả
    hasSecret[field] = isAdmin && !!v;
    values[field] = isAdmin && v ? maskSecret(v) : null;
  }

  return (
    <MailRelay
      isAdmin={isAdmin}
      config={{
        driver: cfg.driver,
        values,
        hasSecret,
        sources: isAdmin ? cfg.sources : {},
        broken: isAdmin ? cfg.broken : [],
        missing: missingFields(cfg).map((f) => FIELD_META[f].label),
      }}
    />
  );
}
