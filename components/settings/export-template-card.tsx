"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Quản lý file mẫu xuất phiếu đề xuất mua hàng (.xlsx có logo/định dạng công ty)
export function ExportTemplateCard({
  templateName,
}: {
  templateName: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/settings/export-template", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Upload thất bại");
      }
      toast.success("Đã lưu file mẫu — từ giờ xuất Excel sẽ điền vào mẫu này");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    await fetch("/api/settings/export-template", { method: "DELETE" });
    toast.success("Đã gỡ file mẫu — xuất Excel quay về layout dựng sẵn");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mẫu xuất phiếu đề xuất mua hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            handleUpload(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          {templateName ? (
            <Badge variant="secondary" className="gap-1.5 py-1.5 text-xs">
              <FileSpreadsheet className="size-3.5" /> {templateName}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Chưa có mẫu — xuất Excel đang dùng layout dựng sẵn
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading ? "Đang tải..." : templateName ? "Thay mẫu" : "Tải mẫu lên"}
          </Button>
          {templateName && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="size-4" /> Gỡ mẫu
            </Button>
          )}
        </div>

        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            Nhận file <b>.xlsx</b> mẫu của công ty (giữ nguyên logo, định dạng). Hệ
            thống tìm dòng tiêu đề có ô <b>&quot;STT&quot;</b> rồi điền hạng mục vào các
            dòng kẻ sẵn bên dưới; thiếu dòng sẽ tự chèn thêm.
          </li>
          <li>
            Các ô &quot;Tổng ngân sách dự kiến:…&quot;, &quot;Ngày… tháng… năm…&quot;,
            &quot;Bộ phận đề xuất:…&quot; được điền tự động nếu có trong mẫu.
          </li>
          <li>
            Cột <b>N</b> ghi tiền dự trù từng mục (nằm ngoài vùng in A:M của mẫu — in
            từ Excel không dính).
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
