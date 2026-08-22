import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-mirats-fast active:scale-[var(--scale-active,0.98)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-primary/20 bg-background shadow-sm hover:bg-primary/5 hover:text-primary hover:border-primary/40",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: cn("min-h-9 md:min-h-8 px-4 py-2 text-[14px] md:text-[13px] [&_svg]:size-4"),
        sm: "min-h-8 md:min-h-7.5 rounded-md px-3 text-[13px] md:text-[12px] [&_svg]:size-3.5",
        xs: "min-h-7 md:min-h-6.5 rounded px-2 text-[12px] md:text-[11px] [&_svg]:size-3",
        lg: "min-h-11 md:min-h-10 rounded-md px-8 text-base [&_svg]:size-5",
        icon: "size-9 md:size-8 [&_svg]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props cho component Button.
 *
 * QUY TẮC PHÂN CẤP (MIRATS Hierarchy):
 * - variant="default": Dùng DUY NHẤT MỘT lần mỗi màn hình cho hành động chính.
 * - variant="outline": Dùng cho các hành động phụ hoặc nút "Hủy".
 * - variant="ghost": Dùng cho các công cụ (toolbar), icon-only button.
 * - variant="destructive": Chỉ dùng cho hành động xóa không thể hoàn tác + ConfirmDialog.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Hiển thị spinner + disable nút khi đang chạy async (feedback thân thiện). */
  loading?: boolean;
  /** Nội dung tooltip hiển thị khi hover (mặc định lấy từ aria-label / title cho nút icon-only). */
  tooltip?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      tooltip,
      title,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const renderContent = () => {
      if (asChild) return children;

      return (
        <>
          <span
            className={cn(
              "flex items-center justify-center gap-2 transition-opacity pointer-events-none",
              loading ? "opacity-0" : "opacity-100",
            )}
          >
            {children}
          </span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 className="animate-spin shrink-0 h-4 w-4 text-current" aria-hidden="true" />
            </span>
          )}
        </>
      );
    };

    const ariaLabel = (props as { "aria-label"?: string })["aria-label"];
    const autoTip = tooltip ?? (size === "icon" ? (ariaLabel ?? title) : undefined);

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || (!asChild && loading)}
        aria-busy={loading || undefined}
        title={autoTip ? undefined : title}
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
