"use client";

import { useState } from "react";
import { BookOpen, FileSpreadsheet, PlayCircle, Sparkles, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleThumbnailProps {
  coverImage?: string | null;
  title: string;
  categoryName?: string | null;
  aspectRatio?: "video" | "square" | "compact";
  className?: string;
  priority?: boolean;
}

export function ArticleThumbnail({
  coverImage,
  title,
  categoryName,
  aspectRatio = "video",
  className,
}: ArticleThumbnailProps) {
  const [imgError, setImgError] = useState(false);

  // Nhận diện nếu bài viết có video minh họa
  const isVideoGuide =
    title.toLowerCase().includes("video") ||
    title.toLowerCase().includes("hd") ||
    title.toLowerCase().includes("hướng dẫn");

  // Đường dẫn ảnh
  const imageSrc = coverImage
    ? coverImage.startsWith("/") || coverImage.startsWith("http")
      ? coverImage
      : `/api/anh-bai-viet/${coverImage}`
    : null;

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[4/3]";

  if (imageSrc && !imgError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xs border-2 border-[#1C1917] bg-stone-100 shadow-neo-sm transition-all group-hover:shadow-neo dark:bg-stone-900",
          aspectClass,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Huy hiệu Video nhỏ góc trên nếu là video */}
        {isVideoGuide && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-xs border border-[#1C1917] bg-[#1C1917]/85 px-1.5 py-0.5 text-[10px] font-black text-white shadow-neo-sm backdrop-blur-xs">
            <PlayCircle className="size-3 text-red-500 fill-white" />
            <span>VIDEO</span>
          </div>
        )}

        {categoryName && (
          <div className="absolute top-2 left-2 rounded-xs border border-[#1C1917] bg-white/95 px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-primary shadow-neo-sm backdrop-blur-xs dark:bg-card">
            {categoryName}
          </div>
        )}
      </div>
    );
  }

  // Fallback Neo-Brutalism Thumbnail sang trọng & ấn tượng
  const isDMS = (categoryName || "").toLowerCase().includes("dms") || title.toLowerCase().includes("dms");

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-xs border-2 border-[#1C1917] p-3 shadow-neo-sm transition-all group-hover:shadow-neo",
        isDMS
          ? "bg-gradient-to-br from-[#FAF7F0] via-[#FDF1EA] to-[#F3ECE2] dark:from-[#22170F] dark:to-[#2C1F15]"
          : "bg-gradient-to-br from-[#FAF7F0] to-[#EAE4D8] dark:from-[#1E1712] dark:to-[#271E16]",
        aspectClass,
        className
      )}
    >
      {/* Họa tiết lưới mờ trang trí */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(#1C1917 1px, transparent 1px), radial-gradient(#1C1917 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      />

      {/* Dải sọc trang trí góc trên */}
      <div className="absolute -right-8 -top-8 size-20 rotate-12 rounded-xs border-2 border-[#1C1917] bg-primary/20" />

      {/* Top Header của Thumbnail */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-xs border border-[#1C1917] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary shadow-neo-sm dark:bg-card">
          {categoryName || "HNF DOCS"}
        </span>

        {isVideoGuide ? (
          <div className="flex size-7 items-center justify-center rounded-xs border border-[#1C1917] bg-red-500 text-white shadow-neo-sm">
            <Video className="size-3.5" />
          </div>
        ) : isDMS ? (
          <div className="flex size-7 items-center justify-center rounded-xs border border-[#1C1917] bg-emerald-600 text-white shadow-neo-sm">
            <FileSpreadsheet className="size-3.5" />
          </div>
        ) : (
          <div className="flex size-7 items-center justify-center rounded-xs border border-[#1C1917] bg-amber-400 text-stone-900 shadow-neo-sm">
            <BookOpen className="size-3.5" />
          </div>
        )}
      </div>

      {/* Center Icon hoặc Chữ ký hiệu */}
      <div className="relative z-10 my-auto text-center">
        <div className="font-editorial text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground/90 line-clamp-2 leading-none">
          {title.slice(0, 36)}
        </div>
      </div>

      {/* Bottom Footer của Thumbnail */}
      <div className="relative z-10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground border-t border-[#1C1917]/20 pt-1.5">
        <span className="flex items-center gap-1">
          <Sparkles className="size-2.5 text-primary" /> HNF DATA &bull; DMS
        </span>
        <span className="text-primary font-bold">XEM NGAY &rarr;</span>
      </div>
    </div>
  );
}
