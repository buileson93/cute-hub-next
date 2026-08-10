import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/mirats/Skeletons";
import { EmptyState } from "@/components/mirats/EmptyState";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BP_PX } from "@/lib/mirats/ui/responsive-scope";
import { useColumnPrefs } from "@/lib/mirats/use-column-prefs";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export interface StdColumn<T> {
  key: string;
  label: string;
  value?: (r: T) => any;
  cell?: (r: T) => React.ReactNode;
  filter?: "text" | "cat";
  align?: "left" | "center" | "right";
  sticky?: boolean;
  minW?: string;
  cellClassName?: string;
  hidden?: boolean;
  group?: string;
  inherited?: boolean;
  hideBelow?: number | string;
  defaultHidden?: boolean;
  sortable?: boolean;
  sortValue?: (r: T) => any;
  lineClamp?: number;
}

export interface StandardTableProps<T> {
  rows: T[];
  columns: StdColumn<T>[];
  getRowId?: (r: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  setSelected?: (val: any) => void;
  maxHeightClass?: string;
  emptyText?: string;
  emptyContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  trangThai?: { dangTai?: boolean; loi?: any };
  loadingContent?: React.ReactNode;
  onRowClick?: (r: T) => void;
  rowClassName?: (r: T) => string;
  toolbarRight?: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }) => React.ReactNode);
  toolbarLeft?: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }) => React.ReactNode);
  bulkActions?: (ctx: {
    selectedRows: T[];
    visibleColumns: StdColumn<T>[];
    allColumns: StdColumn<T>[];
    filteredRows: T[];
    pageRows: T[];
    clear: () => void;
  }) => React.ReactNode;

  pagination?: any;
  clientPagination?: any;
  tableKey?: string;
  countUnit?: string;
  requireFilterToShow?: boolean;
  gated?: boolean;
  presets?: any[];
  activePreset?: string;
  hideReorderToggle?: boolean;
}

