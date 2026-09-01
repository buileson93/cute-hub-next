import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OptimizedCell } from "./OptimizedCell";
import { TableSkeleton } from "@/components/mirats/Skeletons";
import { EmptyState } from "@/components/mirats/EmptyState";
import { BP_PX } from "@/lib/mirats/ui/responsive-scope";
import { MobileRecordCard } from "@/components/mirats/ui/MobileRecordCard";
import { BulkActionBar } from "@/components/mirats/BulkActionBar";
import { useColumnPrefs } from "@/lib/mirats/use-column-prefs";
import { type Domain } from "@/lib/mirats/quyen";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@/components/mirats/ui/Icon";
import { useDensity } from "@/components/mirats/DensityToggle";
import { GripVertical, ChevronRight, ChevronDown, MoreVertical, Loader2, XCircle, Trash2, Download, RotateCcw } from "lucide-react";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { ColumnFilterMenu } from "./table/ColumnFilterMenu";
import { Search } from "lucide-react";

import { BulkActionButton } from "./BulkActionButton";
import { TableExportDialog } from "./TableExportDialog";
import { toast } from "sonner";
import { logAudit } from "@/lib/mirats/audit";

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
import { fmtNgay, fmtVND, fmtSo, KHONG_CO } from "@/lib/mirats/format";
import { Check, X as XIcon } from "lucide-react";
import { CompletenessRing } from "@/components/mirats/CompletenessRing";
import { calculateCompleteness } from "@/lib/mirats/completeness";
import { AppTooltip } from "@/components/mirats/AppTooltip";

import { thongDiepLoi } from "@/lib/mirats/errors";

export type ColumnType =
  | "id"
  | "status"
  | "taxonomy"
  | "user"
  | "number"
  | "currency"
  | "percent"
  | "completeness"
  | "date"
  | "expiring"
  | "boolean"
  | "path"
  | "longtext"
  | "actions";

export interface ColumnDef<T> {
  key: string;
  header?: string;
  label?: string;
  type?: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: boolean;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
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
  minW?: string;
}

export type StdColumn<T> = ColumnDef<T>;

/**
 * Lấy **giá trị gốc (raw/domain value)** của một cột cho một dòng.
 * Ưu tiên accessor `value`, nếu cột không khai báo thì đọc thẳng trường cùng
 * tên `key` trong row model. Nhờ vậy các cột chỉ khai báo `key` (ví dụ
 * `nhomHeThong`, `phanLoai`) vẫn có dữ liệu để hiển thị, lọc, sắp xếp và xuất
 * file — không bao giờ phải suy ngược từ chuỗi hiển thị đã gộp.
 */
export function columnRawValue<T>(col: ColumnDef<T>, row: T): unknown {
  if (col.value) return col.value(row);
  if (row && typeof row === "object") return (row as Record<string, unknown>)[col.key];
  return undefined;
}


interface StandardTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
  getRowId?: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelect?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  toolbar?: React.ReactNode | ((ctx: {
    filteredRows: T[];
    visibleColumns: ColumnDef<T>[];
    allColumns: ColumnDef<T>[];
    pageRows: T[];
    selectedRows: T[];
    clear: () => void;
  }) => React.ReactNode);
  toolbarRight?: React.ReactNode | ((ctx: {
    filteredRows: T[];
    visibleColumns: ColumnDef<T>[];
    allColumns: ColumnDef<T>[];
    pageRows: T[];
    selectedRows: T[];
    clear: () => void;
  }) => React.ReactNode);
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  trangThai?: {
    dangTai?: boolean;
    loi?: unknown;
  };
  infiniteScroll?: {
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage: () => void;
    // fetchAll đã bị loại bỏ để chuyển sang infinite scroll 100%
    totalCount?: number;
  };
  prefKey?: string;
  gated?: boolean;
  emptyText?: string;
  tableKey?: string;
  className?: string;
  requireFilterToShow?: boolean;
  setSelected?: (ids: Set<string>) => void;
  countUnit?: string;
  bulkActions?: React.ReactNode | ((ctx: {
    filteredRows: T[];
    visibleColumns: ColumnDef<T>[];
    allColumns: ColumnDef<T>[];
    pageRows: T[];
    selectedRows: T[];
    clear: () => void;
  }) => React.ReactNode);
  presets?: any[];
  hideReorderToggle?: boolean;
  pagination?: any;
  toolbarLeft?: React.ReactNode;
  expandable?: boolean;
  renderExpansion?: (row: T) => React.ReactNode;
  virtualizerOptions?: any;
  /** Ghi đè trần chiều cao vùng cuộn của bảng (mặc định `max-h-[70dvh]`). */
  maxHeightClass?: string;
  editMode?: boolean;
  onBulkDelete?: (ids: Set<string>) => Promise<void>;
  allowBulkDelete?: boolean;
  exportable?: boolean;
  ten?: string;
  domain?: Domain;
}

