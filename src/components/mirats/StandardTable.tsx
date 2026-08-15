import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/mirats/Skeletons";
import { EmptyState } from "@/components/mirats/EmptyState";
import { BP_PX } from "@/lib/mirats/ui/responsive-scope";
import { useColumnPrefs } from "@/lib/mirats/use-column-prefs";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@/components/mirats/ui/Icon";
import { useDensity } from "@/components/mirats/DensityToggle";
import { 
  GripVertical, 
  ChevronRight, ChevronDown, MoreVertical 
} from "lucide-react";

import { normalize } from "@/lib/mirats/global-search";
import { parseMinW, calculateOptimalWidths } from "@/lib/mirats/ui/table-geometry";



import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { MauChip } from "@/components/mirats/MauChip";
import { UserAvatar } from "@/components/mirats/UserAvatar";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { fmtNgay, fmtVND, fmtSo, KHONG_CO } from "@/lib/mirats/format";
import { Check, X as XIcon } from "lucide-react";



export type ColumnType = 
  | "id" 
  | "status" 
  | "taxonomy" 
  | "user" 
  | "number" 
  | "currency" 
  | "percent" 
  | "date" 
  | "expiring" 
  | "boolean" 
  | "path" 
  | "longtext" 
  | "actions";

export interface ColumnDef<T> {
  key: string;
  header?: string;
  /** @deprecated use header instead */
  label?: string;
  type?: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: boolean;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  /** @deprecated use render instead */
  cell?: (row: T) => React.ReactNode;
  value?: (row: T) => any;
  priority?: "primary" | "secondary" | "detail";
  hideBelow?: number | string;
  hidden?: boolean;
  defaultHidden?: boolean;
  grow?: number;
  cellClassName?: string;
  lineClamp?: number;
  filter?: "text" | "cat";
  sortValue?: (r: T) => any;
  group?: string;
  inherited?: boolean;
  /** @deprecated use minWidth instead */
  minW?: string;
}


/** @deprecated Use ColumnDef instead */
export type StdColumn<T> = ColumnDef<T>;





