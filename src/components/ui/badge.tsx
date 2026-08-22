import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-tight transition-mirats-fast focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80",
        outline:
          "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground",
        success: "bg-success/10 text-success border-success/20 dark:bg-success/20",
        warning: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/20",
        error: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20",
        info: "bg-info/10 text-info border-info/20 dark:bg-info/20",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "px-2 py-0.5 text-[11px]",
        sm: "px-1.5 py-0 text-[10px] font-semibold leading-4",
        lg: "px-3 py-1 text-[12px] h-6",
        pill: "px-2.5 py-0.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
