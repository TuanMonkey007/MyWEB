import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary/95 text-primary-foreground shadow-2xs [a]:hover:bg-primary",
        secondary:
          "bg-secondary text-secondary-foreground border-border/40 [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/25 dark:text-red-400 [a]:hover:bg-destructive/25",
        outline:
          "border-border/80 text-foreground bg-background/50 backdrop-blur-xs [a]:hover:bg-accent [a]:hover:text-accent-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        success:
          "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400 [a]:hover:bg-emerald-500/25",
        warning:
          "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400 [a]:hover:bg-amber-500/25",
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
