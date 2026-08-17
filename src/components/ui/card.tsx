import * as React from "react";

import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

const cardVariants = cva(
  cn(UI_DENSITY.CARD_RADIUS, "border bg-card text-card-foreground shadow-none transition-mirats-base"),
  {
    variants: {
      variant: {
        default: "",
        clickable: "cursor-pointer hover:border-primary/50 hover:bg-muted/10 active:scale-[0.98]",
        selectable: "cursor-pointer border-2 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5",
        muted: "bg-muted/30 border-none shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  selected?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, selected, ...props }, ref) => (
    <div
      ref={ref}
      data-selected={selected}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1", UI_DENSITY.CARD_HEADER, className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(UI_DENSITY.CARD_PADDING, "pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", UI_DENSITY.CARD_PADDING, "pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
