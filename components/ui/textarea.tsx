import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xs border-2 border-[#1C1917] bg-white px-3 py-2 text-sm font-medium text-foreground transition-all duration-150 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-neo-sm disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-card dark:border-white/80 dark:shadow-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