export function StandardTable<T>({
  rows,
  columns,
  getRowId,
  selectable,
  selected,
  onSelect,
  onRowClick,
  rowClassName,
  toolbar,
  toolbarRight,
  emptyContent,
  loadingContent,
  errorContent,
  trangThai = {},
  infiniteScroll,
  prefKey,
  gated,
  emptyText,
  tableKey,
  className,
  requireFilterToShow,
  setSelected,
  countUnit,
  bulkActions,
  presets,
  hideReorderToggle,
  pagination,
  toolbarLeft,
  expandable,
  renderExpansion,
  virtualizerOptions,
  // Mặc định chặn chiều cao: khi trang không ràng buộc chiều cao (bảng nằm
  // trong Card trôi theo nội dung), bảng sẽ tự cuộn thay vì cao 5000px khiến
  // thanh cuộn ngang bị đẩy khỏi tầm nhìn. Trang có PageFrame vẫn nhỏ hơn mức
  // này nên không bị ảnh hưởng.
  maxHeightClass = "max-h-[70dvh]",
  editMode,
  onBulkDelete,
  allowBulkDelete,
  exportable,
  ten,
  domain,
}: StandardTableProps<T>) {
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});
  const [globalQuery, setGlobalQuery] = useState("");

  const [adaptiveOverscan, setAdaptiveOverscan] = useState(8);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<{
    ids: Set<string>;
    ten?: string;
    expiry: number;
    domain?: Domain;
  } | null>(null);
  const [localRows, setLocalRows] = useState<T[]>([]);


  useEffect(() => {
    let frameId: number;
    const checkFps = () => {
      frameCount.current++;
      const now = performance.now();
      if (now - lastTime.current > 1000) {
        const fps = frameCount.current;
        if (fps < 40) setAdaptiveOverscan((prev) => Math.max(4, prev - 1));
        else if (fps > 55) setAdaptiveOverscan((prev) => Math.min(15, prev + 1));
        frameCount.current = 0;
        lastTime.current = now;
      }
      frameId = requestAnimationFrame(checkFps);
    };
    frameId = requestAnimationFrame(checkFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const densityData = useDensity();
  const density = typeof densityData === "string" ? densityData : densityData[0];
  const tableKeyEffective = tableKey || prefKey || "standard-table";

  const performActualDeletion = useCallback(async (ids: Set<string>, delDomain?: Domain) => {
    if (!onBulkDelete) return;
    setIsDeleting(true);
    try {
      await onBulkDelete(ids);
      await logAudit({
        action: "bulk_delete",
        domain: delDomain || domain || "unknown",
        entity_ids: Array.from(ids),
        details: { count: ids.size }
      });
      toast.success(`Đã xóa ${ids.size} ${countUnit || "dòng"} thành công.`);
    } catch (error) {
      toast.error(thongDiepLoi(error, "Xóa hàng loạt thất bại"));
    } finally {
      setIsDeleting(false);
      setPendingDeletion(null);
      if (tableKeyEffective) {
        localStorage.removeItem(`pending-deletion:${tableKeyEffective}`);
      }
    }
  }, [onBulkDelete, domain, countUnit, tableKeyEffective]);

  useEffect(() => {
    setLocalRows(rows);
    
    // Resume persistent undo from localStorage
    if (tableKeyEffective) {
      const saved = localStorage.getItem(`pending-deletion:${tableKeyEffective}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const now = Date.now();
          if (data.expiry > now) {
            setPendingDeletion({
              ids: new Set(data.ids),
              ten: data.ten,
              expiry: data.expiry,
              domain: data.domain
            });
            
            // Re-schedule actual deletion
            const remaining = data.expiry - now;
            deleteTimerRef.current = setTimeout(() => {
              performActualDeletion(new Set(data.ids), data.domain);
            }, remaining);
          } else {
            // Already expired while page was closed, cleanup
            localStorage.removeItem(`pending-deletion:${tableKeyEffective}`);
          }
        } catch (e) {
          console.error("Failed to resume persistent deletion", e);
        }
      }
    }
  }, [rows, tableKeyEffective, performActualDeletion]);

  const prefs = useColumnPrefs(
    tableKeyEffective,
    columns.map(c => c.key),
    columns.filter(c => c.defaultHidden).map(c => c.key),
  );

  // Chế độ cột: "gọn" (mặc định, theo tuỳ chỉnh người dùng) hoặc "tất cả cột"
  // (bỏ qua ẩn/hiện để đối soát & chuẩn bị xuất CSV). Ghi nhớ theo bảng.
  const colModeKey = `mirats:colmode:${tableKeyEffective}`;
  const [colMode, setColMode] = useState<"compact" | "all">("compact");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(colModeKey);
      setColMode(saved === "all" ? "all" : "compact");
    } catch {
      setColMode("compact");
    }
  }, [colModeKey]);
  const changeColMode = useCallback(
    (mode: "compact" | "all") => {
      setColMode(mode);
      try {
        window.localStorage.setItem(colModeKey, mode);
      } catch {
        /* bỏ qua khi localStorage bị chặn */
      }
    },
    [colModeKey],
  );

  const scrollOffsetKey = `scroll-offset:${tableKeyEffective}`;

  const getRowIdInternal = useCallback(
    (r: T) => {
      if (getRowId) return getRowId(r);
      const anyR = r as any;
      const id = anyR.id || anyR.uuid || anyR.ma;
      if (!id) {
        console.warn("StandardTable: Row missing unique ID", r);
        return `row-${Math.random().toString(36).substr(2, 9)}`;
      }
      return String(id);
    },
    [getRowId],
  );


  const toggleAll = useCallback(() => {
    const current = selected || new Set<string>();
    if (current.size === rows.length && rows.length > 0) {
      onSelect?.(new Set());
      setSelected?.(new Set());
    } else {
      const next = new Set(rows.map(getRowIdInternal));
      onSelect?.(next);
      setSelected?.(next);
    }
  }, [onSelect, selected, rows, getRowIdInternal, setSelected]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    onSelect?.(new Set());
    setSelected?.(new Set());
  }, [onSelect, setSelected]);

  const clearAllFilters = useCallback(() => {
    setTextFilters({});
    setCatFilters({});
    setGlobalQuery("");
  }, []);

  const toggleCat = useCallback((key: string, val: string) => {
    setCatFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[key] || []);
      if (set.has(val)) set.delete(val);
      else set.add(val);
      if (set.size === 0) delete next[key];
      else next[key] = set;
      return next;
    });
  }, []);

  const selectOnlyCat = useCallback((key: string, val: string) => {
    setCatFilters((prev) => ({ ...prev, [key]: new Set([val]) }));
  }, []);

  const setTextFilter = useCallback((key: string, val: string) => {
    setTextFilters((prev) => {
      const next = { ...prev };
      if (!val) delete next[key];
      else next[key] = val;
      return next;
    });
  }, []);

  const clearColumnFilter = useCallback((key: string) => {
    setTextFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCatFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearCat = useCallback((key: string) => {
    setCatFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);


  const renderToolbar = (
    toolbar: React.ReactNode | ((ctx: {
      filteredRows: T[];
      visibleColumns: ColumnDef<T>[];
      allColumns: ColumnDef<T>[];
      pageRows: T[];
      selectedRows: T[];
      clear: () => void;
    }) => React.ReactNode),
    ctx: {
      filteredRows: T[];
      visibleColumns: ColumnDef<T>[];
      allColumns: ColumnDef<T>[];
      pageRows: T[];
      selectedRows: T[];
      clear: () => void;
    },
  ) => {
    if (typeof toolbar === "function") {
      return toolbar(ctx);
    }
    return toolbar;
  };

  const selectedRows = useMemo(() => {
    if (!selected) return [];
    return rows.filter((r) => selected.has(getRowIdInternal(r)));
  }, [rows, selected, getRowIdInternal]);

  const colText = useCallback((col: ColumnDef<T>, row: T): string => {
    const v = columnRawValue(col, row);
    return v == null ? "" : String(v);
  }, []);


  const globalNeedle = useMemo(() => normalize(globalQuery).trim(), [globalQuery]);

  const matchesGlobal = useCallback(
    (r: T) => {
      if (!globalNeedle) return true;
      for (const c of columns) {
        const text = colText(c, r);
        if (text && normalize(text).includes(globalNeedle)) return true;
      }
      return false;
    },
    [columns, colText, globalNeedle],
  );

  const dedupedRows = useMemo(() => {
    const seen = new Set<string>();
    return localRows.filter((r) => {
      const id = getRowIdInternal(r);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [localRows, getRowIdInternal]);

  /**
   * Kiểu lọc hiệu lực của từng cột. Nếu cột không khai báo `filter`, hệ thống
   * tự suy luận: ít giá trị khác nhau → droplist ("cat"), ngược lại → ô tìm kiếm.
   */
  const filterKinds = useMemo(() => {
    const sample = dedupedRows.slice(0, 500);
    const out: Record<string, "text" | "cat"> = {};
    for (const c of columns) {
      if (c.filter) {
        out[c.key] = c.filter;
        continue;
      }
      if (c.type === "actions") continue;
      const distinct = new Set<string>();
      for (const r of sample) {
        distinct.add(colText(c, r));
        if (distinct.size > 25) break;
      }
      // Cột thuần JSX (không có giá trị gốc) thì không sinh bộ lọc.
      if (distinct.size === 0 || (distinct.size === 1 && distinct.has(""))) continue;
      out[c.key] = distinct.size > 25 ? "text" : "cat";

    }
    return out;
  }, [columns, dedupedRows, colText]);

  const matchesFilters = useCallback(
    (r: T, exceptKey?: string) => {
      if (!matchesGlobal(r)) return false;
      for (const c of columns) {
        if (c.key === exceptKey) continue;
        const kind = filterKinds[c.key];
        if (kind === "cat") {
          const sel = catFilters[c.key];
          const text = colText(c, r);
          if (sel && sel.size > 0 && !sel.has(text)) return false;
        } else if (kind === "text") {
          const val = textFilters[c.key];
          if (val) {
            const t = normalize(val).trim();
            const text = colText(c, r);
            if (t && !normalize(text).includes(t)) return false;
          }
        }
      }
      return true;
    },
    [columns, catFilters, textFilters, colText, matchesGlobal, filterKinds],
  );

  const filtered = useMemo(() => dedupedRows.filter((r) => matchesFilters(r)), [dedupedRows, matchesFilters]);

  /**
   * Danh sách giá trị duy nhất cho các cột lọc dạng droplist.
   * Tính trên toàn bộ dữ liệu đã tải, loại trừ chính bộ lọc của cột đó
   * để người dùng vẫn thấy được các lựa chọn khác.
   */
  const catOptions = useMemo(() => {
    const out: Record<string, { value: string; count: number }[]> = {};
    for (const c of columns) {
      if (filterKinds[c.key] !== "cat") continue;
      const counter = new Map<string, number>();
      for (const r of dedupedRows) {
        if (!matchesFilters(r, c.key)) continue;
        const v = colText(c, r);
        counter.set(v, (counter.get(v) ?? 0) + 1);
      }
      out[c.key] = Array.from(counter.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, "vi", { numeric: true }));
    }
    return out;
  }, [columns, dedupedRows, matchesFilters, colText, filterKinds]);

  const hasFilter = useMemo(() => {
    if (globalNeedle.length > 0) return true;
    return columns.some((c) =>
      (catFilters[c.key]?.size ?? 0) > 0 ||
      (textFilters[c.key] ?? "").trim().length > 0,
    );
  }, [columns, catFilters, textFilters, globalNeedle]);


  /**
   * Tìm kiếm trên TOÀN BỘ dữ liệu: khi có từ khóa/bộ lọc mà nguồn dữ liệu
   * vẫn còn trang chưa tải, tự động tải tiếp cho đến hết rồi mới lọc.
   */
  const isLoadingAllForSearch = Boolean(
    hasFilter && infiniteScroll?.hasNextPage && !trangThai.loi,
  );
  useEffect(() => {
    if (!hasFilter) return;
    if (!infiniteScroll?.hasNextPage) return;
    if (infiniteScroll.isFetchingNextPage || trangThai.dangTai || trangThai.loi) return;
    infiniteScroll.fetchNextPage();
  }, [hasFilter, infiniteScroll, trangThai.dangTai, trangThai.loi, localRows.length]);


  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const get = (r: T) => {
      const v = col.sortValue ? col.sortValue(r) : columnRawValue(col, r);
      return v == null ? "" : v;
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = get(a),
        vb = get(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "vi", { numeric: true }) * dir;
    });
  }, [filtered, sort, columns]);

  const display = sorted;
  const fullDisplay = display;

  const lastSelectedIndex = useRef<number | null>(null);
  
  const toggleRow = useCallback(
    (id: string, index?: number, event?: any) => {
      const current = selected || new Set<string>();
      const next = new Set(current);

      if (event?.shiftKey && lastSelectedIndex.current !== null && index !== undefined) {
        const start = Math.min(lastSelectedIndex.current, index);
        const end = Math.max(lastSelectedIndex.current, index);
        const rangeIds = display.slice(start, end + 1).map(getRowIdInternal);
        
        const allSelectedInRange = rangeIds.every(rid => current.has(rid));
        if (allSelectedInRange) {
          rangeIds.forEach(rid => next.delete(rid));
        } else {
          rangeIds.forEach(rid => next.add(rid));
        }
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }

      if (index !== undefined) {
        lastSelectedIndex.current = index;
      }
      
      onSelect?.(next);
      setSelected?.(next);
    },
    [onSelect, selected, setSelected, display, getRowIdInternal],
  );

  const bulkDelete = useCallback(async () => {
    if ((!selected || selected.size === 0) && !pendingDeletion) return;
    if (!onBulkDelete) return;
    
    const idsToDelete = selected ? new Set(selected) : new Set<string>();
    const expiry = Date.now() + 10000;
    
    setPendingDeletion({ 
      ids: idsToDelete, 
      ten: ten || tableKeyEffective, 
      expiry,
      domain 
    });
    
    if (tableKeyEffective) {
      localStorage.setItem(`pending-deletion:${tableKeyEffective}`, JSON.stringify({
        ids: Array.from(idsToDelete),
        ten: ten || tableKeyEffective,
        expiry,
        domain
      }));
    }
    
    clearSelection();

    toast.info(`Sẽ xóa ${idsToDelete.size} ${countUnit || "dòng"} trong 10 giây...`, {
      action: {
        label: "Hoàn tác",
        onClick: () => {
          if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
          setPendingDeletion(null);
          if (tableKeyEffective) {
            localStorage.removeItem(`pending-deletion:${tableKeyEffective}`);
          }
          toast.success("Đã hoàn tác lệnh xóa.");
        },
      },
      duration: 10000,
    });

    deleteTimerRef.current = setTimeout(() => {
      performActualDeletion(idsToDelete, domain);
    }, 10000);
  }, [selected, pendingDeletion, onBulkDelete, ten, tableKeyEffective, domain, countUnit, clearSelection, performActualDeletion]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: display.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => (density === "compact" ? 36 : 44),
    overscan: adaptiveOverscan > 0 ? adaptiveOverscan : 8, // Ensure a stable fallback for overscan
    getItemKey: (index) => {
      const row = display[index];
      return row ? getRowIdInternal(row) : `row-${index}`;
    },
    initialOffset: (() => {
      if (typeof window === "undefined") return 0;
      const cached = sessionStorage.getItem(scrollOffsetKey);
      return cached ? parseInt(cached, 10) : 0;
    })(),
    paddingStart: 0,
    paddingEnd: 0,
    // Khi vùng cuộn chưa đo được chiều cao (tab ẩn, môi trường test, lần render
    // đầu trước khi layout ổn định) thì rect = 0 khiến virtualizer không render
    // dòng nào → bảng trông như rỗng. Dùng kích thước dự phòng an toàn.
    initialRect: { width: 1024, height: 800 },
    observeElementRect: (instance, cb) => {
      const el = instance.scrollElement as HTMLElement | null;
      if (!el) return;
      const report = () => {
        const r = el.getBoundingClientRect();
        cb({
          width: r.width || el.clientWidth || 1024,
          height: r.height || el.clientHeight || 800,
        });
      };
      report();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(report);
      ro.observe(el);
      return () => ro.disconnect();
    },

    onChange: (instance) => {
      const offset = instance.scrollOffset;
      if (offset && offset > 0) {
        sessionStorage.setItem(scrollOffsetKey, String(offset));
      }
    }
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !infiniteScroll?.hasNextPage || infiniteScroll?.isFetchingNextPage || trangThai.dangTai) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Trigger when 100px from bottom
      if (scrollHeight - scrollTop - clientHeight < 250) {
        infiniteScroll.fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial check in case content is small
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [infiniteScroll, trangThai.dangTai]);

  useEffect(() => {
    // Virtualization backup trigger
    if (!infiniteScroll?.hasNextPage || infiniteScroll?.isFetchingNextPage || trangThai.dangTai) return;
    
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;
    
    const lastItem = virtualItems[virtualItems.length - 1];
    
    // Tải tự động khi người dùng cuộn đến gần cuối (còn khoảng 15 dòng)
    const threshold = 15;
    if (lastItem.index >= display.length - threshold) { 
      infiniteScroll.fetchNextPage();
      
      if (display.length > 5000) {
        console.warn(`[StandardTable] Excessive rows detected: ${display.length}. Potential fetch loop.`);
      }
    }
  }, [rowVirtualizer.getVirtualItems(), infiniteScroll, trangThai.dangTai, display.length]);

  const isClient = typeof window !== "undefined";
  const useIsomorphicLayoutEffect = isClient ? React.useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [display.length, rowVirtualizer, density, expandedRows]);

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();

  // Systematic Rail: Sync horizontal scroll to a fixed rail if needed.
  // We use the native scrollbar of the container, but style it via .mirats-table-scroll-container

  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  const isDragging = useRef<string | null>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const onHandleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.pageX - startX.current;
      const nextW = Math.max(60, startW.current + delta);
      prefs.setWidth(isDragging.current, nextW);
    },
    [prefs],
  );

  const onHandleMouseUp = useCallback(() => {
    isDragging.current = null;
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", onHandleMouseMove);
    document.removeEventListener("mouseup", onHandleMouseUp);
    rowVirtualizer.measure();
  }, [rowVirtualizer, onHandleMouseMove]);

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent, key: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = key;
      startX.current = e.pageX;
      startW.current = currentWidth;
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onHandleMouseMove);
      document.addEventListener("mouseup", onHandleMouseUp);
    },
    [onHandleMouseMove, onHandleMouseUp],
  );

  const renderGlobalState = useCallback(() => {
    if (trangThai.loi) {
      const err = trangThai.loi;
      if (errorContent) return errorContent;
      
      const errorMessage = thongDiepLoi(err, "Không tải được dữ liệu");
      
      const hasRetry = (e: unknown): e is { retry: () => void } => 
        !!e && typeof e === "object" && "retry" in e && typeof (e as any).retry === "function";

      return (
        <EmptyState
          title="Đã xảy ra lỗi"
          description={errorMessage}
          icon={XCircle}
          live="polite"
          action={
            hasRetry(err) ? (
              <Button variant="outline" size="sm" onClick={err.retry}>
                Thử lại
              </Button>
            ) : undefined
          }
        />
      );
    }

    if (trangThai.dangTai && fullDisplay.length === 0) {
      return loadingContent || <TableSkeleton rows={8} cols={columns.length} />;
    }

    if (!trangThai.dangTai && fullDisplay.length === 0) {
      return emptyContent || (
        <EmptyState 
          title={hasFilter ? "Không tìm thấy kết quả" : (emptyText || "Không có dữ liệu")} 
          description={
            hasFilter 
              ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc." 
              : selected?.size === 0 && rows.length > 0 
                ? `Chọn ${countUnit || "dòng"} để thực hiện hành động.` 
                : undefined
          }
          live="polite"
          action={hasFilter ? (
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-8">
              Xóa tất cả bộ lọc
            </Button>
          ) : undefined}
        />
      );
    }

    return null;
  }, [trangThai, fullDisplay.length, errorContent, emptyContent, loadingContent, emptyText, columns.length, hasFilter, clearAllFilters, countUnit]);

  const isMobile = isClient && window.innerWidth < BP_PX.md;
  const shownCols = useMemo(
    () => (colMode === "all" ? columns : columns.filter(c => !prefs.hidden.has(c.key))),
    [columns, prefs.hidden, colMode],
  );
  const exportCols = columns;

  function renderAutoCell(c: ColumnDef<T>, r: T) {
    const val = columnRawValue(c, r);
    if (val === undefined || val === null) return KHONG_CO;
    switch (c.type) {
      case "id": return <CodeBadge code={String(val)} title={String(val)} />;
      case "status": return <StatusBadge domain="thiet_bi" code={String(val)} />;
      case "taxonomy":
        if (typeof val === "object" && val !== null) {
          const v = val as any;
          return <MauChip ten={v.ten} mau={v.mau} />;
        }
        return <MauChip ten={String(val)} />;
      case "user":
        if (typeof val === "object" && val !== null) {
          const v = val as any;
          return (
            <div className="flex items-center gap-2">
              <UserAvatar name={v.ho_ten || v.ten} email={v.email} url={v.avatar_url || v.url} className="h-6 w-6" />
              <span className="truncate text-xs">{v.ho_ten || v.ten || "—"}</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <UserAvatar name={String(val)} className="h-6 w-6" />
            <span className="truncate text-xs">{String(val)}</span>
          </div>
        );
      case "number": return <span className="tabular-nums font-mono text-right w-full inline-block pr-1 truncate">{fmtSo(Number(val))}</span>;
      case "currency": return <span className="tabular-nums font-mono text-right w-full inline-block pr-1 truncate">{fmtVND(Number(val))}</span>;
      default:
        // Giá trị dạng object/array không có accessor riêng → không ép chuỗi thô.
        if (typeof val === "object") return KHONG_CO;
        return String(val);

    }
  }

  function renderCellContent(c: ColumnDef<T>, r: T) {
    if (c.render) return c.render(r);
    if (c.cell) return c.cell(r);
    return renderAutoCell(c, r);
  }

  const sortedColumns = shownCols;

  return (
    <div className={cn("flex flex-col gap-3 min-h-0 h-full w-full overflow-hidden", className)}>
      {(
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 shrink-0">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            {toolbarLeft}
            {/* Ô tìm kiếm toàn bộ dữ liệu (không chỉ các dòng đang hiển thị) */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder={`Tìm trong toàn bộ ${countUnit || "dữ liệu"}…`}
                aria-label="Tìm kiếm toàn bộ dữ liệu trong bảng"
                className="h-8 pl-7 pr-7 text-xs"
              />
              {globalQuery && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa tìm kiếm"
                  onClick={() => setGlobalQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isLoadingAllForSearch && (
              <span className="flex items-center gap-1 whitespace-nowrap text-meta text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải toàn bộ dữ liệu…
                {infiniteScroll?.totalCount
                  ? ` (${dedupedRows.length}/${infiniteScroll.totalCount})`
                  : ""}
              </span>
            )}
            {hasFilter && !isLoadingAllForSearch && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-2 text-meta"
                onClick={clearAllFilters}
              >
                <XIcon className="mr-1 h-3 w-3" />
                Xóa lọc ({fullDisplay.length})
              </Button>
            )}
            {toolbar && renderToolbar(toolbar, {
              filteredRows: fullDisplay,
              visibleColumns: shownCols,
              allColumns: exportCols,
              pageRows: display,
              selectedRows,
              clear: clearSelection,
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Chế độ cột: Gọn (mặc định) ↔ Tất cả cột */}
            <div
              role="group"
              aria-label="Chế độ hiển thị cột"
              className="flex h-8 items-center rounded-md border border-border/60 bg-muted/30 p-0.5"
            >
              {(["compact", "all"] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={colMode === mode}
                  onClick={() => changeColMode(mode)}
                  className={cn(
                    "h-7 rounded-[5px] px-2 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    colMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode === "compact" ? "Gọn" : "Tất cả cột"}
                </button>
              ))}
            </div>

            {colMode === "compact" && (
              <ColumnVisibilityMenu
                columns={columns}
                hidden={prefs.hidden}
                toggle={prefs.toggle}
                reset={prefs.reset}
              />
            )}

            {exportable && (
              <TableExportDialog<T>
                ten={ten || tableKeyEffective}
                countUnit={countUnit || "dòng"}
                visibleColumns={shownCols}
                allColumns={exportCols}
                rowsByScope={{ selected: selectedRows, filtered: fullDisplay, page: display }}
                tableKey={tableKeyEffective}
                domain={domain}
                trigger={
                  <AppTooltip noiDung="Xuất dữ liệu ra file CSV">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </AppTooltip>
                }
              />
            )}

            {allowBulkDelete && onBulkDelete && (selectedRows.length > 0 || pendingDeletion) && (
              <BulkActionButton
                label="Xóa hàng loạt"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                variant="destructive"
                busy={isDeleting}
                xacNhan={{
                  tieuDe: `Xóa ${selectedRows.length} ${countUnit || "dòng"} đã chọn?`,
                  moTa: `Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa ${selectedRows.length} ${countUnit || "dòng"} này không?`,
                  nutXacNhan: "Xác nhận xóa",
                  nguyHiem: true,
                }}
                onRun={bulkDelete}
              />
            )}

            {bulkActions && renderToolbar(bulkActions, {
              filteredRows: fullDisplay,
              visibleColumns: shownCols,
              allColumns: exportCols,
              pageRows: display,
              selectedRows,
              clear: clearSelection,
            })}
            {toolbarRight && renderToolbar(toolbarRight, {
              filteredRows: fullDisplay,
              visibleColumns: shownCols,
              allColumns: exportCols,
              pageRows: display,
              selectedRows,
              clear: clearSelection,
            })}
          </div>
        </div>
      )}

      {isMobile ? (
        <div className="space-y-3">
          {fullDisplay.length === 0 ? (
            renderGlobalState()
          ) : (
            display.map((r, idx) => {
              const rid = getRowIdInternal(r);
              return (
                <MobileRecordCard
                  key={`mobile-row-${rid}-${idx}`}
                  row={r}
                  rowIndex={idx}
                  rowId={rid}
                  columns={sortedColumns}
                  selectable={selectable}
                  isSelected={selectable && selected?.has(rid)}
                  isExpanded={expandedRows.has(rid)}
                  onSelect={toggleRow}
                  onExpand={toggleExpand}
                  onRowClick={onRowClick}
                  rowClassName={rowClassName}
                  renderCellContent={renderCellContent}
                  toolbarRight={toolbarRight}
                />
              );
            })
          )}
        </div>
      ) : (
        // MỘT chủ sở hữu cuộn duy nhất cho CẢ HAI trục.
        // Trước đây tách 2 tầng (ngoài: dọc, trong: ngang) khiến:
        //  - overflow-y:visible ở tầng trong bị CSS ép thành auto → sticky header
        //    neo vào tầng trong (không bao giờ cuộn dọc) nên header mất dính;
        //  - thanh cuộn ngang nằm ở đáy nội dung (ngoài tầm nhìn) với bảng dài;
        //  - HorizontalScrollRail điều khiển scrollLeft của phần tử có
        //    overflow-x:hidden nên vô hiệu.
        // `transform`/`contain` cũng bị gỡ vì tạo containing block phá sticky.
        <div
          className={cn(
            "relative min-h-0 border rounded-md shadow-none bg-background astryx-table-container flex flex-col flex-1 overflow-auto overscroll-contain mirats-scroll mirats-table-scroll-container",
            // Cửa thoát cho các panel cần ràng buộc chiều cao riêng (tab/dialog).
            maxHeightClass,
          )}
          ref={scrollContainerRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Table 
            className="border-collapse border-separate border-spacing-0 w-full mirats-standard-table-element"
            style={{
              tableLayout: 'fixed',
              width: 'max-content',
              minWidth: '100%'
            }}
          >
            <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-b">
                {selectable && (
                  <TableHead className="w-[40px] px-2 text-center sticky left-0 z-30 bg-muted/80">
                    <Checkbox
                      checked={rows.length > 0 && (selected?.size ?? 0) === rows.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                )}
                {shownCols.map(c => (
                  <TableHead 
                    key={c.key} 
                    style={{ 
                      width: prefs.widths[c.key] || 150,
                      position: c.sticky ? 'sticky' : 'relative',
                      left: c.sticky ? (selectable ? 40 : 0) : undefined,
                      zIndex: c.sticky ? 30 : 20,
                      background: 'inherit'
                    }} 
                    className={cn(
                      "px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground",
                      c.sticky && "border-r border-border/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                      <button
                        type="button"
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-1 text-left uppercase tracking-wider",
                          "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "hover:text-foreground",
                        )}
                        onClick={() =>
                          setSort((prev) =>
                            prev?.key !== c.key
                              ? { key: c.key, dir: "asc" }
                              : prev.dir === "asc"
                                ? { key: c.key, dir: "desc" }
                                : null,
                          )
                        }
                        aria-label={`Sắp xếp theo ${c.header || c.label || c.key}`}
                      >
                        <span className="truncate">{c.header || c.label}</span>
                        {sort?.key === c.key && (
                          <span aria-hidden className="shrink-0 text-primary">
                            {sort.dir === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </button>
                      {filterKinds[c.key] && (
                        <ColumnFilterMenu
                          label={c.header || c.label || c.key}
                          kind={filterKinds[c.key]}
                          textValue={textFilters[c.key] ?? ""}
                          onTextChange={(v) => setTextFilter(c.key, v)}
                          options={catOptions[c.key]}
                          selected={catFilters[c.key]}
                          onToggleValue={(v) => toggleCat(c.key, v)}
                          onSelectOnly={(v) => selectOnlyCat(c.key, v)}
                          onClear={() => clearColumnFilter(c.key)}
                          sortDir={sort?.key === c.key ? sort.dir : null}
                          onSort={(dir) => setSort(dir ? { key: c.key, dir } : null)}
                        />
                      )}
                    </div>

                    <div
                      onMouseDown={(e) => onHandleMouseDown(e, c.key, prefs.widths[c.key] || 150)}
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 z-10"
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fullDisplay.length === 0 ? (
                <TableRow>
                  <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0">
                    {renderGlobalState()}
                  </OptimizedCell>
                </TableRow>
              ) : (
                <Fragment>
                  {paddingTop > 0 && (
                    <TableRow style={{ height: `${paddingTop}px` }} className="hover:bg-transparent border-0">
                      <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0" />
                    </TableRow>
                  )}
                  {virtualRows.map(v => {
                    const r = display[v.index];
                    const rid = getRowIdInternal(r);
                    return (
                      <TableRow 
                        key={rid} 
                        data-key={rid}
                        className={cn("group transition-colors border-b astryx-table-row outline-none", rowClassName?.(r))} 
                        onClick={(e) => {
                          if (selectable && (e.shiftKey || e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleRow(rid, v.index, e);
                          } else {
                            onRowClick?.(r);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            if (selectable) {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleRow(rid, v.index, e);
                            } else if (e.key === "Enter") {
                              onRowClick?.(r);
                            }
                          }
                        }}
                        tabIndex={0}
                        // Không đặt transform/contain lên <tr>: nó tạo
                        // containing block khiến ô cột "sticky left" mất dính
                        // khi cuộn ngang. Hiệu năng đã do virtualization lo.

                      >
                        {selectable && (
                          <OptimizedCell
                            colKey="selection"
                            className="px-2 text-center w-[40px] sticky left-0 z-10 bg-inherit"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selected?.has(rid) || false}
                              onCheckedChange={(checked) => {
                                // Standard checkboxes don't pass the MouseEvent to onCheckedChange
                                // But since we fixed toggleRow to handle undefined event, it works.
                                toggleRow(rid, v.index);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  toggleRow(rid, v.index, e);
                                }
                              }}
                            />
                          </OptimizedCell>
                        )}
                        {shownCols.map(c => (
                          <OptimizedCell 
                            key={c.key} 
                            colKey={c.key}
                            className={cn("px-3 text-note truncate astryx-table-cell", c.cellClassName)} 
                            style={{ 
                              height: density === "compact" ? 36 : 44,
                              position: c.sticky ? 'sticky' : 'relative',
                              left: c.sticky ? (selectable ? 40 : 0) : undefined,
                              zIndex: c.sticky ? 10 : 1,
                              background: 'inherit'
                            }}
                          >
                            {renderCellContent(c, r)}
                          </OptimizedCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <TableRow style={{ height: `${paddingBottom}px` }} className="hover:bg-transparent border-0">
                      <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0" />
                    </TableRow>
                  )}
                </Fragment>
              )}
            </TableBody>
          </Table>
          
          {infiniteScroll?.isFetchingNextPage && (
            <div className="flex items-center justify-center py-6 gap-3 text-muted-foreground bg-background/50 border-t backdrop-blur-sm sticky bottom-0 z-20">
              <div className="relative h-5 w-5">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse" />
              </div>
              <span className="text-meta font-bold uppercase tracking-[0.2em] text-primary/80">Đang tải thêm...</span>
            </div>
          )}
          
          {/* Nút Tải thêm dữ liệu đã được gỡ bỏ để chuyển sang tải tự động hoàn toàn khi cuộn */}
          
          {/* Thanh cuộn ngang tự chế đã gỡ: vùng bảng nay là scroller duy nhất,
              thanh cuộn ngang gốc của trình duyệt luôn ghim ở đáy khung nhìn
              bảng và được tạo kiểu qua .mirats-table-scroll-container. */}
        </div>
      )}
    </div>
  );
}
