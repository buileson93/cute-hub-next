import React, { useMemo, useRef, useState, useLayoutEffect, useEffect, useCallback, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { OptimizedCell } from "./OptimizedCell";
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
    if (density === "compact") return 36;
    return 40;
  }, [density]);

  const getScrollElement = useCallback(() => containerRef.current, []);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize: useCallback(() => estimateRowHeight, [estimateRowHeight]),
    overscan: 8, // Giảm overscan xuống một chút để tối ưu DOM node khi cuộn chậm
    enabled: virtualize,
    getItemKey: useCallback((index: number) => {
      const row = rows[index];
      return row ? getRowId(row) : `row-${index}`;
    }, [rows, getRowId]),
    // Kỹ thuật Adaptive: tự điều chỉnh phạm vi render dựa trên DOM thực tế
    initialOffset: 0,
    scrollMargin: 0,
    paddingStart: 0,
    paddingEnd: 0,
  });

  // Infinite Scroll Trigger
  useEffect(() => {
    if (!onLoadMore || !hasMore || !virtualize) return;

    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= rows.length - 3) { // Tải sớm hơn một chút (3 dòng thay vì 5)
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
    "relative w-full astryx-table",
    density === "compact" ? "text-[12px]" : "text-[13px]",
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto mirats-scroll rounded-md bg-card mirats-data-table-core h-full flex-1 min-h-0",
        className,
      )}
      style={{
        overflowX: 'auto',
        overflowY: 'auto',
        // Tối ưu hóa layout isolation: contain giúp trình duyệt không phải tính toán lại toàn trang khi bảng thay đổi
        contain: 'content', 
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Table
        className={cn(tableClasses, "mirats-data-table-core-element whitespace-nowrap min-w-full flex flex-col")}
        style={{
          tableLayout: 'fixed',
          width: 'max-content',
          minWidth: '100%'
        }}
      >
        <TableHeader className="sticky top-0 z-40 bg-muted/95 backdrop-blur-[4px] flex flex-col">
          <TableRow className="bg-transparent border-b-0 border-t-0 astryx-table-row hover:bg-transparent flex items-stretch">
            {selectable && (
              <TableHead 
                style={{ width: 40, minWidth: 40, flex: '0 0 40px' }}
                className="w-10 px-3 text-center sticky left-0 z-50 bg-inherit astryx-table-header-cell"
              />
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.minWidth || (col.width ? undefined : 100),
                  flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`,
                  position: col.sticky ? 'sticky' : 'relative',
                  left: col.sticky ? (selectable ? 40 : 0) : undefined,
                  zIndex: col.sticky ? 50 : 40,
                  background: 'inherit'
                }}
                className={cn(
                  "astryx-table-header-cell",
                  col.sticky && "border-r border-border/20",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="flex flex-col" style={{ 
          height: virtualize ? `${rowVirtualizer.getTotalSize()}px` : 'auto',
          position: 'relative',
        }}>
          {rows.length === 0 ? (
            <TableRow className="border-0">
              <OptimizedCell colKey="empty" colSpan={columns.length + (selectable ? 1 : 0)} className="h-32 text-center text-muted-foreground italic border-0">
                Không có dữ liệu hiển thị
              </OptimizedCell>
            </TableRow>
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
                    "group astryx-table-row flex items-stretch",
                    onRowClick && "cursor-pointer",
                    isSelected && "selected",
                  )}
                  style={{
                    transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    willChange: 'transform',
                    contain: 'layout inline-size', // Tối ưu hóa việc paint cho từng hàng
                  }}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <OptimizedCell
                      colKey="selection"
                      style={{ width: 40, minWidth: 40, flex: '0 0 40px' }}
                      className="w-10 px-3 text-center sticky left-0 z-20 bg-inherit"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onSelect?.(id);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </OptimizedCell>
                  )}
                  {columns.map((col) => (
                    <OptimizedCell
                      key={col.key}
                      colKey={col.key}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth || (col.width ? undefined : 100),
                        flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`,
                        position: col.sticky ? 'sticky' : 'relative',
                        left: col.sticky ? (selectable ? 40 : 0) : undefined,
                        zIndex: col.sticky ? 20 : 1,
                        background: 'inherit'
                      }}
                      className={cn(
                        col.cellClassName,
                        col.sticky && "border-r border-border/20",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right tabular-nums",
                        col.type === "actions" && "sticky right-0 z-20 border-l border-border/20",
                      )}
                    >
                      {renderCellContent(col, row)}
                    </OptimizedCell>
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
                    "group astryx-table-row flex items-stretch",
                    onRowClick && "cursor-pointer",
                    isSelected && "selected",
                  )}
                  style={{ contain: 'layout inline-size' }}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <OptimizedCell
                      colKey="selection"
                      style={{ flex: '0 0 40px', width: 40 }}
                      className="w-10 px-3 text-center sticky left-0 z-20 bg-inherit"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onSelect?.(id);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </OptimizedCell>
                  )}
                  {columns.map((col) => (
                    <OptimizedCell
                      key={col.key}
                      colKey={col.key}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth || (col.width ? undefined : 100),
                        flex: col.width ? `0 0 ${col.width}px` : `1 1 ${col.minWidth || 100}px`,
                        position: col.sticky ? 'sticky' : 'relative',
                        left: col.sticky ? (selectable ? 40 : 0) : undefined,
                        zIndex: col.sticky ? 20 : 1,
                        background: 'inherit'
                      }}
                      className={cn(
                        col.cellClassName,
                        col.sticky && "border-r border-border/20",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right tabular-nums",
                        col.type === "actions" && "sticky right-0 z-20 border-l border-border/20",
                      )}
                    >
                      {renderCellContent(col, row)}
                    </OptimizedCell>
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
