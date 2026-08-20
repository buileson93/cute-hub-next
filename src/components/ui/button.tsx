import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const buttonVariants = cva(
  "astryx-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-mirats-fast active:scale-[var(--scale-active)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-primary/20 bg-background shadow-sm hover:bg-primary/5 hover:text-primary hover:border-primary/40",
        secondary: "astryx-control-skin bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "astryx-control-skin hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 data-[density=comfortable]:h-9 px-4 py-2 text-[12px] data-[density=comfortable]:text-[13px] [&_svg]:size-4",
        sm: "h-7 data-[density=comfortable]:h-8 rounded-md px-3 text-[11px] data-[density=comfortable]:text-[12px] [&_svg]:size-3.5",
        xs: "h-6 rounded px-2 text-[10px] [&_svg]:size-3",
        lg: "h-10 data-[density=comfortable]:h-11 rounded-md px-8 text-base [&_svg]:size-5",
        icon: "h-8 w-8 data-[density=comfortable]:h-9 data-[density=comfortable]:w-9 [&_svg]:size-4.5",
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
  ({ className, variant, size, asChild = false, loading = false, disabled, children, tooltip, title, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Stable loading width: we preserve the layout even when loading
    const content =
      !asChild && loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="animate-spin" aria-hidden="true" />
          </span>
        </>
      ) : (
        children
      );

    // Optimized loading logic for non-asChild
    const renderContent = () => {
       if (asChild) return children;
       if (loading) {
         return (
           <span className="relative flex items-center justify-center gap-2">
             <Loader2 className="animate-spin shrink-0" aria-hidden="true" />
             {children}
           </span>
         );
       }
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