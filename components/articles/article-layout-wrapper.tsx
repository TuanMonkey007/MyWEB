"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ArticleLayoutWrapper({
  sidebar,
  children,
  defaultPosition = "left",
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: "left" | "right";
}) {
  const [position, setPosition] = useState<"left" | "right">(defaultPosition);

  useEffect(() => {
    const saved = localStorage.getItem("hnf_article_sidebar_pos");
    if (saved === "left" || saved === "right") {
      setPosition(saved);
    }
  }, []);

  function togglePosition() {
    const next = position === "left" ? "right" : "left";
    setPosition(next);
    localStorage.setItem("hnf_article_sidebar_pos", next);
  }

  return (
    <div className="space-y-4">
      {/* Nút chuyển đổi vị trí cột nhanh chóng */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={togglePosition}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xs border border-[#1C1917] bg-white px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-neo-sm hover:bg-[#FAF7F0] hover:text-foreground dark:bg-card transition-all"
          title="Chuyển đổi vị trí thanh sidebar sang Trái hoặc Phải"
        >
          <Columns2 className="size-3.5 text-primary" />
          <span>Vị trí thanh bên: <b>{position === "left" ? "Bên Trái" : "Bên Phải"}</b></span>
          <ArrowLeftRight className="size-3 ml-0.5 text-primary" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Cột Sidebar */}
        <div
          className={cn(
            "lg:col-span-4",
            position === "right" ? "lg:order-2" : "lg:order-1"
          )}
        >
          <div className="lg:sticky lg:top-20 space-y-6">
            {sidebar}
          </div>
        </div>

        {/* Cột Nội dung chính */}
        <div
          className={cn(
            "min-w-0 lg:col-span-8",
            position === "right" ? "lg:order-1" : "lg:order-2"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
