import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/12 bg-primary/[0.08] text-primary",
        secondary:
          "border-border/70 bg-secondary text-secondary-foreground",
        destructive:
          "border-red-200/70 bg-red-50/80 text-red-700",
        outline: "border border-border text-foreground",
        success:
          "border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
        warning:
          "border-amber-200/70 bg-amber-50/85 text-amber-700",
        info:
          "border-blue-200/70 bg-blue-50/80 text-blue-700",
        danger:
          "border-red-200/70 bg-red-50/80 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} suppressHydrationWarning {...props} />
  );
}

export { Badge, badgeVariants };
