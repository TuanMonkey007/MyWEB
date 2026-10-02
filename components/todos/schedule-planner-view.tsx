"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Sunset,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COLOR_CONFIGS,
  DAYS_OF_WEEK,
  getCurrentDayOfWeek,
  SESSIONS,
  type TimetableItemDTO,
} from "@/lib/timetable-constants";
import { cn } from "@/lib/utils";
import { TimetableDialog } from "./timetable-dialog";
import { useCan, NO_PERM } from "@/components/permissions-provider";

export function SchedulePlannerView({ items: initialItems }: { items: TimetableItemDTO[] }) {
  const router = useRouter();
  const can = useCan();
  const canCreate = can("todos", "create");
  const canEdit = can("todos", "edit");

  const [items, setItems] = useState<TimetableItemDTO[]>(initialItems);
  const [viewMode, setViewMode] = useState<"timeline" | "grid" | "list">("timeline");
  const [todayDayOfWeek] = useState<number>(getCurrentDayOfWeek());
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [seeding, setSeeding] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    item: TimetableItemDTO | null;
    initialDayOfWeek?: number;
  }>({
    open: false,
    item: null,
  });

  // Cập nhật giờ hiện tại mỗi phút
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${h}:${m}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Nhóm theo ngày trong tuần
  const itemsByDay = DAYS_OF_WEEK.reduce((acc, d) => {
    acc[d.day] = items.filter((i) => i.dayOfWeek === d.day);
    return acc;
  }, {} as Record<number, TimetableItemDTO[]>);

  // Danh sách các mục của ngày được chọn (sắp xếp theo giờ bắt đầu)
  const selectedDayItems = [...(itemsByDay[selectedDay] || [])].sort((a, b) => {
    const timeA = a.startTime || "99:99";
    const timeB = b.startTime || "99:99";
    return timeA.localeCompare(timeB);
  });

  const todayItems = itemsByDay[todayDayOfWeek] || [];

  // Nạp nhanh lịch mẫu
  async function handleSeedSample() {
    setSeeding(true);
    try {
      const res = await fetch("/api/timetable/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể nạp lịch mẫu");
      toast.success(data.message || "Đã nạp thời gian biểu mẫu thành công!");
      router.refresh();
      const getRes = await fetch("/api/timetable");
      if (getRes.ok) setItems(await getRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nạp lịch mẫu thất bại");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── BANNER HEADER THỜI GIAN BIỂU & LỊCH TRÌNH ── */}
      <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-6 shadow-neo dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xs border-2 border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm">
                <CalendarClock className="size-4.5" />
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
                Thời gian biểu &amp; Lịch trình
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Sắp xếp lịch trình công việc, học tập HSK &amp; sinh hoạt theo từng khung thời gian.</span>
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-0.5 text-[11px] font-black text-primary shadow-neo-sm dark:bg-[#2C1F15]">
                <Clock className="size-3 text-primary animate-pulse" />
                Hôm nay: {DAYS_OF_WEEK.find((d) => d.day === todayDayOfWeek)?.full} &bull; {currentTimeStr}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chuyển đổi 3 chế độ xem */}
            <div className="flex rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-0.5 shadow-neo-sm dark:bg-[#22170F]">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "cursor-pointer rounded-xs px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "timeline"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Timer className="size-3.5" /> Dòng thời gian
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "cursor-pointer rounded-xs px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" /> Lưới tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "cursor-pointer rounded-xs px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" /> Danh sách
              </button>
            </div>

            {/* Nạp mẫu nếu chưa có lịch */}
            {items.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedSample}
                disabled={seeding || !canCreate}
                className="text-xs gap-1.5 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
              >
                <RotateCcw className="size-3.5 text-primary" />
                {seeding ? "Đang nạp..." : "Nạp lịch mẫu"}
              </Button>
            )}

            {/* Nút thêm mới */}
            <Button
              size="sm"
              disabled={!canCreate}
              title={canCreate ? undefined : NO_PERM}
              onClick={() =>
                setDialogState({
                  open: true,
                  item: null,
                  initialDayOfWeek: selectedDay,
                })
              }
              className="text-xs gap-1.5 shadow-neo-sm hover:shadow-neo"
            >
              <Plus className="size-3.5" /> Thêm khung giờ
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="mt-4 pt-3.5 border-t-2 border-[#1C1917] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-foreground">
              Tổng số khung lịch trình: <b className="text-primary font-black font-mono">{items.length}</b>
            </span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="font-bold text-foreground">
              Lịch trình hôm nay: <b className="text-emerald-600 font-black font-mono">{todayItems.length} hoạt động</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Phân loại:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
              <span className="size-2 rounded-full bg-primary" /> DMS
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <span className="size-2 rounded-full bg-blue-600" /> HSK
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600">
              <span className="size-2 rounded-full bg-purple-600" /> Họp
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <span className="size-2 rounded-full bg-amber-500" /> Thể thao
            </span>
          </div>
        </div>
      </div>

      {/* ── CHẾ ĐỘ 1: DÒNG THỜI GIAN THEO NGÀY (TODAY / DAY TIMELINE) ── */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          {/* Thanh chọn ngày trong tuần (T2 - CN) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 rounded-xs border-2 border-[#1C1917] bg-white p-2 sm:p-2.5 shadow-neo dark:bg-card">
            {DAYS_OF_WEEK.map((d) => {
              const count = (itemsByDay[d.day] || []).length;
              const isSelected = d.day === selectedDay;
              const isToday = d.day === todayDayOfWeek;

              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  className={cn(
                    "cursor-pointer rounded-xs border-2 py-2 sm:py-2.5 text-center transition-all",
                    isSelected
                      ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm font-black"
                      : "border-transparent bg-[#FAF7F0] text-foreground hover:border-[#1C1917] dark:bg-[#22170F]"
                  )}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <span>{d.short}</span>
                    {isToday && (
                      <span className="size-2 rounded-full bg-amber-400 ring-1 ring-[#1C1917]" title="Hôm nay" />
                    )}
                  </div>
                  <div className="text-[10px] opacity-85 font-mono mt-0.5">
                    {count} khung giờ
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dòng thời gian chi tiết của ngày */}
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-7 shadow-neo dark:bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1C1917] pb-3 mb-6">
              <div>
                <h2 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-foreground flex items-center gap-2">
                  <span>Lịch trình {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.full}</span>
                  {selectedDay === todayDayOfWeek && (
                    <span className="rounded-xs border border-[#1C1917] bg-amber-400 px-2 py-0.5 text-[10px] font-black text-stone-900 shadow-neo-sm">
                      HÔM NAY
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDayItems.length} hoạt động được sắp xếp trong ngày
                </p>
              </div>

              {canCreate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDialogState({
                      open: true,
                      item: null,
                      initialDayOfWeek: selectedDay,
                    })
                  }
                  className="text-xs gap-1 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
                >
                  <Plus className="size-3.5 text-primary" /> Thêm vào {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.short}
                </Button>
              )}
            </div>

            {selectedDayItems.length === 0 ? (
              <div className="rounded-xs border-2 border-dashed border-[#1C1917] py-16 text-center text-muted-foreground space-y-2">
                <Calendar className="size-8 mx-auto text-muted-foreground/60" />
                <p className="font-editorial text-base font-bold text-foreground">
                  Chưa có lịch trình cho {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.full}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bấm &quot;Thêm khung giờ&quot; hoặc nạp lịch mẫu để sắp xếp công việc trong ngày.
                </p>
                {canCreate && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setDialogState({
                        open: true,
                        item: null,
                        initialDayOfWeek: selectedDay,
                      })
                    }
                    className="mt-2 text-xs"
                  >
                    + Tạo lịch trình đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1C1917]/25 dark:before:bg-stone-700">
                {selectedDayItems.map((item, idx) => {
                  const cfg = COLOR_CONFIGS[item.color] || COLOR_CONFIGS.orange;

                  // Kiểm tra xem khung giờ này có đang diễn ra không (nếu là hôm nay)
                  const isCurrentTimeSlot =
                    selectedDay === todayDayOfWeek &&
                    item.startTime &&
                    item.endTime &&
                    currentTimeStr >= item.startTime &&
                    currentTimeStr <= item.endTime;

                  return (
                    <div key={item.id} className="relative group">
                      {/* Điểm nút mốc giờ trên dòng thời gian */}
                      <div
                        className={cn(
                          "absolute -left-6 sm:-left-8 top-3 flex size-4 sm:size-5 items-center justify-center rounded-full border-2 border-[#1C1917] shadow-neo-sm transition-all",
                          isCurrentTimeSlot
                            ? "bg-red-500 ring-4 ring-red-400/40 animate-pulse"
                            : cfg.badgeBg
                        )}
                      >
                        <span className="size-1 rounded-full bg-white" />
                      </div>

                      {/* Khối nội dung lịch trình */}
                      <div
                        onClick={canEdit ? () => setDialogState({ open: true, item }) : undefined}
                        className={cn(
                          "rounded-xs border-2 p-4 shadow-neo-sm transition-all text-left",
                          cfg.border,
                          cfg.bgClass,
                          isCurrentTimeSlot && "ring-2 ring-red-500 shadow-neo",
                          canEdit && "cursor-pointer hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-foreground">
                              <Clock className="size-3.5 text-primary" />
                              {item.startTime ? `${item.startTime} – ${item.endTime || ""}` : "Cả buổi"}
                            </span>

                            <span
                              className={cn(
                                "rounded-xs border border-[#1C1917] px-2 py-0.2 text-[10px] font-black uppercase shadow-neo-sm",
                                cfg.badgeBg,
                                cfg.badgeText
                              )}
                            >
                              {item.session === "MORNING"
                                ? "Sáng"
                                : item.session === "AFTERNOON"
                                ? "Chiều"
                                : "Tối"}
                            </span>
                          </div>

                          {isCurrentTimeSlot && (
                            <span className="inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-neo-sm animate-pulse">
                              <Sparkles className="size-3" /> ĐANG DIỄN RA
                            </span>
                          )}
                        </div>

                        <h3 className="font-editorial text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {item.subject}
                        </h3>

                        {item.note && (
                          <p className="mt-1.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                            {item.note}
                          </p>
                        )}

                        {item.location && (
                          <div className="mt-3 pt-2 border-t border-[#1C1917]/15 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHẾ ĐỘ 2: LƯỚI TUẦN (WEEKLY SCHEDULE MATRIX 7 NGÀY) ── */}
      {viewMode === "grid" && (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[960px] grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((d) => {
              const dayItems = itemsByDay[d.day] || [];
              const isToday = d.day === todayDayOfWeek;

              return (
                <div
                  key={d.day}
                  className={cn(
                    "flex flex-col rounded-xs border-2 bg-white shadow-neo transition-all dark:bg-card",
                    isToday
                      ? "border-primary ring-2 ring-primary/40 dark:border-primary"
                      : "border-[#1C1917]"
                  )}
                >
                  {/* Cột Header ngày */}
                  <div
                    className={cn(
                      "flex items-center justify-between border-b-2 border-[#1C1917] px-3 py-2 text-xs font-black uppercase tracking-wider",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#F5EFEB] text-foreground dark:bg-[#22170F]"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{d.label}</span>
                      {isToday && (
                        <span className="rounded-xs bg-[#1C1917] px-1 py-0.2 text-[9px] font-black text-amber-300">
                          HÔM NAY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-80 font-mono">{dayItems.length}</span>
                  </div>

                  {/* Danh sách các khối lịch trình */}
                  <div className="flex-1 space-y-2 p-2 min-h-[420px] bg-[#FAF7F0]/40 dark:bg-transparent">
                    {dayItems.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground/60">
                        <span className="text-[11px]">Trống</span>
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() =>
                              setDialogState({
                                open: true,
                                item: null,
                                initialDayOfWeek: d.day,
                              })
                            }
                            className="mt-1 text-[10.5px] font-bold text-primary hover:underline"
                          >
                            + Thêm
                          </button>
                        )}
                      </div>
                    ) : (
                      dayItems.map((item) => (
                        <ScheduleCard
                          key={item.id}
                          item={item}
                          canEdit={canEdit}
                          onClick={() => setDialogState({ open: true, item })}
                        />
                      ))
                    )}
                  </div>

                  {/* Nút thêm nhanh dưới chân cột */}
                  {canCreate && (
                    <div className="border-t border-border/60 p-1.5 text-center bg-white dark:bg-card">
                      <button
                        type="button"
                        onClick={() =>
                          setDialogState({
                            open: true,
                            item: null,
                            initialDayOfWeek: d.day,
                          })
                        }
                        className="w-full rounded-xs py-1 text-[11px] font-bold text-muted-foreground hover:bg-[#FAF7F0] hover:text-primary transition-all dark:hover:bg-[#22170F]"
                      >
                        + Thêm lịch
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CHẾ ĐỘ 3: DANH SÁCH TỔNG HỢP (LIST VIEW) ── */}
      {viewMode === "list" && (
        <div className="rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card overflow-hidden">
          <div className="border-b-2 border-[#1C1917] bg-[#F5EFEB] px-5 py-3 dark:bg-[#22170F] flex items-center justify-between">
            <span className="font-editorial text-sm font-bold uppercase tracking-wider text-foreground">
              Toàn bộ lịch trình trong tuần ({items.length} hoạt động)
            </span>
          </div>

          <div className="divide-y-2 divide-border/60">
            {DAYS_OF_WEEK.map((d) => {
              const dayItems = itemsByDay[d.day] || [];
              if (dayItems.length === 0) return null;

              return (
                <div key={d.day} className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xs border-2 border-[#1C1917] bg-primary px-2.5 py-0.5 text-xs font-black text-primary-foreground shadow-neo-sm">
                      {d.full}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {dayItems.length} hoạt động
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dayItems.map((item) => (
                      <ScheduleCard
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        onClick={() => setDialogState({ open: true, item })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DIALOG THÊM / SỬA KHUNG GIỜ LỊCH TRÌNH ── */}
      <TimetableDialog
        open={dialogState.open}
        item={dialogState.item}
        initialDayOfWeek={dialogState.initialDayOfWeek ?? selectedDay}
        onClose={() => setDialogState({ open: false, item: null })}
        onSaved={async () => {
          const res = await fetch("/api/timetable");
          if (res.ok) setItems(await res.json());
        }}
      />
    </div>
  );
}

/** Thẻ hiển thị một khối thời gian trong lịch trình */
function ScheduleCard({
  item,
  canEdit,
  onClick,
}: {
  item: TimetableItemDTO;
  canEdit: boolean;
  onClick: () => void;
}) {
  const cfg = COLOR_CONFIGS[item.color] || COLOR_CONFIGS.orange;

  return (
    <div
      onClick={canEdit ? onClick : undefined}
      className={cn(
        "group relative flex flex-col justify-between rounded-xs border-2 p-2.5 shadow-neo-sm transition-all text-left",
        cfg.border,
        cfg.bgClass,
        canEdit && "cursor-pointer hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="flex items-center gap-1 text-[10.5px] font-black font-mono text-foreground">
            <Clock className="size-3 text-primary shrink-0" />
            {item.startTime ? `${item.startTime} - ${item.endTime || ""}` : "Cả buổi"}
          </span>

          <span
            className={cn(
              "rounded-xs border border-[#1C1917] px-1.5 py-0.2 text-[9px] font-black uppercase shadow-neo-sm",
              cfg.badgeBg,
              cfg.badgeText
            )}
          >
            {item.session === "MORNING" ? "Sáng" : item.session === "AFTERNOON" ? "Chiều" : "Tối"}
          </span>
        </div>

        <h4 className="font-editorial text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.subject}
        </h4>

        {item.note && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.note}
          </p>
        )}
      </div>

      {item.location && (
        <div className="mt-2 pt-1.5 border-t border-[#1C1917]/15 flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground truncate">
          <MapPin className="size-3 text-primary shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
      )}
    </div>
  );
}
