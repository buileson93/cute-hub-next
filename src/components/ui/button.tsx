import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        xs: "h-7 rounded px-2 text-[10px]",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
    // Slot chỉ chấp nhận đúng 1 React child — khi asChild=true, không thể chèn spinner.
    const content =
      !asChild && loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      );
    const ariaLabel = (props as { "aria-label"?: string })["aria-label"];
    // Nút icon-only: tự động hiện tooltip từ prop tooltip / aria-label / title.
    const autoTip = tooltip ?? (size === "icon" ? ariaLabel ?? title : undefined);
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || (!asChild && loading)}
        aria-busy={loading || undefined}
        // Ẩn native title khi đã có tooltip Radix để tránh hiển thị chồng.
        title={autoTip ? undefined : title}
        {...props}
      >
        {content}
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
