import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xs border-2 border-[#1C1917] px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-neo-sm transition-all focus-visible:ring-2 focus-visible:ring-ring dark:border-white/80 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-[#FFEBEE] text-[#B71C1C] dark:bg-destructive/30 dark:text-red-400",
        outline:
          "text-foreground bg-card [a]:hover:bg-accent",
        ghost:
          "border-transparent shadow-none hover:bg-muted",
        success:
          "bg-[#E8F5E9] text-[#1B5E20] dark:bg-emerald-950/40 dark:text-emerald-400",
        warning:
          "bg-[#FFF3E0] text-[#E65100] dark:bg-amber-950/40 dark:text-amber-400",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
