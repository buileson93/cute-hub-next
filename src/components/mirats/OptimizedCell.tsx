import React, { memo } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface OptimizedCellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  colKey?: string;
}

/**
 * OptimizedCell - Memoized table cell to prevent unnecessary re-renders during scroll.
 * Uses hardware acceleration hints and minimal DOM footprint.
 */
export const OptimizedCell = memo(function OptimizedCell({
  children,
  className,
  style,
  colKey
}: OptimizedCellProps) {
  return (
    <TableCell
      data-col={colKey}
      className={cn(
        "astryx-table-cell transition-colors",
        className
      )}
      style={{
        ...style,
        // Kích hoạt layer riêng cho cell nếu cần, nhưng thường chỉ nên để ở row
        contain: "content"
      }}
    >
      {children}
    </TableCell>
  );
}, (prev, next) => {
  // Chỉ re-render nếu children (nội dung cell) hoặc các props quan trọng thay đổi
  return (
    prev.children === next.children &&
    prev.className === next.className &&
    JSON.stringify(prev.style) === JSON.stringify(next.style)
  );
});
