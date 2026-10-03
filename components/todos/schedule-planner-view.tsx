"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Moon,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Sun,
  Sunset,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COLOR_CONFIGS,
  DAYS_OF_WEEK,
  formatDateISO,
  formatDateVN,
  getCurrentDayOfWeek,
  getDayOfWeekFromDate,
  getStartOfWeek,
  getWeekDates,
  isItemForDate,
  parseDateISO,
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

  const today = new Date();
  const todayISO = formatDateISO(today);

  const [items, setItems] = useState<TimetableItemDTO[]>(initialItems);
  const [viewMode, setViewMode] = useState<"timeline" | "grid" | "month" | "year" | "list">("timeline");
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [seeding, setSeeding] = useState(false);

  // 1. Ngày đang được chọn cho Timeline view (mặc định là hôm nay)
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayISO);

  // 2. Tuần đang được chọn cho Weekly Grid view (mặc định là tuần hiện tại)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(today));

  // 3. Tháng & Năm đang được chọn cho Month view & Year view
  const [viewMonthDate, setViewMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    item: TimetableItemDTO | null;
    initialDateStr?: string;
    initialDayOfWeek?: number;
  }>({
    open: false,
    item: null,
  });

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    function updateClock() {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${h}:${m}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tính toán thông tin ngày đang chọn
  const currentDateObj = parseDateISO(currentDateStr);
  const currentDow = getDayOfWeekFromDate(currentDateObj);
  const currentDayInfo = DAYS_OF_WEEK.find((d) => d.day === currentDow);

  // Danh sách các hoạt động của ngày đang chọn trong Timeline
  const currentDayItems = items
    .filter((it) => isItemForDate(it, currentDateStr, currentDow))
    .sort((a, b) => {
      const timeA = a.startTime || "99:99";
      const timeB = b.startTime || "99:99";
      return timeA.localeCompare(timeB);
    });

  // Hoạt động của ngày hôm nay
  const todayDow = getCurrentDayOfWeek();
  const todayItems = items.filter((it) => isItemForDate(it, todayISO, todayDow));

  // Tuần hiện tại của currentDateStr để làm dải tab chọn ngày
  const weekOfCurrentDate = getWeekDates(getStartOfWeek(currentDateObj));

  // Chuyển ngày trong Timeline
  function goToPrevDay() {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() - 1);
    setCurrentDateStr(formatDateISO(d));
  }
  function goToNextDay() {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() + 1);
    setCurrentDateStr(formatDateISO(d));
  }
  function goToToday() {
    setCurrentDateStr(todayISO);
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  // Điều hướng tuần trong Weekly Grid
  function goToPrevWeek() {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  }
  function goToNextWeek() {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  }
  function goToCurrentWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  // Điều hướng tháng
  function goToPrevMonth() {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  function goToNextMonth() {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }
  function goToCurrentMonth() {
    const d = new Date();
    setViewMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  // Nạp nhanh lịch mẫu
  async function handleSeedSample() {
    setSeeding(true);
    try {
      const res = await fetch("/api/timetable/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể nạp lịch mẫu");
      toast.success(data.message || "Đã nạp lịch trình mẫu thành công!");
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
              <span>Mỗi ngày có lịch trình &amp; ghi chú công việc riêng biệt, hỗ trợ xem theo dòng thời gian, tuần, tháng và năm.</span>
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-0.5 text-[11px] font-black text-primary shadow-neo-sm dark:bg-[#2C1F15]">
                <Clock className="size-3 text-primary animate-pulse" />
                Hôm nay: {DAYS_OF_WEEK.find((d) => d.day === todayDow)?.full} ({formatDateVN(today)}) &bull; {currentTimeStr}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chuyển đổi 5 chế độ xem */}
            <div className="flex rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-0.5 shadow-neo-sm dark:bg-[#22170F] overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap",
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
                  "cursor-pointer rounded-xs px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" /> Lưới tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap",
                  viewMode === "month"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="size-3.5" /> Lịch tháng
              </button>
              <button
                type="button"
                onClick={() => setViewMode("year")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap",
                  viewMode === "year"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarRange className="size-3.5" /> Lịch năm
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap",
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
                  initialDateStr: currentDateStr,
                  initialDayOfWeek: currentDow,
                })
              }
              className="text-xs gap-1.5 shadow-neo-sm hover:shadow-neo"
            >
              <Plus className="size-3.5" /> Thêm lịch trình
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="mt-4 pt-3.5 border-t-2 border-[#1C1917] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-foreground">
              Tổng số khung lịch đã lưu: <b className="text-primary font-black font-mono">{items.length}</b>
            </span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="font-bold text-foreground">
              Hôm nay ({formatDateVN(today)}): <b className="text-emerald-600 font-black font-mono">{todayItems.length} hoạt động</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Màu phân loại:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
              <span className="size-2 rounded-full bg-primary" /> DMS
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <span className="size-2 rounded-full bg-blue-600" /> HSK3
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
          {/* Thanh điều hướng ngày: Hôm trước - Hôm nay - Hôm sau & Datepicker */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:bg-card">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevDay}
                className="h-8 border-2 border-[#1C1917] shadow-neo-sm font-bold gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" /> Hôm trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className={cn(
                  "h-8 border-2 border-[#1C1917] shadow-neo-sm font-black text-xs",
                  currentDateStr === todayISO ? "bg-primary text-primary-foreground" : "bg-white dark:bg-card"
                )}
              >
                Hôm nay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDay}
                className="h-8 border-2 border-[#1C1917] shadow-neo-sm font-bold gap-1 text-xs"
              >
                Hôm sau <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Datepicker trực tiếp */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Chọn ngày:</span>
              <Input
                type="date"
                value={currentDateStr}
                onChange={(e) => e.target.value && setCurrentDateStr(e.target.value)}
                className="h-8 w-40 text-xs font-mono font-bold bg-[#FAF7F0] dark:bg-[#1E1712] border-[#1C1917]"
              />
            </div>
          </div>

          {/* Dải 7 ngày của tuần chứa ngày đang xem (kèm ngày tháng thực tế) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 rounded-xs border-2 border-[#1C1917] bg-white p-2 sm:p-2.5 shadow-neo dark:bg-card">
            {weekOfCurrentDate.map((w) => {
              const count = items.filter((it) => isItemForDate(it, w.dateStr, w.dayOfWeek)).length;
              const isSelected = w.dateStr === currentDateStr;
              const isToday = w.dateStr === todayISO;

              return (
                <button
                  key={w.dateStr}
                  type="button"
                  onClick={() => setCurrentDateStr(w.dateStr)}
                  className={cn(
                    "cursor-pointer rounded-xs border-2 py-2 sm:py-2.5 text-center transition-all",
                    isSelected
                      ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm font-black"
                      : "border-transparent bg-[#FAF7F0] text-foreground hover:border-[#1C1917] dark:bg-[#22170F]"
                  )}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <span>{w.dayShort}</span>
                    {isToday && (
                      <span className="size-2 rounded-full bg-amber-400 ring-1 ring-[#1C1917]" title="Hôm nay" />
                    )}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 font-semibold opacity-95">
                    {w.date.getDate()}/{w.date.getMonth() + 1}
                  </div>
                  <div className="text-[9.5px] opacity-80 font-mono mt-0.5">
                    {count > 0 ? `${count} lịch` : "—"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dòng thời gian chi tiết của ngày đang chọn */}
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 sm:p-7 shadow-neo dark:bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1C1917] pb-3 mb-6">
              <div>
                <h2 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-foreground flex items-center gap-2">
                  <span>{currentDayInfo?.full}, ngày {formatDateVN(currentDateObj)}</span>
                  {currentDateStr === todayISO && (
                    <span className="rounded-xs border border-[#1C1917] bg-amber-400 px-2 py-0.5 text-[10px] font-black text-stone-900 shadow-neo-sm">
                      HÔM NAY
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentDayItems.length} hoạt động / ghi chú được sắp xếp riêng cho ngày này
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
                      initialDateStr: currentDateStr,
                      initialDayOfWeek: currentDow,
                    })
                  }
                  className="text-xs gap-1 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
                >
                  <Plus className="size-3.5 text-primary" /> Thêm lịch ngày {formatDateVN(currentDateObj)}
                </Button>
              )}
            </div>

            {currentDayItems.length === 0 ? (
              <div className="rounded-xs border-2 border-dashed border-[#1C1917] py-16 text-center text-muted-foreground space-y-2">
                <Calendar className="size-8 mx-auto text-muted-foreground/60" />
                <p className="font-editorial text-base font-bold text-foreground">
                  Chưa có lịch trình ghi chú cho ngày {formatDateVN(currentDateObj)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lịch trình được gắn riêng theo từng ngày. Bấm nút dưới để thêm công việc riêng cho ngày này.
                </p>
                {canCreate && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setDialogState({
                        open: true,
                        item: null,
                        initialDateStr: currentDateStr,
                        initialDayOfWeek: currentDow,
                      })
                    }
                    className="mt-2 text-xs"
                  >
                    + Thêm lịch trình ngày {formatDateVN(currentDateObj)}
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1C1917]/25 dark:before:bg-stone-700">
                {currentDayItems.map((item) => {
                  const cfg = COLOR_CONFIGS[item.color] || COLOR_CONFIGS.orange;

                  const isCurrentTimeSlot =
                    currentDateStr === todayISO &&
                    item.startTime &&
                    item.endTime &&
                    currentTimeStr >= item.startTime &&
                    currentTimeStr <= item.endTime;

                  return (
                    <div key={item.id} className="relative group">
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

                      <div
                        onClick={canEdit ? () => setDialogState({ open: true, item, initialDateStr: currentDateStr }) : undefined}
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

                            {item.isRecurring && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground bg-white/70 dark:bg-card px-1.5 py-0.2 rounded-xs border border-[#1C1917]/30">
                                <Repeat className="size-2.5" /> Lặp lại
                              </span>
                            )}
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

      {/* ── CHẾ ĐỘ 2: LƯỚI TUẦN THỰC TẾ (WEEKLY GRID CỦA TUẦN ĐƯỢC CHỌN) ── */}
      {viewMode === "grid" && (
        <div className="space-y-4">
          {/* Thanh điều hướng Tuần */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs border-2 border-[#1C1917] bg-white p-3 shadow-neo dark:bg-card">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevWeek}
                className="h-8 border-2 border-[#1C1917] shadow-neo-sm font-bold gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" /> Tuần trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-8 border-2 border-[#1C1917] shadow-neo-sm font-bold text-xs"
              >
                Tuần này
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 border-2 border-[#1C1917] shadow-neo-sm font-bold gap-1 text-xs"
              >
                Tuần sau <ChevronRight className="size-3.5" />
              </Button>
            </div>

            <div className="font-editorial text-sm sm:text-base font-black text-foreground">
              Tuần: {formatDateVN(currentWeekStart)} – {formatDateVN(new Date(currentWeekStart.getTime() + 6 * 86400000))}
            </div>
          </div>

          {/* Lưới 7 ngày thực tế trong tuần */}
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[960px] grid-cols-7 gap-3">
              {getWeekDates(currentWeekStart).map((w) => {
                const dayItems = items
                  .filter((it) => isItemForDate(it, w.dateStr, w.dayOfWeek))
                  .sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
                const isToday = w.dateStr === todayISO;

                return (
                  <div
                    key={w.dateStr}
                    className={cn(
                      "flex flex-col rounded-xs border-2 bg-white shadow-neo transition-all dark:bg-card",
                      isToday
                        ? "border-primary ring-2 ring-primary/40 dark:border-primary"
                        : "border-[#1C1917]"
                    )}
                  >
                    {/* Header ngày */}
                    <div
                      className={cn(
                        "flex items-center justify-between border-b-2 border-[#1C1917] px-3 py-2 text-xs font-black uppercase tracking-wider",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "bg-[#F5EFEB] text-foreground dark:bg-[#22170F]"
                      )}
                    >
                      <div className="flex flex-col">
                        <span>{w.dayLabel}</span>
                        <span className="text-[10px] font-mono opacity-85">{w.date.getDate()}/{w.date.getMonth() + 1}</span>
                      </div>
                      {isToday ? (
                        <span className="rounded-xs bg-[#1C1917] px-1 py-0.2 text-[9px] font-black text-amber-300">
                          HÔM NAY
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-80 font-mono">{dayItems.length}</span>
                      )}
                    </div>

                    {/* Danh sách các khối lịch trình riêng của ngày */}
                    <div className="flex-1 space-y-2 p-2 min-h-[420px] bg-[#FAF7F0]/40 dark:bg-transparent">
                      {dayItems.length === 0 ? (
                        <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground/60">
                          <span className="text-[11px]">Không có lịch</span>
                          {canCreate && (
                            <button
                              type="button"
                              onClick={() =>
                                setDialogState({
                                  open: true,
                                  item: null,
                                  initialDateStr: w.dateStr,
                                  initialDayOfWeek: w.dayOfWeek,
                                })
                              }
                              className="mt-1 text-[10.5px] font-bold text-primary hover:underline"
                            >
                              + Thêm lịch
                            </button>
                          )}
                        </div>
                      ) : (
                        dayItems.map((item) => (
                          <ScheduleCard
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            onClick={() =>
                              setDialogState({
                                open: true,
                                item,
                                initialDateStr: w.dateStr,
                              })
                            }
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
                              initialDateStr: w.dateStr,
                              initialDayOfWeek: w.dayOfWeek,
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
        </div>
      )}

      {/* ── CHẾ ĐỘ 3: LỊCH THÁNG (MONTH CALENDAR VIEW - LỊCH GẮN THEO TỪNG NGÀY) ── */}
      {viewMode === "month" && (
        <MonthCalendarView
          viewMonthDate={viewMonthDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          items={items}
          todayISO={todayISO}
          canCreate={canCreate}
          canEdit={canEdit}
          onSelectDate={(dateStr) => {
            setCurrentDateStr(dateStr);
            setViewMode("timeline");
          }}
          onEditItem={(item, dateStr) => setDialogState({ open: true, item, initialDateStr: dateStr })}
          onAddForDate={(dateStr, dow) =>
            setDialogState({ open: true, item: null, initialDateStr: dateStr, initialDayOfWeek: dow })
          }
        />
      )}

      {/* ── CHẾ ĐỘ 4: LỊCH NĂM (YEAR OVERVIEW CALENDAR VIEW) ── */}
      {viewMode === "year" && (
        <YearCalendarView
          viewYear={viewYear}
          onPrevYear={() => setViewYear((y) => y - 1)}
          onNextYear={() => setViewYear((y) => y + 1)}
          onCurrentYear={() => setViewYear(today.getFullYear())}
          items={items}
          todayISO={todayISO}
          onSelectMonth={(monthIndex) => {
            setViewMonthDate(new Date(viewYear, monthIndex, 1));
            setViewMode("month");
          }}
          onSelectDate={(dateStr) => {
            setCurrentDateStr(dateStr);
            setViewMode("timeline");
          }}
        />
      )}

      {/* ── CHẾ ĐỘ 5: DANH SÁCH TỔNG HỢP (LIST VIEW - NHÓM THEO NGÀY CỤ THỂ) ── */}
      {viewMode === "list" && (
        <ListView
          items={items}
          canEdit={canEdit}
          onEditItem={(item) => setDialogState({ open: true, item, initialDateStr: item.date || todayISO })}
        />
      )}

      {/* ── DIALOG THÊM / SỬA KHUNG GIỜ LỊCH TRÌNH ── */}
      <TimetableDialog
        open={dialogState.open}
        item={dialogState.item}
        initialDateStr={dialogState.initialDateStr ?? currentDateStr}
        initialDayOfWeek={dialogState.initialDayOfWeek ?? currentDow}
        onClose={() => setDialogState({ open: false, item: null })}
        onSaved={async () => {
          const res = await fetch("/api/timetable");
          if (res.ok) setItems(await res.json());
        }}
      />
    </div>
  );
}

/** ── COMPONENT LỊCH THÁNG (MONTH CALENDAR VIEW - LỊCH GẮN THEO TỪNG NGÀY CỤ THỂ) ── */
function MonthCalendarView({
  viewMonthDate,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  items,
  todayISO,
  canCreate,
  canEdit,
  onSelectDate,
  onEditItem,
  onAddForDate,
}: {
  viewMonthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  items: TimetableItemDTO[];
  todayISO: string;
  canCreate: boolean;
  canEdit: boolean;
  onSelectDate: (dateStr: string) => void;
  onEditItem: (item: TimetableItemDTO, dateStr: string) => void;
  onAddForDate: (dateStr: string, dayOfWeek: number) => void;
}) {
  const year = viewMonthDate.getFullYear();
  const month = viewMonthDate.getMonth(); // 0-11

  // Ngày đầu tiên của tháng là thứ mấy (0 = CN, 1 = T2, ..., 6 = T7)
  const firstDayRaw = new Date(year, month, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7;

  // Số ngày trong tháng này & tháng trước
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    dayOfWeek: number;
    isToday: boolean;
  }[] = [];

  // Ô tháng trước
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const dObj = new Date(year, month - 1, dayNumber);
    const dateStr = formatDateISO(dObj);
    const dow = getDayOfWeekFromDate(dObj);
    cells.push({
      dayNumber,
      dateStr,
      isCurrentMonth: false,
      dayOfWeek: dow,
      isToday: dateStr === todayISO,
    });
  }

  // Ô tháng này
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = formatDateISO(dObj);
    const dow = getDayOfWeekFromDate(dObj);
    cells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      dayOfWeek: dow,
      isToday: dateStr === todayISO,
    });
  }

  // Ô tháng sau
  const remaining = 42 - cells.length >= 7 ? 35 - cells.length : 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const dObj = new Date(year, month + 1, d);
    const dateStr = formatDateISO(dObj);
    const dow = getDayOfWeekFromDate(dObj);
    cells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      dayOfWeek: dow,
      isToday: dateStr === todayISO,
    });
  }

  return (
    <div className="rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card overflow-hidden">
      {/* Header điều hướng Tháng */}
      <div className="border-b-2 border-[#1C1917] bg-[#F5EFEB] px-5 py-3.5 dark:bg-[#22170F] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-editorial text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Tháng {month + 1}, {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onCurrentMonth}
            className="h-7 text-xs border border-[#1C1917] shadow-neo-sm font-bold"
          >
            Tháng này
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMonth}
            className="size-8 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
            title="Tháng trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            className="size-8 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
            title="Tháng sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Lưới các cột thứ trong tuần */}
      <div className="grid grid-cols-7 border-b-2 border-[#1C1917] bg-[#FAF7F0] text-center text-xs font-black uppercase text-foreground dark:bg-[#1A120B]">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d.day} className="py-2.5 border-r border-[#1C1917]/20 last:border-r-0">
            <span className="hidden sm:inline">{d.full}</span>
            <span className="sm:hidden">{d.short}</span>
          </div>
        ))}
      </div>

      {/* Lưới các ô ngày trong tháng */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#1C1917]/20">
        {cells.map((cell) => {
          // Lọc đúng các item của riêng ngày cell.dateStr
          const dayItems = items.filter((it) => isItemForDate(it, cell.dateStr, cell.dayOfWeek));

          return (
            <div
              key={cell.dateStr}
              className={cn(
                "group relative min-h-[105px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors",
                cell.isCurrentMonth
                  ? "bg-white dark:bg-card hover:bg-[#FAF7F0]/60 dark:hover:bg-[#22170F]/50"
                  : "bg-stone-50/70 text-muted-foreground/50 dark:bg-stone-900/30",
                cell.isToday && "ring-2 ring-primary ring-inset bg-primary/5 dark:bg-primary/10"
              )}
            >
              {/* Ngày và huy hiệu */}
              <div className="flex items-center justify-between">
                <span
                  onClick={() => onSelectDate(cell.dateStr)}
                  className={cn(
                    "flex size-6 sm:size-7 items-center justify-center rounded-xs text-xs font-bold transition-all",
                    cell.isToday
                      ? "border border-[#1C1917] bg-primary font-black text-white shadow-neo-sm"
                      : cell.isCurrentMonth
                      ? "text-foreground font-mono cursor-pointer hover:bg-muted"
                      : "text-muted-foreground/40 font-mono"
                  )}
                  title={`Xem dòng thời gian ngày ${formatDateVN(cell.dateStr)}`}
                >
                  {cell.dayNumber}
                </span>

                {dayItems.length > 0 && (
                  <span
                    onClick={() => onSelectDate(cell.dateStr)}
                    className="cursor-pointer text-[10px] font-mono font-bold text-muted-foreground hover:text-primary"
                  >
                    {dayItems.length} hoạt động
                  </span>
                )}
              </div>

              {/* Danh sách các khối lịch trình riêng của ngày */}
              <div className="my-1 space-y-1 flex-1 overflow-hidden">
                {dayItems.slice(0, 3).map((item) => {
                  const cfg = COLOR_CONFIGS[item.color] || COLOR_CONFIGS.orange;
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canEdit) onEditItem(item, cell.dateStr);
                      }}
                      className={cn(
                        "cursor-pointer truncate rounded-xs border px-1.5 py-0.5 text-[10px] font-bold transition-all hover:scale-[1.02]",
                        cfg.tagBg,
                        cfg.border
                      )}
                      title={`${item.startTime || ""}: ${item.subject}`}
                    >
                      <span className="font-mono opacity-80">{item.startTime || "•"}</span>{" "}
                      <span>{item.subject}</span>
                    </div>
                  );
                })}

                {dayItems.length > 3 && (
                  <div
                    onClick={() => onSelectDate(cell.dateStr)}
                    className="cursor-pointer text-[9.5px] font-bold text-primary hover:underline text-center"
                  >
                    +{dayItems.length - 3} lịch khác...
                  </div>
                )}
              </div>

              {/* Nút thêm nhanh khi hover */}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => onAddForDate(cell.dateStr, cell.dayOfWeek)}
                  className="w-full rounded-xs py-0.5 text-[9px] font-bold text-muted-foreground/0 group-hover:text-primary group-hover:bg-[#FAF7F0] dark:group-hover:bg-[#22170F] transition-all text-center"
                >
                  + Thêm lịch
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ── COMPONENT LỊCH NĂM (YEAR CALENDAR VIEW - 12 THÁNG TỔNG QUAN) ── */
function YearCalendarView({
  viewYear,
  onPrevYear,
  onNextYear,
  onCurrentYear,
  items,
  todayISO,
  onSelectMonth,
  onSelectDate,
}: {
  viewYear: number;
  onPrevYear: () => void;
  onNextYear: () => void;
  onCurrentYear: () => void;
  items: TimetableItemDTO[];
  todayISO: string;
  onSelectMonth: (monthIndex: number) => void;
  onSelectDate: (dateStr: string) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header điều hướng Năm */}
      <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 sm:p-5 shadow-neo dark:bg-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-editorial text-xl sm:text-3xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
            <CalendarRange className="size-6 text-primary" />
            Năm {viewYear}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onCurrentYear}
            className="h-7 text-xs border border-[#1C1917] shadow-neo-sm font-bold"
          >
            Năm nay
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevYear}
            className="size-8 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
            title="Năm trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextYear}
            className="size-8 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
            title="Năm sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Lưới 12 mini-calendar cho 12 tháng */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((mIndex) => {
          const firstDayRaw = new Date(viewYear, mIndex, 1).getDay();
          const startOffset = (firstDayRaw + 6) % 7;
          const daysInMonth = new Date(viewYear, mIndex + 1, 0).getDate();

          return (
            <div
              key={mIndex}
              className="rounded-xs border-2 border-[#1C1917] bg-white p-3.5 shadow-neo transition-all hover:border-primary dark:bg-card"
            >
              {/* Header Tháng */}
              <div className="flex items-center justify-between border-b border-[#1C1917]/20 pb-2 mb-2">
                <button
                  type="button"
                  onClick={() => onSelectMonth(mIndex)}
                  className="font-editorial text-sm font-bold uppercase text-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Tháng {mIndex + 1}</span>
                  <span className="text-[10px] text-muted-foreground font-sans font-normal">&rarr;</span>
                </button>

                <span className="text-[10px] font-mono text-muted-foreground">
                  {daysInMonth} ngày
                </span>
              </div>

              {/* Tiêu đề 7 thứ trong tuần */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground mb-1">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span className="text-primary font-black">CN</span>
              </div>

              {/* Lưới các ngày trong tháng */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dateObj = new Date(viewYear, mIndex, d);
                  const dateStr = formatDateISO(dateObj);
                  const dow = getDayOfWeekFromDate(dateObj);
                  const dayItemsCount = items.filter((it) => isItemForDate(it, dateStr, dow)).length;
                  const isToday = dateStr === todayISO;

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDate(dateStr)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-xs py-1 transition-all",
                        isToday
                          ? "bg-primary font-black text-white shadow-neo-sm"
                          : "hover:bg-[#FAF7F0] dark:hover:bg-[#22170F]"
                      )}
                      title={`Ngày ${d}/${mIndex + 1}/${viewYear}: ${dayItemsCount} hoạt động`}
                    >
                      <span className={cn("text-[11px] font-mono", isToday ? "font-black" : "text-foreground")}>
                        {d}
                      </span>
                      {dayItemsCount > 0 && !isToday && (
                        <span className="size-1 rounded-full bg-primary/80 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ── COMPONENT DANH SÁCH TỔNG HỢP (LIST VIEW - NHÓM THEO NGÀY CỤ THỂ) ── */
function ListView({
  items,
  canEdit,
  onEditItem,
}: {
  items: TimetableItemDTO[];
  canEdit: boolean;
  onEditItem: (item: TimetableItemDTO) => void;
}) {
  // Gom nhóm các item theo ngày
  const groupedByDate: Record<string, TimetableItemDTO[]> = {};
  const recurringItems: TimetableItemDTO[] = [];

  items.forEach((item) => {
    if (item.date) {
      if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
      groupedByDate[item.date].push(item);
    } else if (item.isRecurring) {
      recurringItems.push(item);
    } else {
      const fallbackKey = "Chưa gắn ngày";
      if (!groupedByDate[fallbackKey]) groupedByDate[fallbackKey] = [];
      groupedByDate[fallbackKey].push(item);
    }
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort();

  return (
    <div className="rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card overflow-hidden space-y-4 p-4 sm:p-6">
      <div className="border-b-2 border-[#1C1917] pb-3">
        <h3 className="font-editorial text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
          Toàn bộ lịch trình &amp; ghi chú ({items.length} hoạt động)
        </h3>
      </div>

      {sortedDateKeys.length === 0 && recurringItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Chưa có lịch trình nào được lưu.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDateKeys.map((dateKey) => {
            const dateItems = groupedByDate[dateKey] || [];
            let headerLabel = dateKey;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
              const dObj = parseDateISO(dateKey);
              const dow = getDayOfWeekFromDate(dObj);
              const dowInfo = DAYS_OF_WEEK.find((d) => d.day === dow);
              headerLabel = `${dowInfo?.full}, ngày ${formatDateVN(dateKey)}`;
            }

            return (
              <div key={dateKey} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-xs border-2 border-[#1C1917] bg-primary px-2.5 py-0.5 text-xs font-black text-primary-foreground shadow-neo-sm">
                    {headerLabel}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground font-mono">
                    {dateItems.length} hoạt động
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dateItems.map((item) => (
                    <ScheduleCard
                      key={item.id}
                      item={item}
                      canEdit={canEdit}
                      onClick={() => onEditItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Nhóm lịch lặp lại hàng tuần nếu có */}
          {recurringItems.length > 0 && (
            <div className="pt-4 border-t-2 border-dashed border-[#1C1917]/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded-xs border-2 border-[#1C1917] bg-stone-800 text-white px-2.5 py-0.5 text-xs font-black shadow-neo-sm">
                  Lặp lại cố định các tuần
                </span>
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  {recurringItems.length} hoạt động
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recurringItems.map((item) => (
                  <ScheduleCard
                    key={item.id}
                    item={item}
                    canEdit={canEdit}
                    onClick={() => onEditItem(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
        "group relative flex flex-col justify-between rounded-xs border-2 p-3 shadow-neo-sm transition-all text-left",
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

          <div className="flex items-center gap-1">
            {item.isRecurring && (
              <span className="text-[9px] font-black uppercase rounded-xs bg-white/80 dark:bg-card px-1 py-0.2 border border-[#1C1917]/20 text-muted-foreground" title="Lặp lại hàng tuần">
                <Repeat className="size-2.5 inline" />
              </span>
            )}
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
        <div className="mt-2.5 pt-1.5 border-t border-[#1C1917]/15 flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground truncate">
          <MapPin className="size-3 text-primary shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
      )}
    </div>
  );
}
