import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const buttonVariants = cva(
  "astryx-control",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "",
        xs: "h-6 rounded px-2 text-[10px] [&_svg]:size-3",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Hiển thị spinner + disable nút khi đang chạy async (feedback thân thiện). */
  loading?: boolean;
  /** Nội dung tooltip hiển thị khi hover (mặc định lấy từ aria-label / title cho nút icon-only). */
  tooltip?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, tooltip, title, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // SSR-stable logic
    const renderContent = () => {
      if (asChild) return children;
      return children;
    };

    const ariaLabel = (props as { "aria-label"?: string })["aria-label"];
    const autoTip = tooltip ?? (size === "icon" ? ariaLabel ?? title : undefined);
    
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || (!asChild && loading)}
        aria-busy={loading || undefined}
        title={autoTip ? undefined : title}
        data-astryx-control="true"
        data-astryx-variant={variant || "default"}
        data-astryx-size={size || "default"}
        data-astryx-loading={loading ? "true" : undefined}
        data-disabled={disabled || (!asChild && loading) ? "true" : undefined}
        {...props}
      >
        {renderContent()}
      </Comp>
    );

    if (!autoTip) return button;
    return (
      <TooltipProvider delayDuration={200} disableHoverableContent>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top">{autoTip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };