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
import { Maximize2, RotateCcw, SlidersHorizontal, Filter, ArrowUp, ArrowDown, ChevronsUpDown, X, Search, GripVertical } from "lucide-react";
import { normalize } from "@/lib/mirats/global-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";



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
  editMode?: boolean;
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
  requireFilterToShow,
  pagination,
  clientPagination,
  presets,
  activePreset,
  hideReorderToggle,
  editMode,
}: StandardTableProps<T>) {

  const [containerWidth, setContainerWidth] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [internalReorder, setInternalReorder] = useState(false);
  const reorder = (editMode || internalReorder) && !hideReorderToggle;

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

  const isMobile = containerWidth > 0 && containerWidth < BP_PX.md;
  
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
      return containerWidth >= threshold;
    });
  }, [sortedColumns, tableKey, prefs.hidden, containerWidth]);

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

  const renderToolbar = (
    toolbar: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }) => React.ReactNode),
    ctx: { visibleRows: T[]; visibleColumns: StdColumn<T>[] }
  ) => {
    if (typeof toolbar === "function") {
      return toolbar(ctx);
    }
    return toolbar;
  };

  const colText = useCallback((col: StdColumn<T>, row: T): string => {
    const v = col.value ? col.value(row) : "";
    return v == null ? "" : String(v);
  }, []);

  const matchesFilters = useCallback(
    (r: T, exceptKey?: string) => {
      for (const c of columns) {
        if (c.key === exceptKey) continue;
        if (c.filter === "cat") {
          const sel = catFilters[c.key];
          if (sel && sel.size > 0 && !sel.has(colText(c, r))) return false;
        } else if (c.filter === "text") {
          const val = textFilters[c.key];
          if (val) {
            const t = normalize(val).trim();
            if (t && !normalize(colText(c, r)).includes(t)) return false;
          }
        }
      }
      return true;
    },
    [columns, catFilters, textFilters, colText],
  );

  const catValues = useMemo(() => {
    const map: Record<string, { value: string; count: number }[]> = {};
    for (const c of columns.filter((c) => c.filter === "cat")) {
      const counts = new Map<string, number>();
      for (const r of rows) {
        if (!matchesFilters(r, c.key)) continue;
        const val = colText(c, r);
        counts.set(val, (counts.get(val) ?? 0) + 1);
      }
      map[c.key] = Array.from(counts.entries())
        .filter(([v]) => Boolean(v))
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, "vi"));
    }
    return map;
  }, [columns, rows, matchesFilters, colText]);

  const filtered = useMemo(
    () => rows.filter((r) => matchesFilters(r)),
    [rows, matchesFilters],
  );

  const hasFilter = useMemo(() => {
    return columns.some((c) =>
      c.filter === "cat" ? (catFilters[c.key]?.size ?? 0) > 0
        : (textFilters[c.key] ?? "").trim().length > 0
    );
  }, [columns, catFilters, textFilters]);

  const sortableKey = useCallback((c: StdColumn<T>) => c.sortable ?? !!(c.sortValue || c.value), []);
  const cycleSort = useCallback((key: string) => setSort((prev) => {
    if (!prev || prev.key !== key) return { key, dir: "asc" };
    if (prev.dir === "asc") return { key, dir: "desc" };
    return null;
  }), []);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return filtered;
    const get = (r: T) => {
      const v = col.sortValue ? col.sortValue(r) : col.value ? col.value(r) : "";
      return v == null ? "" : v;
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = get(a), vb = get(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "vi", { numeric: true }) * dir;
    });
  }, [filtered, sort, columns]);

  const gated = requireFilterToShow && !hasFilter;
  const fullDisplay = useMemo(() => (gated ? [] : sorted), [gated, sorted]);

  const notifyFilteredTotal = clientPagination?.onFilteredTotalChange;
  useEffect(() => {
    notifyFilteredTotal?.(fullDisplay.length);
  }, [fullDisplay.length, notifyFilteredTotal]);

  const display = useMemo(() => {
    if (!clientPagination) return fullDisplay;
    const { page, pageSize } = clientPagination;
    if (pageSize >= fullDisplay.length) return fullDisplay;
    const start = Math.max(0, (page - 1) * pageSize);
    return fullDisplay.slice(start, start + pageSize);
  }, [fullDisplay, clientPagination]);

  const selectedRows = rows.filter(r => selected?.has(getRowIdInternal(r)));

  const toggleCat = (key: string, val: string) => {
    setCatFilters(prev => {
      const next = new Map(Object.entries(prev).map(([k, v]) => [k, new Set(v)]));
      const s = next.get(key) || new Set<string>();
      if (s.has(val)) s.delete(val);
      else s.add(val);
      next.set(key, s);
      return Object.fromEntries(next);
    });
  };

  const clearCat = (key: string) => {
    setCatFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearAllFilters = () => {
    setCatFilters({});
    setTextFilters({});
  };

  const removeFilter = (key: string) => {
    setCatFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setTextFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };


  const isTest = typeof window !== 'undefined' && (window as any).process?.env?.NODE_ENV === 'test';
  const rowVirtualizer = useVirtualizer({
    count: display.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: isTest ? display.length : 10,
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
            {toolbarLeft && renderToolbar(toolbarLeft, { visibleRows: fullDisplay, visibleColumns: shownCols })}
            {selectable && selectedRows.length > 0 && bulkActions && (
              bulkActions({
                selectedRows,
                visibleColumns: shownCols,
                allColumns: exportCols,
                filteredRows: fullDisplay,
                pageRows: display,
                clear: clearSelection
              })
            )}
          </div>
          <div className="flex items-center gap-1">
            {tableKey && (
              <>
                {!isMobile && (
                  <DropdownMenu>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-2 ml-1"
                              disabled={!prefs.ready}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                              <span className="hidden sm:inline">Cột hiển thị</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Tuỳ chỉnh các cột hiển thị</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Nhóm các cột theo 'group' nếu có, hoặc không nhóm */}
                      {Object.entries(
                        sortedColumns.reduce((acc, col) => {
                          const g = col.group || "Khác";
                          if (!acc[g]) acc[g] = [];
                          acc[g].push(col);
                          return acc;
                        }, {} as Record<string, StdColumn<T>[]>)
                      ).map(([group, cols], idx, arr) => (
                        <div key={group}>
                          {group !== "Khác" && <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">{group}</DropdownMenuLabel>}
                          {cols.map((col) => {
                            const isCurrentlyVisible = !prefs.isHidden(col.key);
                            // Chặn việc ẩn cột cuối cùng
                            const canToggle = !isCurrentlyVisible || shownCols.length > 1;
                            
                            return (
                              <DropdownMenuCheckboxItem
                                key={col.key}
                                checked={isCurrentlyVisible}
                                onCheckedChange={() => prefs.toggle(col.key)}
                                 onSelect={(e: Event) => e.preventDefault()}
                                disabled={!canToggle}
                              >
                                {col.label}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                          {idx < arr.length - 1 && <DropdownMenuSeparator />}
                        </div>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem 
                        className="text-primary focus:text-primary font-medium"
                        onSelect={(e: Event) => {
                          e.preventDefault();
                          prefs.reset();
                        }}
                      >
                        Đặt lại mặc định
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={autoFitWidths}>
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
            {toolbarRight && renderToolbar(toolbarRight, { visibleRows: fullDisplay, visibleColumns: shownCols })}
          </div>
        </div>
      )}


      {hasFilter && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đang lọc:</span>
          {Object.entries(textFilters).map(([key, val]) => {
            if (!val) return null;
            const col = columns.find(c => c.key === key);
            return (
              <Badge key={key} variant="secondary" className="gap-1 px-2 py-0.5 h-6">
                <span className="text-muted-foreground">{col?.label}:</span>
                <span className="truncate max-w-[120px]">{val}</span>
                <button 
                  onClick={() => setTextFilters(prev => {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                  })}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {Object.entries(catFilters).map(([key, sel]) => {
            if (!sel || sel.size === 0) return null;
            const col = columns.find(c => c.key === key);
            return (
              <Badge key={key} variant="secondary" className="gap-1 px-2 py-0.5 h-6">
                <span className="text-muted-foreground">{col?.label}:</span>
                <span className="truncate max-w-[120px]">{Array.from(sel).join(", ")}</span>
                <button 
                  onClick={() => clearCat(key)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-destructive"
          >
            Xoá tất cả bộ lọc
          </Button>
        </div>
      )}

      {isMobile ? (
        <div className="space-y-3">
          {fullDisplay.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground border rounded-lg bg-card">
              {hasFilter ? "Không có dòng nào khớp bộ lọc" : (gated ? "Bảng đang trống." : (emptyContent ?? emptyText))}
            </div>
          ) : (
            display.map((r) => {
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
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                  <TableHead className="sticky left-0 top-0 z-30 w-10 bg-muted border-r border-border/50">
                    <div className="flex justify-center">
                      {!hideReorderToggle && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6 transition-colors", internalReorder && "text-primary bg-primary/10")}
                          onClick={() => setInternalReorder(!internalReorder)}
                          title="Bật/tắt chế độ kéo thả đổi thứ tự cột"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                )}

                {shownCols.map((c) => {
                  const savedW = prefs.widths[c.key];
                  const minWVal = c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : "100px";
                  const currentWidth = savedW || parseInt(minWVal || "100") || 120;
                  const canSort = sortableKey(c);
                  const sortActive = sort?.key === c.key;

                  return (
                    <TableHead
                      key={c.key}
                      className={cn(
                        "group relative bg-muted border-r border-border/50 last:border-r-0",
                        c.sticky && "sticky left-0 z-30",
                        selectable && c.sticky && "left-10",
                        c.align === "center" && "text-center",
                        c.align === "right" && "text-right",
                        sortActive && "bg-primary/5"
                      )}
                      style={{ 
                        width: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined),
                        minWidth: savedW ? `${savedW}px` : (c.minW ? (c.minW.includes('[') ? c.minW.match(/\[(.*?)\]/)?.[1] : c.minW) : undefined)
                      }}
                    >
                      <div className={cn("flex items-center gap-1", c.align === "right" && "justify-end", c.align === "center" && "justify-center")}>
                        {reorder && (
                          <div
                            className="h-6 w-4 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", c.key);
                              e.currentTarget.parentElement?.parentElement?.classList.add("opacity-50");
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.parentElement?.parentElement?.classList.remove("opacity-50");
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.parentElement?.parentElement?.classList.add("bg-primary/10");
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.parentElement?.parentElement?.classList.remove("bg-primary/10");
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.parentElement?.parentElement?.classList.remove("bg-primary/10");
                              const fromKey = e.dataTransfer.getData("text/plain");
                              const toKey = c.key;
                              if (fromKey && fromKey !== toKey) {
                                const newOrder = [...prefs.order];
                                const fromIdx = newOrder.indexOf(fromKey);
                                const toIdx = newOrder.indexOf(toKey);
                                if (fromIdx > -1 && toIdx > -1) {
                                  newOrder.splice(fromIdx, 1);
                                  newOrder.splice(toIdx, 0, fromKey);
                                  prefs.setOrder(newOrder);
                                }
                              }

                            }}
                          >
                            <GripVertical className="h-3 w-3" />
                          </div>
                        )}

                        {canSort ? (
                          <button
                            type="button"
                            onClick={() => cycleSort(c.key)}
                            className="group inline-flex min-w-0 items-center gap-1 rounded hover:text-foreground text-left"
                            title="Bấm để sắp xếp"
                          >
                            <span className="truncate">{c.label}</span>
                            {sortActive ? (
                              sort!.dir === "asc"
                                ? <ArrowUp className="h-3 w-3 shrink-0 text-primary" />
                                : <ArrowDown className="h-3 w-3 shrink-0 text-primary" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                            )}
                          </button>
                        ) : (
                          <span className="truncate">{c.label}</span>
                        )}

                        {c.filter && (
                          <ColFilter
                            type={c.filter}
                            label={c.label}
                            catValues={catValues[c.key] ?? []}
                            catSel={catFilters[c.key] ?? new Set()}
                            onToggleCat={(v: string) => toggleCat(c.key, v)}
                            onClearCat={() => clearCat(c.key)}
                            textVal={textFilters[c.key] ?? ""}
                            onText={(v: string) => setTextFilters((p) => ({ ...p, [c.key]: v }))}
                          />
                        )}
                      </div>

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
                      title={hasFilter ? "Không có dòng nào khớp bộ lọc" : (emptyContent ? undefined : emptyText)}
                      description={hasFilter ? "Vui lòng thử điều chỉnh hoặc xoá các bộ lọc đang bật" : (typeof emptyContent === "string" ? emptyContent : undefined)}
                      action={hasFilter ? (
                        <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-4">
                          Xoá tất cả bộ lọc
                        </Button>
                      ) : undefined}
                    />
                    {!hasFilter && typeof emptyContent !== "string" && emptyContent}
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

function ColFilter({
  type,
  label,
  catValues,
  catSel,
  onToggleCat,
  onClearCat,
  textVal,
  onText,
}: {
  type: "text" | "cat";
  label: string;
  catValues: { value: string; count: number }[];
  catSel: Set<string>;
  onToggleCat: (v: string) => void;
  onClearCat: () => void;
  textVal: string;
  onText: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const active = type === "text" ? textVal.length > 0 : catSel.size > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 ml-auto shrink-0 transition-colors",
            active ? "text-primary bg-primary/10" : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted"
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Filter className={cn("h-3 w-3", active && "fill-current")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-border/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bộ lọc: {label}</span>
          {active && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (type === "text") onText("");
                else onClearCat();
              }}
            >
              Xoá lọc
            </Button>
          )}
        </div>

        {type === "text" ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Tìm nội dung..."
                value={textVal}
                onChange={(e) => onText(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground px-1 italic">
              * Lọc theo từ khóa chứa trong cột
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Tìm giá trị..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-1">
              {catValues
                .filter((v) => !q || normalize(v.value).includes(normalize(q)))
                .map((v) => (
                  <DropdownMenuCheckboxItem
                    key={v.value}
                    checked={catSel.has(v.value)}
                    onCheckedChange={() => onToggleCat(v.value)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-sm py-1.5 px-2 cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate mr-2">{v.value}</span>
                    <Badge variant="outline" className="text-[9px] font-mono font-medium ml-auto px-1 h-4 bg-muted/30">
                      {v.count}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              {catValues.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  Không có giá trị khả dụng
                </div>
              )}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
