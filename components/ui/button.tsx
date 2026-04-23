import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(33,150,243,0.22)] hover:bg-primary/92 hover:shadow-[0_14px_30px_rgba(33,150,243,0.28)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20 hover:-translate-y-[1px] active:translate-y-0",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:-translate-y-[1px] active:translate-y-0",
        secondary:
          "border border-subtle bg-white text-foreground shadow-sm hover:bg-[hsl(var(--surface-hover))]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-[0.5px] active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "btn-gradient text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-[1px] active:translate-y-0",
        public:
          "public-pill bg-[hsl(var(--public-primary))] text-[hsl(var(--public-primary-foreground))] shadow-[0_14px_28px_rgba(33,150,243,0.22)] hover:-translate-y-[1px] hover:bg-[hsl(var(--public-primary))]/92 hover:shadow-[0_18px_34px_rgba(33,150,243,0.28)]",
        "public-outline":
          "public-pill border border-[hsl(var(--public-border))] bg-white text-[hsl(var(--public-ink))] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:-translate-y-[1px] hover:border-primary/25 hover:bg-[hsl(var(--public-primary-soft))]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-xl px-3.5",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
