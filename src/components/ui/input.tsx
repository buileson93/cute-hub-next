import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  unit?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, unit, ...props }, ref) => {
    const density = (props as any)["data-density"];
    return (
      <div 
        data-astryx-control="input-wrapper"
        data-astryx-size={density === "comfortable" ? "default" : "sm"}
        data-astryx-state={props["aria-invalid"] ? "invalid" : undefined}
        className={cn(className)}
      >
        {prefix && (
          <div className="flex items-center justify-center px-2 text-muted-foreground border-r bg-muted/30 h-full select-none">
            {prefix}
          </div>
        )}
        <input
          type={type}
          data-astryx-control="input"
          className={cn(
            type === "number" && "astryx-number"
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
  }
);
Input.displayName = "Input";

export { Input };
