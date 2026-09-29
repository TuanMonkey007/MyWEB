import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white/80 dark:shadow-[2px_2px_0px_#000000]",
        outline:
          "border-2 border-[#1C1917] bg-card text-foreground shadow-neo-sm hover:bg-muted hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white/80 dark:shadow-[2px_2px_0px_#000000]",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white/80",
        ghost:
          "hover:bg-muted hover:text-foreground active:translate-x-[1px] active:translate-y-[1px]",
        destructive:
          "bg-destructive text-white border-2 border-[#1C1917] shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-white/80",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8.5 gap-2 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6.5 gap-1 rounded-xs px-2 text-xs in-data-[slot=button-group]:rounded-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 rounded-sm px-2.5 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 rounded-sm px-4 text-sm font-bold has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8.5 rounded-sm",
        "icon-xs":
          "size-6.5 rounded-xs in-data-[slot=button-group]:rounded-xs [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 rounded-sm in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
