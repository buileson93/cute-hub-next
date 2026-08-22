import React, { memo } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface OptimizedCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  colKey?: string;
  colSpan?: number;
  rowId?: string; // Thêm rowId để tracking
  dataHash?: string | number; // Thêm dataHash để so sánh dữ liệu thô
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
  rowId,
  dataHash,
  ...props
}: OptimizedCellProps) {
  return (
    <TableCell
      {...props}
      data-col={colKey}
      data-row={rowId}
      colSpan={colSpan}
      className={cn(
        "astryx-table-cell transition-colors",
        className
      )}
      style={{
        ...style,
        contain: "content",
        // Hạn chế will-change để tránh memory bloat
        willChange: style?.position === 'sticky' ? 'transform' : 'auto'
      }}
    >
      {children}
    </TableCell>
  );
}, (prev, next) => {
  // So sánh sâu hơn nhưng vẫn hiệu quả
  return (
    prev.dataHash === next.dataHash &&
    prev.children === next.children &&
    prev.className === next.className &&
    prev.colSpan === next.colSpan &&
    prev.rowId === next.rowId &&
    // So sánh style shallow vì thường style object được tạo mới mỗi lần render
    prev.style?.width === next.style?.width &&
    prev.style?.minWidth === next.style?.minWidth &&
    prev.style?.flex === next.style?.flex &&
    prev.style?.position === next.style?.position &&
    prev.style?.left === next.style?.left &&
    prev.style?.zIndex === next.style?.zIndex
  );
});