export function StandardTable<T>({
  rows = [],
  columns = [],
  getRowId,
  selectable,
  selected,
  setSelected,
  maxHeightClass = "max-h-[600px]",
  emptyText = "Không có dữ liệu",
  emptyContent,
  errorContent,
  trangThai,
  loadingContent,
  onRowClick,
  rowClassName,
  toolbarRight,
  toolbarLeft,
  bulkActions,
  tableKey,
  countUnit = "bản ghi",
  gated,
  presets,
  activePreset,
}: StandardTableProps<T>) {
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  
  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Tầng 1: Column Prefs (User Settings) ---
  const allKeys = useMemo(() => columns.map(c => c.key), [columns]);
  const defaultHidden = useMemo(() => 
    columns.filter(c => c.defaultHidden).map(c => c.key), 
    [columns]
  );
  
  const prefs = useColumnPrefs(tableKey || "default", allKeys, defaultHidden);
  
  // Nối presets vào useColumnPrefs khi component mount/update
  useEffect(() => {
    if (presets && prefs.setPreset && prefs.ready) {
      const currentPreset = presets.find(p => p.id === activePreset);
      if (currentPreset && !prefs.isCustomized && prefs.activePreset !== activePreset) {
        const visibleKeys = currentPreset.visibleKeys || currentPreset.columns || currentPreset.cot || [];
        prefs.setPreset(currentPreset.id, visibleKeys, currentPreset.orderKeys || visibleKeys);
      }
    }
  }, [presets, activePreset, prefs.ready, prefs.isCustomized, prefs.activePreset]);

  const isMobile = vw > 0 && vw < BP_PX.md;
  
  // Sắp xếp cột theo thứ tự người dùng đã chọn
  const sortedColumns = useMemo(() => {
    if (!tableKey) return columns;
    const order = prefs.order;
    return [...columns].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }, [columns, tableKey, prefs.order]);

  const shownCols = useMemo(() => {
    return sortedColumns.filter((c) => {
      // Tầng 1: Người dùng ẩn cột cố tình -> Ẩn mọi nơi
      if (tableKey && (prefs.hidden as Set<string>).has(c.key)) return false;
      
      // Tầng 3: Ẩn cứng trong định nghĩa cột -> Ẩn mọi nơi
      if (c.hidden) return false;

      // Tầng 2: Ẩn theo bề rộng màn hình (hideBelow) -> Chỉ ẩn trên UI
      if (!c.hideBelow) return true;
      const threshold = typeof c.hideBelow === "number" 
        ? c.hideBelow 
        : (BP_PX as any)[c.hideBelow] || BP_PX.md;
      return vw >= threshold;
    });
  }, [sortedColumns, tableKey, prefs.hidden, vw]);

  // Cột xuất tệp: Luôn lấy tất cả các cột không ẩn cố định, 
  // bỏ qua Tầng 2 (hideBelow) nhưng vẫn áp dụng Tầng 1 (User Prefs) và Tầng 3 (Hardcoded hidden)
  const exportCols = useMemo(() => {
    return sortedColumns.filter(c => {
      // Tầng 1: Người dùng ẩn cột cố tình -> Ẩn cả trong tệp xuất
      if (tableKey && (prefs.hidden as Set<string>).has(c.key)) return false;

      // Tầng 3: Ẩn cứng trong định nghĩa cột -> Ẩn cả trong tệp xuất
      if (c.hidden) return false;

      // Bỏ qua Tầng 2 (hideBelow) để đảm bảo toàn vẹn dữ liệu báo cáo
      return true;
    });
  }, [sortedColumns, tableKey, prefs.hidden]);
  const getRowIdInternal = (r: T): string => (getRowId ? getRowId(r) : (r as any).id);

  const toggleRow = (id: string) => {
    if (!setSelected) return;
    setSelected((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    if (setSelected) setSelected(new Set());
  };

  const selectedRows = rows.filter(r => selected?.has(getRowIdInternal(r)));

  const renderToolbar = (
    toolbar: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }) => React.ReactNode),
    ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }
  ) => {
    if (typeof toolbar === "function") {
      return toolbar(ctx);
    }
    return toolbar;
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: isTest ? rows.length : 10,
    initialRect: { width: 1280, height: 800 },
    // Cần observeElementRect vì JSDOM không có ResizeObserver thực sự
    observeElementRect: (instance, cb) => {
      cb({ width: 1280, height: 800 });
      return () => {};
    },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  // --- Kéo đổi độ rộng cột ---
  const isDragging = useRef<string | null>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const onHandleMouseDown = useCallback((e: React.MouseEvent, key: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = key;
    startX.current = e.pageX;
    startW.current = currentWidth;
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onHandleMouseMove);
    document.addEventListener("mouseup", onHandleMouseUp);
  }, []);

  const onHandleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.pageX - startX.current;
    const nextW = Math.max(60, startW.current + delta);
    prefs.setWidth(isDragging.current, nextW);
  }, [prefs]);

  const onHandleMouseUp = useCallback(() => {
    isDragging.current = null;
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", onHandleMouseMove);
    document.removeEventListener("mouseup", onHandleMouseUp);
    // Sau khi đổi độ rộng, có thể chữ xuống dòng khác đi -> báo ảo hoá đo lại
    rowVirtualizer.measure();
  }, [rowVirtualizer]);

  const autoFitWidths = () => {
    // Logic tự căn: reset về mặc định của browser (xóa prefs.widths)
    prefs.reset();
  };

  const resetAllWidths = () => {
    allKeys.forEach(k => prefs.resetWidth(k));
  };

  return (
    <div className="space-y-3">
      {(toolbarRight || toolbarLeft || (selectable && selectedRows.length > 0)) && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            {toolbarLeft && renderToolbar(toolbarLeft, { visibleRows: rows, visibleColumns: shownCols })}
            {selectable && selectedRows.length > 0 && bulkActions && (
              bulkActions({
                selectedRows,
                visibleColumns: shownCols,
                allColumns: exportCols, // Truyền exportCols để hành động hàng loạt (như xuất tệp) đủ dữ liệu
                filteredRows: rows,
                pageRows: rows,
                clear: clearSelection
              })
            )}
          </div>
          <div className="flex items-center gap-1">
            {tableKey && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={autoFitWidths}>
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tự căn theo nội dung</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={resetAllWidths}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Đặt lại độ rộng mọi cột</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            {toolbarRight && renderToolbar(toolbarRight, { visibleRows: rows, visibleColumns: shownCols })}
          </div>
        </div>
      )}


      {isMobile ? (
        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground border rounded-lg bg-card">
              {gated ? "Bảng đang trống." : (emptyContent ?? emptyText)}
            </div>
          ) : (
            rows.map((r) => {
              const rid = getRowIdInternal(r);
              const isSel = selectable && selected?.has(rid);
              return (
                <Card
                  key={rid}
                  className={cn(
                    "relative cursor-pointer transition-colors hover:bg-muted/50",
                    isSel && "border-primary bg-primary/5",
                    rowClassName?.(r)
                  )}
                  onClick={() => onRowClick?.(r)}
                >
                  <CardContent className="p-4">
                    {selectable && (
                      <div className="absolute right-3 top-3">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(rid)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      {shownCols.slice(0, 5).map((col) => (
                        <div key={col.key} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {col.label}
                          </span>
                          <div className={cn("text-sm", col.cellClassName)}>
                            {col.cell ? col.cell(r) : String(col.value?.(r) ?? "")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card ref={parentRef} className={cn("relative min-h-0 overflow-auto border shadow-sm", maxHeightClass)}>
          <Table className="w-full table-fixed border-separate border-spacing-0 caption-bottom text-sm">
            <TableHeader className="bg-muted sticky top-0 z-20 shadow-[0_1px_0_hsl(var(--border))]">
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="sticky left-0 top-0 z-30 w-10 bg-muted border-r border-border/50"></TableHead>
                )}
                {shownCols.map((c) => {
                  const savedW = prefs.widths[c.key];
                  const minWVal = c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : "100px";
                  const currentWidth = savedW || parseInt(minWVal || "100") || 120;

                  return (
                    <TableHead
                      key={c.key}
                      className={cn(
                        "group relative bg-muted border-r border-border/50 last:border-r-0",
                        c.sticky && "sticky left-0 z-30",
                        selectable && c.sticky && "left-10",
                        c.align === "center" && "text-center",
                        c.align === "right" && "text-right"
                      )}
                      style={{ 
                        width: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined),
                        minWidth: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined)
                      }}
                    >
                      <span className="truncate block" title={c.label}>
                        {c.label}
                      </span>

                      {/* Resizer handle */}
                      <div
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary/30 transition-opacity z-10"
                        onMouseDown={(e) => onHandleMouseDown(e, c.key, currentWidth)}
                        onDoubleClick={() => prefs.resetWidth(c.key)}
                        title="Kéo để đổi độ rộng — bấm đúp để đặt lại"
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trangThai?.loi ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24">
                    {errorContent ?? (
                      <div className="flex h-full items-center justify-center text-sm text-destructive">
                        {String(trangThai.loi)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : trangThai?.dangTai ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24">
                    {loadingContent ?? <TableSkeleton cols={shownCols.length} />}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24">
                    <EmptyState
                      title={emptyContent ? undefined : emptyText}
                      description={typeof emptyContent === "string" ? emptyContent : undefined}
                    />
                    {typeof emptyContent !== "string" && emptyContent}
                  </TableCell>
                </TableRow>
              ) : (

                <>
                  {paddingTop > 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} style={{ height: `${paddingTop}px` }} className="p-0 border-0" />
                    </TableRow>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const r = rows[virtualRow.index];
                    const rid = getRowIdInternal(r);
                    const isSel = selectable && selected?.has(rid);
                    return (
                      <TableRow
                        key={rid}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className={cn(onRowClick && "cursor-pointer", isSel && "bg-primary/5", rowClassName?.(r))}
                        onClick={() => onRowClick?.(r)}
                      >
                        {selectable && (
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            className="sticky left-0 z-10 bg-card border-r border-border/50"
                          >
                            <Checkbox checked={isSel} onCheckedChange={() => toggleRow(rid)} />
                          </TableCell>
                        )}
                        {shownCols.map((c) => {
                          const savedW = prefs.widths[c.key];
                          return (
                            <TableCell
                              key={c.key}
                              className={cn(
                                c.cellClassName,
                                c.sticky && "sticky left-0 z-10 bg-card border-r border-border/50",
                                selectable && c.sticky && "left-10",
                                c.align === "center" && "text-center",
                                c.align === "right" && "text-right tabular-nums",
                                c.inherited && "bg-amber-50/50 dark:bg-amber-950/20"
                              )}
                              style={{ 
                                width: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined),
                                minWidth: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined)
                              }}
                            >
                            {c.cell ? (
                              c.cell(r)
                            ) : (
                              <div
                                className={cn(
                                  "break-words [overflow-wrap:anywhere] [word-break:break-word]",
                                  (c.lineClamp ?? 1) > 1
                                    ? `line-clamp-${c.lineClamp}`
                                    : "truncate"
                                )}
                                title={String(c.value?.(r) ?? "")}
                              >
                                {String(c.value?.(r) ?? "")}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      </TableRow>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} style={{ height: `${paddingBottom}px` }} className="p-0 border-0" />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
