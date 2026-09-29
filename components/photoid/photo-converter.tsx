"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Download,
  ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCan } from "@/components/permissions-provider";
import { KHO_ANH, type KhoAnh } from "@/lib/photo-id-constants";
import { cn } from "@/lib/utils";

type Anh = {
  id: string;
  tenGoc: string;
  tenMoi: string;
  theoKhuonMat: boolean;
  /** Số điểm ảnh dư để dịch khung; 0 = hết chỗ theo chiều đó */
  duNgang: number;
  duDoc: number;
  loi?: string;
};

type Chinh = { lechNgang: number; lechDoc: number; phongTo: number };
const CHINH_0: Chinh = { lechNgang: 0, lechDoc: 0, phongTo: 0 };
const BUOC = 12; // mỗi lần nhích 12% — đủ thấy mà không nhảy quá xa

export function PhotoConverter() {
  const canRun = useCan()("photoid", "run");
  const fileRef = useRef<HTMLInputElement>(null);
  const [kho, setKho] = useState<KhoAnh>("3x4");
  const [dangChay, setDangChay] = useState(false);
  const [phien, setPhien] = useState<string | null>(null);
  const [danhSach, setDanhSach] = useState<Anh[]>([]);
  const [chinh, setChinh] = useState<Record<string, Chinh>>({});
  // đổi số này để ép trình duyệt tải lại ảnh sau khi cắt lại
  const [lamMoi, setLamMoi] = useState<Record<string, number>>({});
  const [dangCat, setDangCat] = useState<string | null>(null);
  const [keo, setKeo] = useState(false);

  const thanhCong = danhSach.filter((a) => !a.loi);
  const thatBai = danhSach.filter((a) => a.loi);

  async function xuLy(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return toast.error("Chưa chọn ảnh nào (chỉ nhận file ảnh)");

    setDangChay(true);
    try {
      const form = new FormData();
      form.append("kho", kho);
      for (const f of arr) form.append("files", f);
      const res = await fetch("/api/anh-the/xu-ly", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Xử lý thất bại");
      setPhien(data.phien);
      setDanhSach(data.ketQua);
      setChinh({});
      setLamMoi({});
      const ok = data.ketQua.filter((a: Anh) => !a.loi).length;
      toast.success(`Đã chuyển ${ok}/${data.ketQua.length} ảnh`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xử lý thất bại");
    } finally {
      setDangChay(false);
    }
  }

  async function catLai(id: string, moi: Chinh) {
    if (!phien) return;
    setChinh((p) => ({ ...p, [id]: moi }));
    setDangCat(id);
    try {
      const res = await fetch("/api/anh-the/cat-lai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phien, id, kho, ...moi }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Cắt lại thất bại");
      // Phóng to làm khung nhỏ lại → sinh thêm chỗ dịch, phải cập nhật lại
      if (data && typeof data.duNgang === "number") {
        setDanhSach((ds) =>
          ds.map((a) => (a.id === id ? { ...a, duNgang: data.duNgang, duDoc: data.duDoc } : a))
        );
      }
      setLamMoi((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cắt lại thất bại");
    } finally {
      setDangCat(null);
    }
  }

  function nhich(id: string, dx: number, dy: number, dz = 0) {
    const cu = chinh[id] ?? CHINH_0;
    catLai(id, {
      lechNgang: Math.max(-100, Math.min(100, cu.lechNgang + dx)),
      lechDoc: Math.max(-100, Math.min(100, cu.lechDoc + dy)),
      phongTo: Math.max(0, Math.min(60, cu.phongTo + dz)),
    });
  }

  async function taiTatCa() {
    if (!phien || thanhCong.length === 0) return;
    try {
      const res = await fetch("/api/anh-the/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phien,
          anh: thanhCong.map((a) => ({ id: a.id, ten: a.tenMoi })),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Tải thất bại");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anh-the-${thanhCong.length}-anh.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          <ImageIcon className="size-5 text-primary" /> Chuyển ảnh sang khổ thẻ
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Nhận ảnh chụp kiểu gì cũng được (ngang, dọc, vuông, ảnh điện thoại) rồi cắt
          về đúng khổ 3×4 — <b>cắt bớt phần thừa chứ không kéo giãn</b>, nên mặt không
          bị méo. Tự dò khuôn mặt để đặt khung; ảnh nào lệch thì nhích lại bằng tay.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Khổ ảnh</Label>
              <Select value={kho} onValueChange={(v) => setKho(v as KhoAnh)} disabled={!canRun}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KHO_ANH).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label} — {v.w}×{v.h}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="pb-2 text-xs text-muted-foreground">
              Ảnh xuất ra 300 DPI, in ra đúng kích thước thật.
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) xuLy(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!canRun || dangChay}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setKeo(true);
            }}
            onDragLeave={() => setKeo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setKeo(false);
              if (canRun && e.dataTransfer.files.length) xuLy(e.dataTransfer.files);
            }}
            className={cn(
              "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 transition-colors",
              keo ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
              (!canRun || dangChay) && "cursor-not-allowed opacity-50"
            )}
          >
            {dangChay ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-sm">Đang xử lý…</span>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium">Kéo thả ảnh vào đây, hoặc bấm để chọn</span>
                <span className="text-xs text-muted-foreground">
                  Chọn được nhiều ảnh cùng lúc — tối đa 200 ảnh, mỗi ảnh 25MB
                </span>
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {thatBai.length > 0 && (
        <Card>
          <CardContent className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-600">
              <AlertTriangle className="size-4" /> {thatBai.length} ảnh không xử lý được
            </p>
            {thatBai.map((a) => (
              <p key={a.id} className="text-xs text-muted-foreground">
                {a.tenGoc} — {a.loi}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {thanhCong.length > 0 && phien && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">
              Kết quả · {thanhCong.length} ảnh
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                bấm mũi tên để nhích khung nếu ảnh nào lệch
              </span>
            </CardTitle>
            <Button onClick={taiTatCa}>
              <Download className="size-4" /> Tải tất cả (.zip)
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {thanhCong.map((a) => {
                const c = chinh[a.id] ?? CHINH_0;
                const daChinh = c.lechNgang !== 0 || c.lechDoc !== 0 || c.phongTo !== 0;
                return (
                  <div key={a.id} className="space-y-1.5">
                    <div className="relative overflow-hidden rounded-md border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/anh-the/xem/${phien}/${a.id}?v=${lamMoi[a.id] ?? 0}`}
                        alt={`Ảnh thẻ của ${a.tenGoc}`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      {dangCat === a.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      )}
                      {!a.theoKhuonMat && (
                        <Badge
                          variant="secondary"
                          className="absolute left-1 top-1 text-[10px]"
                          title="Không dò được khuôn mặt — nên kiểm tra lại ảnh này"
                        >
                          cần xem lại
                        </Badge>
                      )}
                    </div>

                    <p className="truncate text-xs" title={a.tenGoc}>
                      {a.tenGoc}
                    </p>

                    <div className="flex flex-wrap items-center gap-0.5">
                      {[
                        { icon: MoveLeft, label: "Nhích sang trái", dx: -BUOC, dy: 0, dz: 0, can: "ngang" },
                        { icon: MoveRight, label: "Nhích sang phải", dx: BUOC, dy: 0, dz: 0, can: "ngang" },
                        { icon: MoveUp, label: "Nhích lên", dx: 0, dy: -BUOC, dz: 0, can: "doc" },
                        { icon: MoveDown, label: "Nhích xuống", dx: 0, dy: BUOC, dz: 0, can: "doc" },
                        { icon: Maximize2, label: "Cắt sát mặt hơn", dx: 0, dy: 0, dz: BUOC, can: "" },
                        { icon: Minimize2, label: "Lấy rộng hơn", dx: 0, dy: 0, dz: -BUOC, can: "" },
                      ].map(({ icon: Icon, label, dx, dy, dz, can }) => {
                        // Hết chỗ dịch theo chiều nào thì khoá nút chiều đó — bấm
                        // mà ảnh không đổi thì người dùng tưởng hỏng
                        const hetCho =
                          (can === "ngang" && a.duNgang < 2) || (can === "doc" && a.duDoc < 2);
                        return (
                        <button
                          key={label}
                          type="button"
                          title={
                            hetCho
                              ? `${label} — khung đã lấy trọn chiều này, bấm "Cắt sát mặt hơn" để có chỗ dịch`
                              : label
                          }
                          aria-label={`${label} — ${a.tenGoc}`}
                          disabled={dangCat === a.id || hetCho}
                          onClick={() => nhich(a.id, dx, dy, dz)}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
                        >
                          <Icon className="size-3.5" />
                        </button>
                        );
                      })}
                      {daChinh && (
                        <button
                          type="button"
                          title="Về khung tự động"
                          aria-label={`Về khung tự động — ${a.tenGoc}`}
                          onClick={() => catLai(a.id, CHINH_0)}
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}
                      <a
                        href={`/api/anh-the/xem/${phien}/${a.id}?v=${lamMoi[a.id] ?? 0}`}
                        download={a.tenMoi}
                        title="Tải riêng ảnh này"
                        aria-label={`Tải riêng — ${a.tenGoc}`}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Download className="size-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" />
              Ảnh giữ trên máy chủ 2 giờ rồi tự xoá. Tải về trước khi đóng trang.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
