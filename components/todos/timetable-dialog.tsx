"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COLOR_CONFIGS,
  DAYS_OF_WEEK,
  SESSIONS,
  type ColorPreset,
  type SessionType,
  type TimetableItemDTO,
} from "@/lib/timetable-constants";
import { cn } from "@/lib/utils";

interface TimetableDialogProps {
  open: boolean;
  item: TimetableItemDTO | null;
  initialDayOfWeek?: number;
  onClose: () => void;
  onSaved: () => void;
}

export function TimetableDialog({
  open,
  item,
  initialDayOfWeek = 1,
  onClose,
  onSaved,
}: TimetableDialogProps) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDayOfWeek);
  const [subject, setSubject] = useState("");
  const [session, setSession] = useState<SessionType>("MORNING");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<ColorPreset>("orange");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setDayOfWeek(item.dayOfWeek);
      setSubject(item.subject);
      setSession(item.session);
      setStartTime(item.startTime ?? "");
      setEndTime(item.endTime ?? "");
      setLocation(item.location ?? "");
      setNote(item.note ?? "");
      setColor((item.color as ColorPreset) || "orange");
    } else {
      setDayOfWeek(initialDayOfWeek);
      setSubject("");
      setSession("MORNING");
      setStartTime("08:00");
      setEndTime("11:30");
      setLocation("");
      setNote("");
      setColor("orange");
    }
  }, [item, initialDayOfWeek, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sub = subject.trim();
    if (!sub) {
      toast.error("Vui lòng nhập tên công việc hoặc môn học!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dayOfWeek,
        subject: sub,
        session,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        location: location.trim() || null,
        note: note.trim() || null,
        color,
      };

      const url = item ? `/api/timetable/${item.id}` : "/api/timetable";
      const method = item ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Thao tác thất bại");
      }

      toast.success(item ? "Đã cập nhật thời khóa biểu!" : "Đã thêm vào thời khóa biểu!");
      onSaved();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa tiết/công việc "${item.subject}"?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/timetable/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa khỏi thời khóa biểu!");
      onSaved();
      onClose();
      router.refresh();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-editorial text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            {item ? "Sửa tiết / lịch tuần" : "Thêm vào thời khóa biểu"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* 1. Chọn ngày trong tuần */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Ngày trong tuần</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setDayOfWeek(d.day)}
                  className={cn(
                    "cursor-pointer rounded-xs border-2 border-[#1C1917] py-2 text-center text-xs font-black transition-all",
                    dayOfWeek === d.day
                      ? "bg-primary text-primary-foreground shadow-neo-sm"
                      : "bg-white text-foreground hover:bg-[#FAF7F0] dark:bg-card"
                  )}
                >
                  <div className="text-[11px] leading-none">{d.short}</div>
                  <div className="text-[9px] font-normal opacity-80 mt-0.5">{d.day === 7 ? "CN" : `T${d.day}`}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tên công việc / Môn học */}
          <div className="space-y-1.5">
            <Label htmlFor="tt-subject" className="text-xs font-bold text-foreground">
              Tên công việc / Môn học / Hoạt động <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tt-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="VD: Đối soát DMS 5.2, Học HSK3, Họp phòng CNTT..."
              autoFocus
              className="text-xs sm:text-sm"
            />
          </div>

          {/* 3. Phân buổi & Khung giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Buổi trong ngày</Label>
              <div className="flex flex-col gap-1">
                {SESSIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSession(s.id);
                      if (!startTime && !endTime) {
                        if (s.id === "MORNING") {
                          setStartTime("08:00");
                          setEndTime("11:30");
                        } else if (s.id === "AFTERNOON") {
                          setStartTime("13:30");
                          setEndTime("17:30");
                        } else {
                          setStartTime("19:30");
                          setEndTime("21:30");
                        }
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-xs border border-[#1C1917] px-2 py-1 text-left text-xs font-bold transition-all",
                      session === s.id
                        ? "bg-[#1C1917] text-white shadow-neo-sm dark:bg-primary"
                        : "bg-white text-muted-foreground hover:bg-[#FAF7F0] dark:bg-card"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tt-start" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Bắt đầu
              </Label>
              <Input
                id="tt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tt-end" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Kết thúc
              </Label>
              <Input
                id="tt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* 4. Địa điểm / Phòng */}
          <div className="space-y-1.5">
            <Label htmlFor="tt-location" className="text-xs font-bold text-foreground flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" /> Địa điểm / Phòng họp / Nền tảng
            </Label>
            <Input
              id="tt-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Văn phòng HNF, Phòng họp HO, Bàn làm việc, Meet..."
              className="text-xs sm:text-sm"
            />
          </div>

          {/* 5. Ghi chú chi tiết */}
          <div className="space-y-1.5">
            <Label htmlFor="tt-note" className="text-xs font-bold text-foreground">
              Ghi chú nội dung / Yêu cầu
            </Label>
            <Textarea
              id="tt-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm mục tiêu, tài liệu cần chuẩn bị..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* 6. Chọn màu sắc nhận diện */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
              <Sparkles className="size-3.5 text-primary" /> Màu sắc phân loại
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(COLOR_CONFIGS).map(([colKey, cfg]) => (
                <button
                  key={colKey}
                  type="button"
                  onClick={() => setColor(colKey as ColorPreset)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xs border-2 p-1.5 transition-all text-center cursor-pointer",
                    cfg.border,
                    cfg.bgClass,
                    color === colKey ? "shadow-neo ring-2 ring-[#1C1917]" : "opacity-75 hover:opacity-100"
                  )}
                >
                  <span className={cn("size-3.5 rounded-full border border-[#1C1917]", cfg.badgeBg)} />
                  <span className="text-[10px] font-bold truncate max-w-full">
                    {cfg.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="gap-1 text-xs"
              >
                <Trash2 className="size-3.5" /> Xóa tiết
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading || !subject.trim()}>
                {loading ? "Đang lưu..." : item ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
