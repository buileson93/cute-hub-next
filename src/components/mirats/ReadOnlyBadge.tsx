import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NHAN } from "@/lib/mirats/tu-vung";

// Task 26 — Chỉ dấu "Chỉ tra cứu" cho trang/khu vực người dùng không có quyền ghi.
export function ReadOnlyBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-xs text-muted-foreground border-dashed", className)}
      aria-label={NHAN.chiTietDoc}
      title="Bạn không có quyền chỉnh sửa dữ liệu trong khu vực này."
    >
      <Eye className="h-3 w-3" aria-hidden />
      {NHAN.chiTietDoc}
    </Badge>
  );
}
