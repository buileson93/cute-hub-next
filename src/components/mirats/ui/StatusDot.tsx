import React from "react";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * Semantic Status Dot for MIRATS dashboards.
 */
export function StatusDot({ 
  variant = "default", 
  size = "md", 
  label,
  className 
}: StatusDotProps) {
  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  const variantClasses = {
    default: "bg-slate-400",
    success: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]",
    warning: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
    info: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full transition-all",
          sizeClasses[size],
          variantClasses[variant]
        )} 
        aria-hidden="true"
      />
      {label && (
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
