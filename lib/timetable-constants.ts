export type SessionType = "MORNING" | "AFTERNOON" | "EVENING";

export type ColorPreset = "orange" | "emerald" | "blue" | "purple" | "amber" | "rose";

export interface TimetableItemDTO {
  id: string;
  dayOfWeek: number; // 1 = T2, 2 = T3, ..., 7 = CN
  subject: string;
  session: SessionType;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  note: string | null;
  color: ColorPreset | string;
  createdAt: string;
  updatedAt: string;
}

export const DAYS_OF_WEEK = [
  { day: 1, label: "Thứ 2", short: "T2", full: "Thứ Hai" },
  { day: 2, label: "Thứ 3", short: "T3", full: "Thứ Ba" },
  { day: 3, label: "Thứ 4", short: "T4", full: "Thứ Tư" },
  { day: 4, label: "Thứ 5", short: "T5", full: "Thứ Năm" },
  { day: 5, label: "Thứ 6", short: "T6", full: "Thứ Sáu" },
  { day: 6, label: "Thứ 7", short: "T7", full: "Thứ Bảy" },
  { day: 7, label: "Chủ Nhật", short: "CN", full: "Chủ Nhật" },
] as const;

export const SESSIONS: { id: SessionType; label: string; timeRange: string }[] = [
  { id: "MORNING", label: "Buổi Sáng", timeRange: "07:30 – 11:30" },
  { id: "AFTERNOON", label: "Buổi Chiều", timeRange: "13:30 – 17:30" },
  { id: "EVENING", label: "Buổi Tối", timeRange: "19:00 – 22:30" },
];

export const COLOR_CONFIGS: Record<
  string,
  {
    label: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    bgClass: string;
    tagBg: string;
  }
> = {
  orange: {
    label: "Cam (DMS / Trọng tâm)",
    border: "border-primary",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
    bgClass: "bg-[#FDF1EA] dark:bg-[#2C1F15]",
    tagBg: "border-primary/40 bg-primary/10 text-primary",
  },
  emerald: {
    label: "Xanh lá (Vận hành / Hoàn thành)",
    border: "border-emerald-600",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    bgClass: "bg-emerald-50/90 dark:bg-emerald-950/30",
    tagBg: "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  blue: {
    label: "Xanh dương (Học HSK / Nghiên cứu)",
    border: "border-blue-600",
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    bgClass: "bg-blue-50/90 dark:bg-blue-950/30",
    tagBg: "border-blue-600/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  purple: {
    label: "Tím (Họp hành / Giao ban)",
    border: "border-purple-600",
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    bgClass: "bg-purple-50/90 dark:bg-purple-950/30",
    tagBg: "border-purple-600/40 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  amber: {
    label: "Vàng Hổ Phách (Thể thao / Cá nhân)",
    border: "border-amber-500",
    badgeBg: "bg-amber-400",
    badgeText: "text-stone-900",
    bgClass: "bg-amber-50/90 dark:bg-amber-950/30",
    tagBg: "border-amber-500/40 bg-amber-400/20 text-amber-800 dark:text-amber-400",
  },
  rose: {
    label: "Đỏ Hồng (Ưu tiên / Deadline)",
    border: "border-rose-600",
    badgeBg: "bg-rose-600",
    badgeText: "text-white",
    bgClass: "bg-rose-50/90 dark:bg-rose-950/30",
    tagBg: "border-rose-600/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

/** Lấy ngày hôm nay theo hệ 1 = Thứ 2 ... 7 = Chủ Nhật (chuẩn ISO) */
export function getCurrentDayOfWeek(): number {
  const d = new Date().getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  return d === 0 ? 7 : d;
}
