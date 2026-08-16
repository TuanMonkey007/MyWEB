"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Loader2,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCan } from "@/components/permissions-provider";
import { MailConfigCard, type MailConfigView } from "@/components/mailtest/mail-config-card";

type Attempt = {
  at: string;
  to: string;
  subject: string;
  ok: boolean;
  detail: string;
};

const MAU_HTML = `<div style="font-family:Arial,sans-serif;line-height:1.6">
  <h2>Xin chào 👋</h2>
  <p>Đây là mail thử nghiệm gửi từ <b>MyWEB</b>.</p>
</div>`;

export function MailRelay({
  isAdmin,
  config,
}: {
  isAdmin: boolean;
  config: MailConfigView;
}) {
  const canSend = useCan()("mailtest", "send");
  const { driver, missing } = config;
  const from = config.values.from;
  const ready = missing.length === 0;

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Mail thử nghiệm từ MyWEB");
  const [content, setContent] = useState("Chào bạn,\n\nĐây là mail thử nghiệm.\n");
  const [asHtml, setAsHtml] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const disabled = !canSend || !ready || sending;

  function log(entry: Attempt) {
    setAttempts((prev) => [entry, ...prev].slice(0, 20));
  }

  async function send() {
    if (!to.trim()) return toast.error("Nhập địa chỉ người nhận");
    if (!subject.trim()) return toast.error("Nhập tiêu đề");
    if (!content.trim()) return toast.error("Nhập nội dung");

    setSending(true);
    const at = new Date().toLocaleTimeString("vi-VN");
    try {
      const res = await fetch("/api/mailtest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, content, asHtml }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Gửi thất bại");
      log({
        at,
        to: (data.to as string[]).join(", "),
        subject,
        ok: true,
        detail: `id ${data.id ?? "(không có)"} · qua ${data.driver}`,
      });
      toast.success("Đã gửi mail");
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Gửi thất bại";
      log({ at, to, subject, ok: false, detail });
      toast.error(detail);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Mail className="size-6" /> Test Mail Relay
        </h1>
        <p className="text-sm text-muted-foreground">
          Gửi mail thử qua nhà cung cấp đang cấu hình để kiểm tra API key, bản ghi
          DNS (SPF/DKIM/DMARC) và khả năng vào hộp thư đến.
        </p>
      </div>

      {/* Trạng thái cấu hình — đọc từ .env phía server */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cấu hình hiện tại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Nhà cung cấp:</span>
            <Badge variant={driver === "log" ? "secondary" : "default"}>{driver}</Badge>
            {driver === "log" && (
              <span className="text-xs text-muted-foreground">
                (chế độ log — mail chỉ in ra console máy chủ, KHÔNG gửi thật)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Gửi từ:</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {from ?? "chưa đặt MAIL_FROM"}
            </code>
          </div>
          {!ready && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                Chưa gửi được — còn thiếu: <b>{missing.join(", ")}</b>.{" "}
                {isAdmin ? "Điền ở phần Cấu hình mail bên dưới." : "Nhờ quản trị viên cấu hình."}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && <MailConfigCard config={config} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Soạn mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-xs">
              Địa chỉ đích
            </Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="ten.ban@gmail.com — nhiều người thì cách nhau dấu phẩy (tối đa 5)"
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs">
              Tiêu đề
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="content" className="text-xs">
                Nội dung
              </Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={asHtml}
                    onChange={(e) => setAsHtml(e.target.checked)}
                    disabled={disabled}
                    className="size-3.5 accent-primary"
                  />
                  <Code2 className="size-3.5" /> Gửi dạng HTML
                </label>
                {asHtml && (
                  <button
                    type="button"
                    onClick={() => setContent(MAU_HTML)}
                    disabled={disabled}
                    className="text-xs text-primary underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    chèn mẫu
                  </button>
                )}
              </div>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              disabled={disabled}
              className={asHtml ? "font-mono text-xs" : undefined}
              placeholder={asHtml ? "<p>Nội dung HTML...</p>" : "Nội dung mail..."}
            />
            <p className="text-xs text-muted-foreground">
              {asHtml
                ? "Nội dung được gửi nguyên dạng HTML (kèm bản text tự sinh cho mail client cũ)."
                : "Gửi dạng văn bản thuần — xuống dòng được giữ nguyên."}
            </p>
          </div>

          <Button
            onClick={send}
            disabled={disabled}
            title={
              !canSend
                ? "Bạn không có quyền gửi mail"
                : !ready
                  ? "Chưa cấu hình mail"
                  : undefined
            }
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Đang gửi...
              </>
            ) : (
              <>
                <Send className="size-4" /> Gửi mail
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {attempts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lần gửi gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attempts.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  a.ok
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                {a.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {a.to} — {a.subject}
                  </div>
                  <div className="break-words text-xs text-muted-foreground">
                    {a.at} · {a.detail}
                  </div>
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Mail không thấy trong hộp thư đến? Kiểm tra thư mục Spam — nếu nằm ở
              đó thì bản ghi SPF/DKIM/DMARC của tên miền cần rà lại.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
