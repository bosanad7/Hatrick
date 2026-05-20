import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-[var(--badge-default-bg)] text-[var(--badge-default-text)]",
        secondary:   "bg-[var(--badge-secondary-bg)] text-[var(--badge-secondary-text)]",
        destructive: "bg-[var(--badge-destructive-bg)] text-[var(--badge-destructive-text)]",
        warning:     "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]",
        outline:     "border border-[var(--badge-outline-border)] text-[var(--badge-outline-text)]",
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
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
