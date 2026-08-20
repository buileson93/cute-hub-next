import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import type { DomainKey } from "@/lib/mirats/ui/status-registry";

interface StatusDotProps {
  /** Map variant sang domain "thiet_bi" cũ hoặc dùng domain trực tiếp */
  variant?: "default" | "success" | "warning" | "error" | "info";
  domain?: DomainKey;
  code?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * Semantic Status Dot for MIRATS dashboards.
 * Hợp nhất (Task 63): Dùng StatusBadge với prop dotOnly.
 */
export function StatusDot({ 
  variant = "default", 
  domain,
  code,
  size = "md", 
  label,
  className 
}: StatusDotProps) {
  // Mapping variant cũ sang mã trạng thái của domain thiet_bi để giữ màu sắc tương đồng
  const variantToCode: Record<string, string> = {
    default: "NGUNG_KHAI_THAC",
    success: "DANG_KHAI_THAC",
    warning: "DANG_SUA_CHUA",
    error: "HONG",
    info: "CHO_XU_LY",
  };

  const finalDomain = domain || "thiet_bi";
  const finalCode = code || variantToCode[variant] || "NGUNG_KHAI_THAC";

  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  return (
    <StatusBadge 
      domain={finalDomain} 
      code={finalCode} 
      dotOnly 
      label={label}
      className={cn(sizeClasses[size], className)}
    />
  );
}
