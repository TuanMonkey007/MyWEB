import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xs border-2 border-[#1C1917] bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-neo-sm hover:border-[#1C1917] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-card dark:border-white/80 dark:shadow-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
