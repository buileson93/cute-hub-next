import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "ghost";
  size?: "default" | "sm" | "lg" | "pill";
  icon?: React.ReactNode;
}

function Badge({ className, variant = "default", size = "default", icon, children, ...props }: BadgeProps) {
  return (
    <div 
      data-astryx-control="badge"
      data-astryx-variant={variant}
      data-astryx-size={size}
      className={className} 
      {...props}
    >
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge };
