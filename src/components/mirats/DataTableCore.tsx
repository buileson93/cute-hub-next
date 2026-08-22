import React, { useMemo, useRef, useState, useLayoutEffect, useEffect, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

const MemoizedTableRow = memo(TableRow);
const MemoizedTableCell = memo(TableCell);

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
  fitViewport?: boolean;
  virtualize?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
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
  virtualize = false,
  onLoadMore,
  hasMore = false,
}: DataTableCoreProps<T>) {
  const [density] = useDensity();
  const containerRef = useRef<HTMLDivElement>(null);
  const [calculatedMaxHeight, setCalculatedMaxHeight] = useState<string | number | undefined>(
    initialMaxHeight,
  );

  const estimateRowHeight = useMemo(() => {
    if (density === "compact") return 28;
    return 32;
  }, [density]);

  const getScrollElement = useCallback(() => containerRef.current, []);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize: useCallback(() => estimateRowHeight, [estimateRowHeight]),
    overscan: 8,
    enabled: virtualize,
    getItemKey: useCallback((index: number) => {
      const row = rows[index];
      return row ? getRowId(row) : index;
    }, [rows, getRowId]),
  });

  // Infinite Scroll Trigger
  useEffect(() => {
    if (!onLoadMore || !hasMore || !virtualize) return;

    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= rows.length - 5) {
      onLoadMore();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    onLoadMore,
    hasMore,
    virtualize,
    rows.length,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
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
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
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
    density === "compact" ? "text-[12px]" : "text-[13px]",
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto mirats-scroll rounded-xl bg-card mirats-data-table-core h-full",
        className,
      )}
    >
      <Table
        className={cn(tableClasses, "mirats-data-table-core-element whitespace-nowrap min-w-full table-fixed block")}
      >
        <TableHeader className="sticky top-0 z-40 block">
          <TableRow className="hover:bg-transparent border-b-0 border-t-0 flex astryx-table-row">
            {selectable && (
              <TableHead 
                style={{ flex: '0 0 40px', width: 40 }}
                className="w-10 px-2 text-center sticky left-0 z-50 bg-muted/95 backdrop-blur-[4px] border-l border-t border-b border-r border-border/20 astryx-table-header-cell"
              >
                {/* Checkbox "Select All" có thể được thêm ở đây */}
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.minWidth || (col.width ? undefined : 100),
                  flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`
                }}
                className={cn(
                  "mirats-table-header-base astryx-table-header-cell",
                  col.sticky &&
                    "sticky left-0 z-50 bg-muted/95 backdrop-blur-[4px] border-r border-border/20",
                  selectable && col.sticky && "left-10",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody style={{ 
          height: virtualize ? `${rowVirtualizer.getTotalSize()}px` : 'auto',
          position: 'relative',
          display: 'block'
        }}>
          {rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center text-muted-foreground italic w-full">
              Không có dữ liệu hiển thị
            </div>
          ) : virtualize ? (
            rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const id = getRowId(row);
              const isSelected = selected?.has(id);

              return (
                <MemoizedTableRow
                  key={virtualRow.key || virtualRow.index}
                  data-index={virtualRow.index}
                  ref={(el) => rowVirtualizer.measureElement(el)}
                  className={cn(
                    "group transition-mirats-fast hover:bg-muted/50 absolute top-0 left-0 w-full flex astryx-table-row",
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/5",
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <MemoizedTableCell
                      style={{ flex: '0 0 40px', width: 40 }}
                       className="w-10 px-2 text-center sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-l border-b border-r border-border/20 astryx-table-cell"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(id);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </MemoizedTableCell>
                  )}
                  {columns.map((col) => (
                    <MemoizedTableCell
                      key={col.key}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth || (col.width ? undefined : 100),
                        flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`
                      }}
                      className={cn(
                        "mirats-table-cell-base border-b border-r border-border/20 astryx-table-cell",
                        col.cellClassName,
                        col.sticky &&
                          "sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-r border-border/20",
                        selectable && col.sticky && "left-10",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right tabular-nums",
                        col.type === "actions" &&
                          "sticky right-0 z-20 bg-card/80 backdrop-blur-[2px] border-l border-border/20",
                      )}
                    >
                      {renderCellContent(col, row)}
                    </MemoizedTableCell>
                  ))}
                </MemoizedTableRow>
              );
            })
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected?.has(id);

              return (
                <MemoizedTableRow
                  key={id || `row-${rows.indexOf(row)}`}
                  className={cn(
                    "group transition-mirats-fast hover:bg-muted/50 flex",
                    onRowClick && "cursor-pointer",
                    isSelected && "bg-primary/5",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <MemoizedTableCell
                      style={{ flex: '0 0 40px', width: 40 }}
                      className="w-10 px-2 text-center sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-l border-b border-r border-border/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(id);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </MemoizedTableCell>
                  )}
                  {columns.map((col) => (
                    <MemoizedTableCell
                      key={col.key}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth || (col.width ? undefined : 100),
                        flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`
                      }}
                      className={cn(
                        "mirats-table-cell-base border-b border-r border-border/20",
                        col.cellClassName,
                        col.sticky &&
                          "sticky left-0 z-20 bg-card group-hover:bg-muted/50 border-r border-border/20",
                        selectable && col.sticky && "left-10",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right tabular-nums",
                        col.type === "actions" &&
                          "sticky right-0 z-20 bg-card/80 backdrop-blur-[2px] border-l border-border/20",
                      )}
                    >
                      {renderCellContent(col, row)}
                    </MemoizedTableCell>
                  ))}
                </MemoizedTableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
