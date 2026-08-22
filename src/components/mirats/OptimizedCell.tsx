import React, { memo } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface OptimizedCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  colKey?: string;
  colSpan?: number;
}

/**
 * OptimizedCell - Memoized table cell to prevent unnecessary re-renders during scroll.
 * Uses hardware acceleration hints and minimal DOM footprint.
 */
export const OptimizedCell = memo(function OptimizedCell({
  children,
  className,
  style,
  colKey,
  colSpan,
  ...props
}: OptimizedCellProps) {
  return (
    <TableCell
      {...props}
      data-col={colKey}
      colSpan={colSpan}
      className={cn(
        "astryx-table-cell transition-colors",
        className
      )}
      style={{
        ...style,
        contain: "content"
      }}
    >
      {children}
    </TableCell>
  );
}, (prev, next) => {
  // Chỉ re-render nếu các props quan trọng không đổi
  return (
    prev.children === next.children &&
    prev.className === next.className &&
    prev.colSpan === next.colSpan &&
    JSON.stringify(prev.style) === JSON.stringify(next.style)
  );
});
