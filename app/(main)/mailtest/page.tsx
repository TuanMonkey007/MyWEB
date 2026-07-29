import { MailRelay } from "@/components/mailtest/mail-relay";
import { currentDriver, missingMailEnv } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Đọc cấu hình mail phía server (API key không bao giờ xuống client),
// chỉ truyền xuống thông tin hiển thị được.
export default function MailTestPage() {
  const missing = missingMailEnv();
  return (
    <MailRelay
      driver={currentDriver()}
      from={process.env.MAIL_FROM ?? null}
      missing={missing}
    />
  );
}
