"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  CalendarCheck2,
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COLOR_CONFIGS,
  DAYS_OF_WEEK,
  getCurrentDayOfWeek,
  SESSIONS,
  type SessionType,
  type TimetableItemDTO,
} from "@/lib/timetable-constants";
import { cn } from "@/lib/utils";
import { TimetableDialog } from "./timetable-dialog";
import { useCan, NO_PERM } from "@/components/permissions-provider";

export function TimetableView({ items: initialItems }: { items: TimetableItemDTO[] }) {
  const router = useRouter();
  const can = useCan();
  const canCreate = can("todos", "create");
  const canEdit = can("todos", "edit");

  const [items, setItems] = useState<TimetableItemDTO[]>(initialItems);
  const [viewMode, setViewMode] = useState<"grid" | "today" | "list">("grid");
  const [todayDayOfWeek] = useState<number>(getCurrentDayOfWeek());
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    item: TimetableItemDTO | null;
    initialDayOfWeek?: number;
  }>({
    open: false,
    item: null,
  });
  const [seeding, setSeeding] = useState(false);

  // Nhóm theo ngày
  const itemsByDay = DAYS_OF_WEEK.reduce((acc, d) => {
    acc[d.day] = items.filter((i) => i.dayOfWeek === d.day);
    return acc;
  }, {} as Record<number, TimetableItemDTO[]>);

  // Nạp nhanh lịch mẫu
  async function handleSeedSample() {
    setSeeding(true);
    try {
      const res = await fetch("/api/timetable/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể nạp lịch mẫu");
      toast.success(data.message || "Đã nạp thời khóa biểu mẫu!");
      router.refresh();
      // Fetch lại dữ liệu
      const getRes = await fetch("/api/timetable");
      if (getRes.ok) setItems(await getRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nạp lịch mẫu thất bại");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4 pt-6">
      {/* ── HEADER KHỐI THỜI KHÓA BIỂU ── */}
      <div className="rounded-xs border-2 border-[#1C1917] bg-white p-5 shadow-neo dark:bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xs border border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm">
                <CalendarCheck2 className="size-4" />
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
                Thời khóa biểu &amp; Lịch tuần
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>Lịch trình cố định &amp; hoạt động học tập, vận hành lặp lại hàng tuần.</span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-xs border border-[#1C1917] bg-[#FDF1EA] px-2 py-0.2 text-xs font-black text-primary shadow-neo-sm dark:bg-[#2C1F15]">
                <Sparkles className="size-2.5 text-primary" /> Hôm nay:{" "}
                {DAYS_OF_WEEK.find((d) => d.day === todayDayOfWeek)?.full}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chế độ xem */}
            <div className="flex rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-0.5 shadow-neo-sm dark:bg-[#22170F]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" /> Lưới tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode("today")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1",
                  viewMode === "today"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="size-3.5" /> Theo ngày
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "cursor-pointer rounded-xs px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-neo-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" /> Danh sách
              </button>
            </div>

            {/* Nạp mẫu nếu trống */}
            {items.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedSample}
                disabled={seeding || !canCreate}
                className="text-xs gap-1 border-2 border-[#1C1917] shadow-neo-sm hover:shadow-neo"
              >
                <RotateCcw className="size-3.5 text-primary" />
                {seeding ? "Đang nạp..." : "Nạp lịch mẫu"}
              </Button>
            )}

            {/* Nút Thêm mới */}
            <Button
              size="sm"
              disabled={!canCreate}
              title={canCreate ? undefined : NO_PERM}
              onClick={() =>
                setDialogState({
                  open: true,
                  item: null,
                  initialDayOfWeek: viewMode === "today" ? selectedDay : todayDayOfWeek,
                })
              }
              className="text-xs gap-1 shadow-neo-sm hover:shadow-neo"
            >
              <Plus className="size-3.5" /> Thêm tiết / lịch
            </Button>
          </div>
        </div>
      </div>

      {/* ── VIEW 1: LƯỚI TUẦN (WEEKLY GRID MATRIX 7 NGÀY) ── */}
      {viewMode === "grid" && (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[900px] grid-cols-7 gap-3">
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
                  {/* Header ngày */}
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
                        <span className="rounded-xs bg-[#1C1917] px-1 py-0.2 text-xs font-black text-amber-300">
                          HÔM NAY
                        </span>
                      )}
                    </div>
                    <span className="text-xs opacity-80">{dayItems.length} tiết</span>
                  </div>

                  {/* Danh sách tiết trong ngày */}
                  <div className="flex-1 space-y-2 p-2 min-h-[380px] bg-[#FAF7F0]/40 dark:bg-transparent">
                    {dayItems.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground/60">
                        <span className="text-xs">Trống</span>
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
                            className="mt-1 text-xs font-bold text-primary hover:underline"
                          >
                            + Thêm
                          </button>
                        )}
                      </div>
                    ) : (
                      dayItems.map((item) => (
                        <TimetableCard
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
                        className="w-full rounded-xs py-1 text-xs font-bold text-muted-foreground hover:bg-[#FAF7F0] hover:text-primary transition-all dark:hover:bg-[#22170F]"
                      >
                        + Thêm tiết
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW 2: THEO NGÀY (DAY / TODAY VIEW - CỰC KỲ TIỆN TRÊN MOBILE) ── */}
      {viewMode === "today" && (
        <div className="space-y-4">
          {/* Thanh chọn ngày trong tuần */}
          <div className="grid grid-cols-7 gap-1.5 rounded-xs border-2 border-[#1C1917] bg-white p-2 shadow-neo dark:bg-card">
            {DAYS_OF_WEEK.map((d) => {
              const count = (itemsByDay[d.day] || []).length;
              const isCurrent = d.day === selectedDay;
              const isToday = d.day === todayDayOfWeek;

              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDay(d.day)}
                  className={cn(
                    "cursor-pointer rounded-xs border-2 py-2 text-center transition-all",
                    isCurrent
                      ? "border-[#1C1917] bg-primary text-primary-foreground shadow-neo-sm font-black"
                      : "border-transparent bg-[#FAF7F0] text-foreground hover:border-[#1C1917] dark:bg-[#22170F]"
                  )}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <span>{d.short}</span>
                    {isToday && <span className="size-1.5 rounded-full bg-amber-400" />}
                  </div>
                  <div className="text-xs opacity-80 font-mono mt-0.5">
                    {count} tiết
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chi tiết các buổi trong ngày được chọn */}
          <div className="rounded-xs border-2 border-[#1C1917] bg-white p-4 sm:p-6 shadow-neo dark:bg-card space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-3">
              <div>
                <h3 className="font-editorial text-lg sm:text-xl font-bold uppercase text-foreground">
                  Lịch trình {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.full}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {(itemsByDay[selectedDay] || []).length} hoạt động / tiết học đã lên lịch
                </p>
              </div>

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
                  className="text-xs gap-1"
                >
                  <Plus className="size-3.5" /> Thêm vào {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.short}
                </Button>
              )}
            </div>

            {/* Phân theo 3 buổi: Sáng, Chiều, Tối */}
            <div className="grid gap-4 md:grid-cols-3">
              {SESSIONS.map((session) => {
                const sessionItems = (itemsByDay[selectedDay] || []).filter(
                  (i) => i.session === session.id
                );

                return (
                  <div
                    key={session.id}
                    className="flex flex-col rounded-xs border-2 border-[#1C1917] bg-[#FAF7F0] p-3 shadow-neo-sm dark:bg-[#1E1712]"
                  >
                    <div className="flex items-center justify-between border-b border-[#1C1917]/20 pb-2 mb-3">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-foreground">
                        {session.id === "MORNING" ? (
                          <Sun className="size-4 text-amber-500" />
                        ) : session.id === "AFTERNOON" ? (
                          <Sunset className="size-4 text-orange-500" />
                        ) : (
                          <Moon className="size-4 text-indigo-500" />
                        )}
                        <span>{session.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {session.timeRange}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {sessionItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground/60 italic">
                          Không có lịch
                        </div>
                      ) : (
                        sessionItems.map((item) => (
                          <TimetableCard
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            onClick={() => setDialogState({ open: true, item })}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: DANH SÁCH TỔNG HỢP (LIST VIEW) ── */}
      {viewMode === "list" && (
        <div className="rounded-xs border-2 border-[#1C1917] bg-white shadow-neo dark:bg-card overflow-hidden">
          <div className="border-b-2 border-[#1C1917] bg-[#F5EFEB] px-4 py-3 dark:bg-[#22170F] flex items-center justify-between">
            <span className="font-editorial text-sm font-bold uppercase tracking-wider text-foreground">
              Toàn bộ thời khóa biểu ({items.length} tiết)
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
                      <TimetableCard
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

      {/* ── DIALOG THÊM / SỬA TIẾT ── */}
      <TimetableDialog
        open={dialogState.open}
        item={dialogState.item}
        initialDayOfWeek={dialogState.initialDayOfWeek ?? todayDayOfWeek}
        onClose={() => setDialogState({ open: false, item: null })}
        onSaved={async () => {
          const res = await fetch("/api/timetable");
          if (res.ok) setItems(await res.json());
        }}
      />
    </div>
  );
}

/** Thẻ hiển thị một tiết / hoạt động trong thời khóa biểu */
function TimetableCard({
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
        {/* Khung giờ & Buổi */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="flex items-center gap-1 text-xs font-black font-mono text-foreground">
            <Clock className="size-3 text-primary shrink-0" />
            {item.startTime ? `${item.startTime} - ${item.endTime || ""}` : "Cả buổi"}
          </span>

          <span
            className={cn(
              "rounded-xs border border-[#1C1917] px-1.5 py-0.2 text-xs font-black uppercase shadow-neo-sm",
              cfg.badgeBg,
              cfg.badgeText
            )}
          >
            {item.session === "MORNING" ? "Sáng" : item.session === "AFTERNOON" ? "Chiều" : "Tối"}
          </span>
        </div>

        {/* Tiêu đề môn học / công việc */}
        <h4 className="font-editorial text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.subject}
        </h4>

        {/* Ghi chú */}
        {item.note && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.note}
          </p>
        )}
      </div>

      {/* Địa điểm / Phòng */}
      {item.location && (
        <div className="mt-2 pt-1.5 border-t border-[#1C1917]/15 flex items-center gap-1 text-xs font-semibold text-muted-foreground truncate">
          <MapPin className="size-3 text-primary shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
      )}
    </div>
  );
}