export interface StandardTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
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
  toolbarRight?: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: ColumnDef<T>[] }) => React.ReactNode);
  toolbarLeft?: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: ColumnDef<T>[] }) => React.ReactNode);
  bulkActions?: (ctx: {
    selectedRows: T[];
    visibleColumns: ColumnDef<T>[];
    allColumns: ColumnDef<T>[];
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
  onColumnsChange?: (visibleKeys: string[]) => void;
  virtualizerOptions?: any;
  expandable?: boolean;
  renderExpansion?: (row: T) => React.ReactNode;
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
  trangThai = {},

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
  onColumnsChange,
  virtualizerOptions,
  expandable,
  renderExpansion,
}: StandardTableProps<T>) {



  const [containerWidth, setContainerWidth] = useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!parentRef.current || typeof ResizeObserver === "undefined") return;
    
    let frameId: number;
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
    });
    
    observer.observe(parentRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  const toggleExpand = useCallback((rid: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });
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
        let visibleKeys = currentPreset.columns || currentPreset.cot || currentPreset.visibleKeys || [];
        if (currentPreset.id === "day-du" && visibleKeys.length === 0) {
          visibleKeys = allKeys;
        }
        prefs.setPreset(currentPreset.id, visibleKeys, currentPreset.orderKeys || visibleKeys);
      }
    }
  }, [presets, activePreset, prefs.ready, prefs.isCustomized, prefs.activePreset]);

  const viewMode = useMemo(() => {
    if (containerWidth === 0) return "desktop";
    if (containerWidth < UI_DENSITY.CONT_SM) return "mobile";
    if (containerWidth < UI_DENSITY.CONT_MD) return "tablet";
    return "desktop";
  }, [containerWidth]);

  const isMobile = viewMode === "mobile";

  // Sắp xếp cột theo thứ tự người dùng đã chọn
  const sortedColumns = useMemo(() => {
    const withPriority = columns.map((c, idx) => {
      if (c.priority) return c;
      // Quy tắc suy diễn: 
      // - 2 cột đầu (hoặc ma/ten): primary
      // - 3 cột tiếp theo: secondary
      // - còn lại: detail
      let priority: "primary" | "secondary" | "detail" = "detail";
      const isCore = ["ma", "ten", "ma_thiet_bi", "ten_thiet_bi"].includes(c.key.toLowerCase());
      if (isCore || idx < 2) priority = "primary";
      else if (idx < 5) priority = "secondary";
      
      return { ...c, priority };
    });

    if (!tableKey) return withPriority;
    const order = prefs.order;
    return [...withPriority].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }, [columns, tableKey, prefs.order]);

  const shownCols = useMemo(() => {
    return sortedColumns.filter((c) => {
      // Tầng 1: Người dùng ẩn cột cố tình -> Ẩn mọi nơi
      if (tableKey && (prefs.hidden as Set<string>).has(c.key)) return false;
      
      // Tầng 3: Ẩn cứng trong định nghĩa cột -> Ẩn mọi nơi
      if (c.hidden) return false;

      // Priority-based hiding:
      // Tablet ẩn detail, Mobile chuyển sang Card (handled in render)
      if (viewMode === "tablet" && c.priority === "detail") return false;

      // Tầng 2: Ẩn theo bề rộng màn hình (hideBelow) -> Chỉ ẩn trên UI
      if (!c.hideBelow) return true;
      const threshold = typeof c.hideBelow === "number" 
        ? c.hideBelow 
        : (BP_PX as any)[c.hideBelow] || BP_PX.md;
      const isShown = containerWidth >= threshold;
      
      // TRƯỜNG HỢP ĐẶC BIỆT: Nếu viewMode là tablet và cột là detail, 
      // ta LUÔN ẩn nó đi để nhường chỗ cho nút mở rộng dòng.
      if (viewMode === "tablet" && c.priority === "detail") return false;
      
      return isShown;
    });
  }, [sortedColumns, tableKey, prefs.hidden, containerWidth, viewMode]);



  // Sync visible keys ra ngoài nếu có yêu cầu
  useEffect(() => {
    if (onColumnsChange) {
      onColumnsChange(shownCols.map(c => c.key));
    }
  }, [shownCols, onColumnsChange]);


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
    toolbar: React.ReactNode | ((ctx: { visibleRows: T[]; visibleColumns: ColumnDef<T>[] }) => React.ReactNode),
    ctx: { visibleRows: T[]; visibleColumns: ColumnDef<T>[] }
  ) => {
    if (typeof toolbar === "function") {
      return toolbar(ctx);
    }
    return toolbar;
  };

  const colText = useCallback((col: ColumnDef<T>, row: T): string => {
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

  const sortableKey = useCallback((c: ColumnDef<T>) => c.sortable ?? !!(c.sortValue || c.value), []);
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
    const count = fullDisplay.length;
    notifyFilteredTotal?.(count);
    
    // Task 25: Thông báo số dòng thay đổi cho screen reader
    if (hasFilter) {
      setLiveAnnouncement(`Tìm thấy ${count} ${countUnit}`);
    } else {
      setLiveAnnouncement("");
    }
  }, [fullDisplay.length, notifyFilteredTotal, hasFilter, countUnit]);

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
  const [density] = useDensity();

  const estimateRowHeight = useMemo(() => {
    if (density === "compact") return 32;
    if (density === "comfortable") return 40;
    return 48;
  }, [density]);

  const rowVirtualizer = useVirtualizer({
    count: display.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: isTest ? 100 : 15,
    initialOffset: isTest ? 0 : undefined,
    initialRect: isTest ? { width: 1000, height: 1000 } : undefined,
    ...virtualizerOptions,
  });

  // Re-measure when density changes
  useEffect(() => {
    rowVirtualizer.measure();
  }, [density, rowVirtualizer]);

  // Sync expanded state with virtualizer
  useEffect(() => {
    rowVirtualizer.measure();
  }, [expandedRows, rowVirtualizer]);











  const virtualRows = rowVirtualizer.getVirtualItems();

  // Force render all items in JSDOM tests since scrolling/sizing is broken
  const displayItems = isTest ? display.map((d, index) => ({
    index,
    start: index * estimateRowHeight,
    size: estimateRowHeight,
    end: (index + 1) * estimateRowHeight,
    lane: 0,
    key: index,
  })) : virtualRows;

  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = displayItems.length > 0 ? displayItems[0]?.start || 0 : 0;
  const paddingBottom =
    displayItems.length > 0
      ? totalSize - (displayItems[displayItems.length - 1]?.end || 0)
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

  const renderGlobalState = () => {
    if (trangThai.loi) {
      return errorContent ?? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-4 border rounded-lg bg-card">
          <div className="text-sm text-destructive font-medium">
            {String(trangThai.loi)}
          </div>
          {trangThai.loi.retry && (
            <Button variant="outline" size="sm" onClick={trangThai.loi.retry}>
              Thử lại
            </Button>
          )}
        </div>
      );
    }

    if (trangThai.dangTai) {
      return (
        <div className="p-4 border rounded-lg bg-card">
          {loadingContent ?? <TableSkeleton cols={isMobile ? 1 : shownCols.length} rows={isMobile ? 3 : 6} />}
        </div>
      );
    }

    if (fullDisplay.length === 0) {
      return (
        <div className="py-20 border rounded-lg bg-card">
          <EmptyState
            title={hasFilter ? "Không có dòng nào khớp bộ lọc" : (gated ? "Vui lòng chọn bộ lọc để xem dữ liệu" : (emptyContent ? undefined : emptyText))}
            description={hasFilter ? "Vui lòng thử điều chỉnh hoặc xoá các bộ lọc đang bật" : (typeof emptyContent === "string" ? emptyContent : undefined)}
            action={hasFilter ? (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-4">
                Xoá tất cả bộ lọc
              </Button>
            ) : undefined}
            live="polite"
          />
          {!hasFilter && typeof emptyContent !== "string" && emptyContent}
        </div>
      );
    }

    return null;
  };

  /** Tự động render ô dựa trên `type` */
  function renderAutoCell(c: ColumnDef<T>, r: T) {
    const val = c.value?.(r);
    
    // Nếu không có value thì trả về null
    if (val === undefined || val === null) return KHONG_CO;

    const density = document.body.dataset.density as any;
    const isCompact = density === "compact";

    switch (c.type) {
      case "id":
        return <CodeBadge code={String(val)} title={String(val)} />;
      
      case "status":
        // status-registry cần DomainKey, ở đây ta chưa biết domain chính xác.
        // Ta sẽ dùng StatusBadge với domain mặc định hoặc suy luận.
        // Nếu val là object có domain và code thì dùng.
        if (typeof val === 'object' && val !== null && 'domain' in val) {
          const v = val as any;
          return <StatusBadge domain={v.domain} code={v.code} />;
        }
        // Fallback: Nếu là string, thử tìm domain thiet_bi
        return <StatusBadge domain="thiet_bi" code={String(val)} />;

      case "taxonomy":
        // val có thể là { ten, mau }
        if (typeof val === 'object' && val !== null) {
          const v = val as any;
          return <MauChip ten={v.ten} mau={v.mau} />;
        }
        return <MauChip ten={String(val)} />;

      case "user":
        // val có thể là { ho_ten, email, avatar_url }
        if (typeof val === 'object' && val !== null) {
          const v = val as any;
          return (
            <div className="flex items-center gap-2">
              <UserAvatar 
                name={v.ho_ten || v.ten} 
                email={v.email} 
                url={v.avatar_url || v.url} 
                className="h-6 w-6" 
              />
              <span className="truncate text-[12px]">{v.ho_ten || v.ten || "—"}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <UserAvatar name={String(val)} className="h-6 w-6" />
            <span className="truncate text-[12px]">{String(val)}</span>
          </div>
        );

      case "number":
        return <span className="tabular-nums">{fmtSo(Number(val))}</span>;

      case "currency":
        return <span className="tabular-nums">{fmtVND(Number(val))}</span>;

      case "percent":
        const p = Number(val);
        return (
          <div className="flex items-center gap-2 w-full">
            <span className="w-8 tabular-nums text-[11px] font-semibold">{p}%</span>
            <Progress value={p} className="h-1.5 flex-1" />
          </div>
        );

      case "date":
        return (
          <AppTooltip noiDung={String(val)}>
            <span className="text-[12px] tabular-nums">{fmtNgay(val)}</span>
          </AppTooltip>
        );

      case "expiring":
        return <ExpiringBadge soNgay={Number(val)} compact={isCompact} />;

      case "boolean":
        return (
          <div className="flex justify-center">
            {val ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <XIcon className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>
        );

      case "path":
        const parts = String(val).split(/[>/]/);
        const last = parts[parts.length - 1];
        return (
          <AppTooltip noiDung={String(val)}>
            <span className="text-[12px] truncate">{last}</span>
          </AppTooltip>
        );

      case "longtext":
        return (
          <AppTooltip noiDung={String(val)}>
            <div
              className={cn(
                "text-[12px] break-words [overflow-wrap:anywhere] [word-break:break-word]",
                (c.lineClamp ?? 1) > 1 ? `line-clamp-${c.lineClamp}` : "truncate"
              )}
            >
              {String(val)}
            </div>
          </AppTooltip>
        );

      case "actions":
        // Thường do render/cell xử lý, auto-cell chỉ làm khung
        return val as any;

      default:
        // Kiểu chữ thô (mặc định)
        return (
          <div
            className={cn(
              "text-[12px] break-words [overflow-wrap:anywhere] [word-break:break-word]",
              (c.lineClamp ?? 1) > 1 ? `line-clamp-${c.lineClamp}` : "truncate"
            )}
            title={String(val)}
          >
            {String(val)}
          </div>
        );
    }
  }

  function renderCellContent(c: ColumnDef<T>, r: T) {
    if (c.render) return c.render(r);
    if (c.cell) return c.cell(r);
    return renderAutoCell(c, r);
  }


  return (
    <div className="space-y-1">
      {/* Vùng ẩn thông báo trạng thái cho screen reader */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveAnnouncement}
      </div>

      {(toolbarRight || toolbarLeft || (selectable && selectedRows.length > 0)) && (
        <div className="flex items-center justify-between gap-1 px-0">
          <div className="flex items-center gap-1">
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
                {isMobile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <AppTooltip noiDung="Mở bộ lọc và sắp xếp cột cho di động">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 ml-1">
                          <Icon name="table.filter" size="small" />
                          <span className="sr-only">Bộ lọc</span>
                        </Button>
                      </AppTooltip>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[280px]">
                      <div className="p-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Bộ lọc & Sắp xếp</span>
                          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-[10px] uppercase font-bold text-destructive">
                            Xoá hết
                          </Button>
                        </div>
                        
                        {/* Mobile Column Filters */}
                        <div className="space-y-3">
                          {columns.filter(c => c.filter).map(c => (
                            <ColFilter
                              key={c.key}
                              type={c.filter || "text"}
                               label={c.header || c.label || ""}
                              catValues={catValues[c.key] || []}
                              catSel={catFilters[c.key] || new Set()}
                              onToggleCat={(val) => toggleCat(c.key, val)}
                              onClearCat={() => clearCat(c.key)}
                              textVal={textFilters[c.key] || ""}
                              onText={(val) => setTextFilters(prev => ({ ...prev, [c.key]: val }))}
                            />
                          ))}
                        </div>

                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0 ml-1"
                              disabled={!prefs.ready}
                            >
                              <Icon name="table.settings" size="small" />
                              <span className="sr-only">Cột hiển thị</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Tuỳ chỉnh các cột hiển thị</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Hiển thị cột</span>
                        <Icon name="table.settings" size="small" className="text-muted-foreground/50" />
                      </DropdownMenuLabel>
                      
                      {presets && presets.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs">
                              <Icon name="action.view" size="small" className="mr-2" />
                              Khung nhìn mẫu
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="w-48">
                                {presets.map((p) => (
                                  <DropdownMenuItem 
                                    key={p.id} 
                                    className="text-xs flex flex-col items-start gap-0.5"
                                    onClick={() => {
                                      const keys = p.columns || p.cot || p.visibleKeys || [];
                                      const finalKeys = (p.id === "day-du" && keys.length === 0) ? allKeys : keys;
                                      prefs.setPreset(p.id, finalKeys, p.orderKeys || finalKeys);
                                    }}
                                  >
                                    <div className="flex items-center w-full">
                                      <span className="font-medium">{p.ten || p.label}</span>
                                      {prefs.activePreset === p.id && <Check className="ml-auto h-3 w-3 text-primary" />}
                                    </div>
                                    {p.moTa && <span className="text-[10px] text-muted-foreground leading-tight">{p.moTa}</span>}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </>
                      )}

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
                            
                            // NGUYÊN NHÂN 1: Xác định cột có đang bị ẩn do bề rộng màn hình không
                            let isHiddenByWidth = false;
                            let thresholdLabel = "";
                            if (col.hideBelow) {
                              const threshold = typeof col.hideBelow === "number" 
                                ? col.hideBelow 
                                : (BP_PX as any)[col.hideBelow] || BP_PX.md;
                              isHiddenByWidth = containerWidth < threshold;
                              thresholdLabel = typeof col.hideBelow === "string" ? col.hideBelow : `${threshold}px`;
                            }

                            // Chặn việc ẩn cột cuối cùng
                            const canToggle = !isCurrentlyVisible || (allKeys.length - prefs.hidden.size > 1);
                            
                            return (
                              <DropdownMenuCheckboxItem
                                key={col.key}
                                checked={isCurrentlyVisible}
                                onCheckedChange={() => prefs.toggle(col.key)}
                                 onSelect={(e: Event) => e.preventDefault()}
                                disabled={!canToggle}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className={cn(
                                  isHiddenByWidth && isCurrentlyVisible && "text-muted-foreground/60",
                                  col.inherited && "italic text-muted-foreground/80 flex items-center gap-1.5"
                                )}>
                                  {col.inherited && <Icon name="entity.asset" size="tiny" className="opacity-60" />}
                                  {col.header || col.label}
                                </span>
                                
                                {isHiddenByWidth && isCurrentlyVisible && (
                                  <AppTooltip noiDung={`Cột này đang tạm ẩn do màn hình hẹp (< ${thresholdLabel}). Hãy mở rộng trình duyệt hoặc xem ở dòng mở rộng.`}>
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-tighter">
                                      <Icon name="status.warning" size="tiny" />
                                      Hẹp
                                    </div>
                                  </AppTooltip>
                                )}
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

                <div className="flex items-center">
                  {!hideReorderToggle && (
                    <AppTooltip noiDung="Bật/tắt chế độ kéo thả đổi thứ tự cột">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 ml-0.5 transition-colors", internalReorder && "text-primary bg-primary/10")}
                        onClick={() => setInternalReorder(!internalReorder)}
                      >
                        <GripVertical className="h-4 w-4" />
                        <span className="sr-only">Kéo thả cột</span>
                      </Button>
                    </AppTooltip>
                  )}
                  <AppTooltip noiDung="Tự căn theo nội dung">
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-0.5" onClick={autoFitWidths}>
                      <Icon name="table.maximize" size="small" />
                      <span className="sr-only">Tự căn</span>
                    </Button>
                  </AppTooltip>
                  <AppTooltip noiDung="Đặt lại độ rộng mọi cột">
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-0.5 text-destructive/70 hover:text-destructive" onClick={resetAllWidths}>
                      <Icon name="table.reset" size="small" />
                      <span className="sr-only">Đặt lại độ rộng</span>
                    </Button>
                  </AppTooltip>
                </div>
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
                <span className="text-muted-foreground">{col?.header || col?.label}:</span>
                <span className="truncate max-w-[120px]">{val}</span>
                <button 
                  onClick={() => setTextFilters(prev => {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                  })}
                  className="hover:text-destructive transition-colors"
                >
                  <Icon name="action.close" size="tiny" />
                </button>
              </Badge>
            );
          })}
          {Object.entries(catFilters).map(([key, sel]) => {
            if (!sel || sel.size === 0) return null;
            const col = columns.find(c => c.key === key);
            return (
              <Badge key={key} variant="secondary" className="gap-1 px-2 py-0.5 h-6">
                <span className="text-muted-foreground">{col?.header || col?.label}:</span>
                <span className="truncate max-w-[120px]">{Array.from(sel).join(", ")}</span>
                <button 
                  onClick={() => clearCat(key)}
                  className="hover:text-destructive transition-colors"
                >
                  <Icon name="action.close" size="tiny" />
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
          {renderGlobalState() || (
            display.map((r) => {
              const rid = getRowIdInternal(r);
              const isSel = selectable && selected?.has(rid);
              
              // Mobile lấy cột theo priority
              const primaryCols = sortedColumns.filter(c => c.priority === "primary");
              const secondaryCols = sortedColumns.filter(c => c.priority === "secondary");
              const detailCols = sortedColumns.filter(c => c.priority === "detail");


              return (
                <Card
                  key={rid}
                  className={cn(
                    "relative cursor-pointer transition-colors hover:bg-muted/50 overflow-hidden",
                    isSel && "border-primary bg-primary/5 shadow-sm shadow-primary/10",
                    rowClassName?.(r)
                  )}
                  onClick={() => onRowClick?.(r)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* Tiêu đề thẻ (Primary) */}
                      <div className="flex items-start justify-between p-4 bg-muted/20 border-b border-border/40">
                        <div className="flex-1 space-y-1 min-w-0 pr-6">
                          {primaryCols.map((col, idx) => (
                            <div key={col.key} className={idx === 0 ? "font-semibold text-sm truncate" : "text-[12px] text-muted-foreground truncate"}>
                              {col.render ? col.render(r) : col.cell ? col.cell(r) : String(col.value?.(r) ?? "")}
                            </div>
                          ))}
                        </div>
                        {selectable && (
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleRow(rid)}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="mt-1"
                            aria-label={`Chọn dòng ${rid}`}
                          />
                        )}
                      </div>

                      {/* Nội dung thẻ (Secondary) */}
                      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                        {secondaryCols.map((col) => (
                          <div key={col.key} className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                              {col.header || col.label}
                            </span>
                            <div className={cn("text-[12px] truncate", col.cellClassName)}>
                              {renderCellContent(col, r)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dòng chi tiết (Detail) - Mobile Expandable */}
                      {expandedRows.has(rid) && detailCols.length > 0 && (
                        <div className="px-4 py-3 bg-muted/10 border-t border-border/20 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-1">
                          {detailCols.map((col) => (
                            <div key={col.key} className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                                {col.header || col.label}
                              </span>
                              <div className={cn("text-[12px] break-words", col.cellClassName)}>
                                {renderCellContent(col, r)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hành động (nếu có toolbar hoặc onRowClick) */}
                      <div className="flex items-center justify-between p-2 bg-muted/5 border-t border-border/30 gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-[12px] gap-1.5 text-muted-foreground"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(rid); }}
                        >
                        {expandedRows.has(rid) ? (
                            <>
                              <Icon name="table.collapse" size="tiny" />
                              <span>Thu gọn</span>
                            </>
                          ) : (
                            <>
                              <Icon name="table.expand" size="tiny" />
                              <span>Xem thêm ({detailCols.length})</span>
                            </>
                          )}
                        </Button>

                        {(toolbarRight || onRowClick) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-[12px] gap-1 text-primary"
                            onClick={() => onRowClick?.(r)}
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card ref={parentRef} className={cn("relative min-h-0 overflow-auto border shadow-none bg-background", maxHeightClass)}>
          <Table className={cn(
            "border-separate border-spacing-0 caption-bottom",
            density === "compact" && "text-[12px]",
            density === "comfortable" && "text-[13px]",
            density === "spacious" && "text-[14px]",
            prefs.layoutMode === "auto" ? "w-max table-auto" : "w-full table-fixed"
          )}>
            <colgroup>
              {viewMode === "tablet" && (
                <col style={{ width: 40, minWidth: 40 }} />
              )}
              {selectable && (
                <col style={{ width: 40, minWidth: 40 }} />
              )}

              {shownCols.map(c => {
                const savedW = prefs.widths[c.key];
                const w = savedW || c.width || (c.minW ? parseMinW(c.minW) : 100);
                const min = c.minWidth || (c.minW ? parseMinW(c.minW) : 100);
                
                return (
                  <col 
                    key={c.key} 
                    style={{ 
                      width: w, 
                      minWidth: min,
                      maxWidth: c.maxWidth 
                    }} 
                  />
                );
              })}
            </colgroup>

            <TableHeader className="bg-muted/30 sticky top-0 z-20">
              <TableRow className={cn(
                "hover:bg-transparent border-b border-border/60",
                density === "compact" ? "h-8 min-h-[32px]" : density === "comfortable" ? "h-9" : "h-11"
              )}>
                {viewMode === "tablet" && (
                  <TableHead className="sticky left-0 top-0 z-30 w-10 bg-muted/30 border-r border-border/50 p-0">
                    {/* Placeholder for expansion column header */}
                  </TableHead>
                )}
                {selectable && (
                  <TableHead 
                    scope="col"
                    className={cn(
                      "sticky left-0 top-0 z-30 w-10 bg-muted/30 border-r border-border/50 p-0",
                      viewMode === "tablet" && "left-10"
                    )}
                  >
                    <div className="flex h-full w-full items-center justify-center">
                      <Checkbox 


                        checked={
                          filtered.length > 0 && selected?.size === filtered.length
                            ? true
                            : (selected?.size ?? 0) > 0
                            ? "indeterminate"
                            : false
                        }
                        onCheckedChange={(checked) => {
                          if (checked) setSelected?.(new Set(filtered.map(getRowIdInternal)));
                          else clearSelection();
                        }}
                        aria-label="Chọn tất cả các dòng"
                      />
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
                      scope="col"
                      aria-sort={sortActive ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                      className={cn(
                        "group relative bg-muted/30 border-r border-border/50 last:border-r-0 p-0",
                        c.sticky && "sticky left-0 z-30",
                        selectable && c.sticky && "left-10",
                        c.align === "center" && "text-center",
                        c.align === "right" && "text-right",
                        sortActive && "bg-primary/5"
                      )}
                      style={{ 
                        // Cấu trúc colgroup đã lo phần width/minWidth cho layout table-fixed
                        // Tuy nhiên sticky header vẫn cần width để tính toán offset nếu có nhiều cột sticky
                        width: "100%", 
                        height: "100%"
                      }}

                    >
                      <div className={cn("flex items-center gap-1 h-full w-full", c.align === "right" && "justify-end", c.align === "center" && "justify-center")}>
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
                            className={cn(
                              "group inline-flex min-w-0 items-center gap-1 rounded hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none h-full px-2",
                              c.align === "center" ? "justify-center w-full" : c.align === "right" ? "justify-end w-full text-right" : "justify-start text-left w-full"
                            )}


                            title={`Sắp xếp theo ${c.label}`}
                            aria-label={`Sắp xếp theo ${c.label}`}
                          >
                            <span className="truncate">{c.label}</span>
                            {sortActive ? (
                              sort!.dir === "asc"
                                ? <Icon name="table.sortAsc" size="tiny" className="text-primary" />
                                : <Icon name="table.sortDesc" size="tiny" className="text-primary" />
                            ) : (
                              <Icon name="table.sortNone" size="tiny" className="text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                            )}
                          </button>
                        ) : (
                           <span className="truncate">{c.header || c.label || ""}</span>
                        )}

                        {c.filter && (
                          <ColFilter
                            type={c.filter}
                            label={c.header || c.label || ""}
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
                        role="separator"
                        tabIndex={0}
                        aria-label={`Thay đổi độ rộng cột ${c.label}`}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary/30 transition-opacity z-10 focus-visible:opacity-100 focus-visible:bg-primary/30 outline-none"
                        onMouseDown={(e) => onHandleMouseDown(e, c.key, currentWidth)}
                        onDoubleClick={() => prefs.resetWidth(c.key)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            const step = e.shiftKey ? 32 : 8;
                            const nextW = Math.max(60, currentWidth + (e.key === "ArrowRight" ? step : -step));
                            prefs.setWidth(c.key, nextW);
                          }
                        }}
                        title="Kéo để đổi độ rộng — bấm đúp để đặt lại"
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderGlobalState() ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0) + (viewMode === "tablet" ? 1 : 0)} className="p-0 border-0">
                    {renderGlobalState()}
                  </TableCell>
                </TableRow>
              ) : (

                <>
                  {paddingTop > 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={shownCols.length + (selectable ? 1 : 0) + (viewMode === "tablet" ? 1 : 0)} style={{ height: `${paddingTop}px` }} className="p-0 border-0 pointer-events-none" />
                    </TableRow>
                  )}

                  {displayItems.map((virtualRow) => {
                    const r = rows[virtualRow.index];
                    const rid = getRowIdInternal(r);
                    const isSel = selectable && selected?.has(rid);
  /** Tự động render ô dựa trên `type` */

  return (
                      <React.Fragment key={rid}>
                        <TableRow
                          data-index={virtualRow.index}
                          ref={(el) => {
                            rowVirtualizer.measureElement(el);
                            // Nếu có lineClamp hoặc nội dung phức tạp, TanStack Virtual sẽ tự đo lại qua ref này
                          }}
                          className={cn(
                            "group border-b border-border/40 transition-mirats-fast hover:bg-muted/60", 
                            (onRowClick || selectable) && "cursor-pointer", 
                            isSel && "bg-primary/5", 
                            expandedRows.has(rid) && "bg-muted/40",
                            density === "compact" ? "h-8 min-h-[32px]" : density === "comfortable" ? "h-9" : "h-11",
                            rowClassName?.(r)
                          )}
                          onClick={() => onRowClick?.(r)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              if ((e.target as HTMLElement).tagName !== "BUTTON" && (e.target as HTMLElement).tagName !== "INPUT") {
                                e.preventDefault();
                                onRowClick?.(r);
                              }
                            }
                          }}
                          tabIndex={onRowClick ? 0 : undefined}
                        >
                          {viewMode === "tablet" && (
                            <TableCell
                              onClick={(e) => { e.stopPropagation(); toggleExpand(rid); }}
                              className="sticky left-0 z-10 bg-card border-r border-border/30 p-0 text-center"
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  {expandedRows.has(rid) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          {selectable && (
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "sticky left-0 z-10 bg-card border-r border-border/30 p-0",
                                viewMode === "tablet" && "left-10"
                              )}
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <Checkbox checked={isSel} onCheckedChange={() => toggleRow(rid)} aria-label={`Chọn dòng ${rid}`} />


                              </div>
                            </TableCell>
                          )}

                          {shownCols.map((c, colIdx) => {
                            const savedW = prefs.widths[c.key];
                            return (
                                <TableCell
                                  key={c.key}
                                  scope={colIdx === 0 ? "row" : undefined}
                                className={cn(
                                  c.cellClassName,
                                  density === "compact" ? "px-1 py-0.5" : density === "comfortable" ? "px-1.5 py-0.5" : "px-3 py-1.5",
                                  c.sticky && "sticky left-0 z-10 bg-card border-r border-border/30",
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
                              <div className="truncate w-full max-w-full">{renderCellContent(c, r)}</div>
                            </TableCell>
                          )})}
                        </TableRow>
                        
                        {/* Dòng mở rộng (Expandable Row Content) */}
                        {expandedRows.has(rid) && (
                          <TableRow className="bg-muted/10 border-b border-border/20">
                            <TableCell 
                              colSpan={shownCols.length + (selectable ? 1 : 0) + (viewMode === "tablet" ? 1 : 0)}
                              className="p-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {sortedColumns
                                  .filter(c => !shownCols.find(sc => sc.key === c.key)) // Lấy các cột đang bị ẩn
                                  .map(col => (
                                    <div key={col.key} className="flex flex-col gap-1 min-w-0 text-left">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        {col.header || col.label}
                                      </span>
                                      <div className="text-[12px] break-words">
                                        {renderCellContent(col, r)}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}


                  {paddingBottom > 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={shownCols.length + (selectable ? 1 : 0) + (viewMode === "tablet" ? 1 : 0)} style={{ height: `${paddingBottom}px` }} className="p-0 border-0 pointer-events-none" />
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
          <Icon name={active ? "table.filterActive" : "table.filter"} size="tiny" className={cn(active && "fill-current")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-border/50" onClick={(e) => e.stopPropagation()} side="bottom">
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
              <Icon name="action.search" size="small" className="absolute left-2 top-2.5 text-muted-foreground" />
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
              <Icon name="action.search" size="small" className="absolute left-2 top-2.5 text-muted-foreground" />
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
