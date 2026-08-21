import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { fmtVND, fmtNgay } from "@/lib/mirats/format";
import { useDensity } from "@/components/mirats/DensityToggle";

export type ColumnType =
  | "id"
  | "status"
  | "taxonomy"
  | "user"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "boolean"
  | "actions";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  type?: ColumnType;
  width?: number;
  minWidth?: number;
  sticky?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  cellClassName?: string;
  priority?: "primary" | "secondary" | "detail";
}

interface DataTableCoreProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelect?: (id: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
  maxHeight?: string | number;
  fitViewport?: boolean; // Tự động tính toán chiều cao để thanh cuộn ngang luôn hiển thị
}

/**
 * DataTableCore - Lõi hiển thị bảng đồng nhất của MIRATS (Phase U9).
 * Tập trung vào tính ổn định của sticky header, border, và density.
 */
export function DataTableCore<T>({
  rows,
  columns,
  getRowId,
  selectable,
  selected,
  onSelect,
  onRowClick,
  className,
  maxHeight: initialMaxHeight,
  fitViewport = false,
}: DataTableCoreProps<T>) {
  const [density] = useDensity();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [calculatedMaxHeight, setCalculatedMaxHeight] = React.useState<string | number | undefined>(initialMaxHeight);

  React.useLayoutEffect(() => {
    if (!fitViewport || !containerRef.current) return;

    const calculate = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Chừa khoảng trống cho margin/footer (khoảng 40px)
      const available = windowHeight - rect.top - 40;
      if (available > 200) {
        setCalculatedMaxHeight(`${available}px`);
      }
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [fitViewport, initialMaxHeight]);

  const maxHeight = fitViewport ? calculatedMaxHeight : initialMaxHeight;

  const renderCellContent = (col: DataTableColumn<T>, row: T) => {
    if (col.render) return col.render(row);

    const val = (row as any)[col.key];
    if (val === undefined || val === null) return "-";

    switch (col.type) {
      case "status":
        // DataTableCore mặc định dùng domain generic nếu không có hint
        return <StatusBadge domain="thiet_bi" code={val} />;
      case "currency":
        return fmtVND(val);
      case "date":
        return fmtNgay(val);
      case "number":
        return typeof val === "number" ? val.toLocaleString("vi-VN") : val;
      case "boolean":
        return val ? "Bật" : "Tắt";
      default:
        return String(val);
    }
  };

  const tableClasses = cn(
    "relative w-full border-separate border-spacing-0",
    density === "compact" ? "text-[12px]" : "text-[13px]"
  );

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto mirats-scroll rounded-xl bg-card mirats-data-table-core", className)}
      style={{ maxHeight }}
    >
      <Table className={cn(tableClasses, "mirats-data-table-core-element whitespace-nowrap min-w-full")}>
        <TableHeader className="sticky top-0 z-40">
          <TableRow className="hover:bg-transparent border-b-0 border-t-0">
            {selectable && (
              <TableHead className="w-10 px-2 text-center sticky left-0 z-50 bg-muted/95 backdrop-blur-[4px] border-l border-t border-b border-r border-border/20">
                {/* Checkbox "Select All" có thể được thêm ở đây */}
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.minWidth || (col.width ? undefined : 100),
                }}
                className={cn(
                  "mirats-table-header-base",
                  col.sticky && "sticky left-0 z-50 bg-muted/95 backdrop-blur-[4px] border-r border-border/20",
                  selectable && col.sticky && "left-10",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="h-32 text-center text-muted-foreground italic"
              >
                Không có dữ liệu hiển thị
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected?.has(id);

              return (
                <TableRow
                  key={id}
                  className={cn(
                    "group transition-mirats-fast hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell 
                      className="w-10 px-2 text-center sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-l border-b border-r border-border/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(id);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "mirats-table-cell-base border-b border-r border-border/20",
                        col.cellClassName,
                        col.sticky && "sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-r border-border/20",
                        selectable && col.sticky && "left-10",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right tabular-nums",
                        col.type === "actions" && "sticky right-0 z-20 bg-card/80 backdrop-blur-[2px] border-l border-border/20"
                      )}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth || (col.width ? undefined : 100),
                      }}
                    >
                      {renderCellContent(col, row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
