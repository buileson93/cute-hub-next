import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  unit?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, unit, ...props }, ref) => {
    return (
      <div
        className={cn(
          "astryx-input-wrapper group flex items-center w-full rounded-md border border-input bg-background shadow-none transition-all focus-within:ring-1 focus-within:ring-ring focus-within:border-ring disabled:cursor-not-allowed disabled:opacity-50",
          "h-7 data-[density=comfortable]:h-8 data-[density=spacious]:h-9",
          props["aria-invalid"] && "border-destructive focus-within:ring-destructive",
          className,
        )}
      >
        {prefix && (
          <div className="flex items-center justify-center px-2 text-muted-foreground border-r bg-muted/30 h-full select-none">
            {prefix}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-full w-full bg-transparent px-2 py-1 text-[13px] placeholder:text-muted-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed",
            "file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground",
            type === "number" && "font-mono tabular-nums",
          )}
          ref={ref}
          {...props}
        />
        {unit && (
          <div className="flex items-center justify-center px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 bg-muted/10 h-full border-l select-none">
            {unit}
          </div>
        )}
        {suffix && (
          <div className="flex items-center justify-center px-2 text-muted-foreground border-l bg-muted/30 h-full select-none">
            {suffix}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
