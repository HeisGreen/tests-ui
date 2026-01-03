import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[0.9375rem] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#32d74b]/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#32d74b] to-[#4ade80] text-white hover:from-[#28c143] hover:to-[#32d74b] shadow-[0_4px_12px_rgba(50,215,75,0.3)] hover:shadow-[0_8px_20px_rgba(50,215,75,0.4)] hover:-translate-y-[2px] active:translate-y-0",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.3)]",
        outline:
          "border-2 border-black/[0.08] bg-white/80 text-[#1d1d1f] hover:bg-white hover:border-[#32d74b]/30 hover:-translate-y-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        secondary:
          "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5e7]",
        ghost: "hover:bg-black/5 text-[#1d1d1f]",
        link: "text-[#32d74b] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
