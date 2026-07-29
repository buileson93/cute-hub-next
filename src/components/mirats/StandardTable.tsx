// ============================================================================
// StandardTable — bảng dữ liệu chuẩn dùng chung cho toàn hệ thống.
//
// Lấy TableView của "Hệ Thống" làm chuẩn giao diện:
//   • Khung Card, header dính (sticky) khi cuộn.
//   • Bộ lọc ngay trên tiêu đề từng cột (danh mục nhiều lựa chọn hoặc tìm chữ).
//   • Nút "Cột hiển thị" để bật/tắt cột.
//   • KÉO-THẢ tiêu đề cột để đổi thứ tự — CHỈ khi bật chế độ chỉnh sửa (editMode).
//   • Thứ tự & cột ẩn được lưu theo TÀI KHOẢN (đồng bộ mọi tài sản) qua
//     useColumnPrefs.
//
// Dùng generic <T> nên mọi trang chỉ cần khai cột (key/label/value/cell).
// ============================================================================

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Filter, SlidersHorizontal, GripVertical, ArrowLeftRight, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TableExportDialog } from "@/components/mirats/TableExportDialog";
import { normalize } from "@/lib/mirats/global-search";

import { useColumnPrefs } from "@/lib/mirats/use-column-prefs";
import { useColumnWidths } from "@/lib/mirats/use-column-widths";
import { tongSoTrang } from "@/lib/mirats/ui/list-controls";
import type { UseListControlsReturn } from "@/lib/mirats/ui/use-list-controls";
import { cn } from "@/lib/utils";


export type StdColumn<T> = {
  key: string;
  label: string;
  group?: string;
  minW?: string;
  align?: "left" | "right" | "center";
  filter?: "cat" | "text";
  value?: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
  defaultHidden?: boolean;
  /** Tự ẩn khi viewport nhỏ hơn breakpoint (sm=640, md=768, lg=1024, xl=1280, 2xl=1536). */
  hideBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Đánh dấu cột có giá trị KẾ THỪA (từ hệ thống/thành phần/tài sản) — tô nền vàng nhạt để nhận diện. */
  inherited?: boolean;
  cellClassName?: string;
  sticky?: boolean;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  exportHeader?: string;
  exportValue?: (row: T) => string | number | null | undefined;
};

const BP_PX = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;

function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/** Ngữ cảnh xuất: các dòng ĐANG hiển thị (đã lọc/sắp xếp) & các cột ĐANG bật (đúng thứ tự). */
export type ExportContext<T> = {
  visibleRows: T[];
  visibleColumns: StdColumn<T>[];
};

export type BulkContext<T> = {
  /** Các dòng đang được tích chọn (GIỮ nguyên khi chuyển trang / đổi lọc). */
  selectedRows: T[];
  /** Id các dòng đang chọn. */
  selectedIds: string[];
  /** Các cột ĐANG bật (đúng thứ tự) — để xuất đúng cài đặt cột. */
  visibleColumns: StdColumn<T>[];
  /** Toàn bộ cột khai báo (kể cả cột đang ẩn) — cho hộp thoại xuất. */
  allColumns: StdColumn<T>[];
  /** Toàn bộ dòng sau khi lọc/sắp xếp (mọi trang). */
  filteredRows: T[];
  /** Các dòng của trang đang xem. */
  pageRows: T[];
  /** Bỏ chọn tất cả. */
  clear: () => void;
  /** Chọn toàn bộ dòng sau lọc (mọi trang). */
  selectAllFiltered: () => void;
};


type Props<T> = {
  tableKey: string;
  columns: StdColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Bật sẵn kéo-thả đổi thứ tự cột (ngoài nút bật/tắt trong thanh công cụ). */
  editMode?: boolean;
  /** Ẩn nút bật kéo-thả nội bộ (khi trang tự quản lý editMode). */
  hideReorderToggle?: boolean;
  toolbarLeft?: ReactNode;
  /** Nội dung góc phải thanh công cụ. Hàm nhận ngữ cảnh xuất (dòng đang lọc + cột đang bật). */
  toolbarRight?: ReactNode | ((ctx: ExportContext<T>) => ReactNode);
  onRowClick?: (row: T) => void;
  emptyText?: string;
  maxHeightClass?: string;
  rowClassName?: (row: T) => string;
  countUnit?: string;
  /** Bảng để trống cho tới khi chọn/lọc (mặc định bật). */
  requireFilterToShow?: boolean;
  /** Bật cột tích chọn dòng để thao tác hàng loạt (bulk). */
  selectable?: boolean;
  /** Thanh hành động hàng loạt hiện ra khi có dòng được chọn. */
  bulkActions?: (ctx: BulkContext<T>) => ReactNode;
  /** Tên gợi ý cho file CSV khi xuất (mặc định lấy theo tableKey). */
  exportName?: string;
  /** Ẩn nút "Xuất CSV" mặc định trên thanh công cụ. */
  hideExport?: boolean;

  /** Cờ trạng thái ngoài (loading / lỗi) — dùng khi nguồn dữ liệu bất đồng bộ. */
  trangThai?: { dangTai?: boolean; loi?: string | null };
  /** Slot tuỳ chỉnh khi rỗng (thay `emptyText`). */
  emptyContent?: ReactNode;
  /** Slot tuỳ chỉnh khi đang tải (mặc định = skeleton). */
  loadingContent?: ReactNode;
  /** Slot tuỳ chỉnh khi có lỗi (mặc định = dòng chữ đỏ). */
  errorContent?: ReactNode;
  /** Bật thanh phân trang ngoài (Trước/Sau) dựa vào useListControls + tổng. */
  pagination?: { controls: UseListControlsReturn; tong: number };
  /** Phân trang phía client SAU khi đã lọc/sắp xếp. Callback trả tổng số dòng sau lọc để cha cập nhật UI phân trang. */
  clientPagination?: {
    page: number;
    pageSize: number;
    onFilteredTotalChange?: (n: number) => void;
  };
};


function colText<T>(col: StdColumn<T>, row: T): string {
  const v = col.value ? col.value(row) : "";
  return v == null ? "" : String(v);
}

export function StandardTable<T>({
  tableKey, columns, rows, getRowId, editMode = false, hideReorderToggle = false,
  toolbarLeft, toolbarRight, onRowClick, emptyText = "Không có dữ liệu phù hợp.",
  maxHeightClass = "h-[calc(100vh-16rem)] min-h-[320px]", rowClassName, countUnit = "dòng",
  requireFilterToShow = true, selectable = false, bulkActions, exportName, hideExport = false,
  trangThai, emptyContent, loadingContent, errorContent, pagination, clientPagination,
}: Props<T>) {

  const [internalEdit, setInternalEdit] = useState(false);
  const reorder = editMode || internalEdit;
  const allKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const vw = useViewportWidth();
  // Mặc định ẩn: cột `defaultHidden`, cột "mã ...", HOẶC cột có `hideBelow` mà
  // viewport hiện tại nhỏ hơn breakpoint. `hideBelow` chỉ ảnh hưởng lần khởi tạo —
  // nếu user đã bật hiện trong menu "Cột hiển thị" thì phải tôn trọng lựa chọn đó.
  const defaultHidden = useMemo(
    () =>
      columns
        .filter(
          (c) =>
            c.defaultHidden ||
            /^mã\b/i.test((c.label ?? "").trim()) ||
            (c.hideBelow && vw > 0 && vw < BP_PX[c.hideBelow]),
        )
        .map((c) => c.key),
    // Không phụ thuộc vw để tránh ép ẩn lại khi resize sau khi user đã bật.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  );
  const colMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const { order, hidden, setOrder, toggle, setHidden, reset, isHidden } =
    useColumnPrefs(tableKey, allKeys, defaultHidden);

  // Độ rộng cột tuỳ chỉnh (kéo mép phải tiêu đề cột để đổi).
  const { widths: colWidths, setWidth: setColWidth, resetWidth: resetColWidth, resetAll: resetAllWidths, MIN_W: MIN_COL_W } =
    useColumnWidths(tableKey);
  const resizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const onResizeStart = useCallback((key: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget.parentElement as HTMLElement | null);
    const startW = colWidths[key] ?? th?.getBoundingClientRect().width ?? 120;
    resizeRef.current = { key, startX: e.clientX, startW };
    setResizingKey(key);
    const onMove = (ev: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      setColWidth(r.key, r.startW + (ev.clientX - r.startX));
    };
    const onUp = () => {
      resizeRef.current = null;
      setResizingKey(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [colWidths, setColWidth]);

  // Cột hiển thị theo đúng thứ tự đã lưu. `hideBelow` KHÔNG ép ẩn khi user đã chọn hiện.
  const shownCols = useMemo(
    () => order.map((k) => colMap.get(k)).filter((c): c is StdColumn<T> => {
      if (!c) return false;
      if (isHidden(c.key)) return false;
      return true;
    }),
    [order, colMap, isHidden],
  );

  // Bộ lọc.
  const [catFilters, setCatFilters] = useState<Record<string, Set<string>>>({});
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});

  // Kiểm tra một dòng có khớp toàn bộ bộ lọc (có thể loại trừ một cột) hay không.
  // Dùng cho cả `filtered` (không loại trừ) và `catValues` (loại trừ chính cột đang
  // dựng danh sách giá trị) — nhờ vậy bộ lọc sau kế thừa kết quả của bộ lọc trước:
  // dropdown chỉ hiện những giá trị còn xuất hiện trong tập đã lọc.
  const matchesFilters = useCallback(
    (r: T, exceptKey?: string) => {
      for (const c of columns) {
        if (c.key === exceptKey) continue;
        if (c.filter === "cat") {
          const sel = catFilters[c.key];
          if (sel && sel.size > 0 && !sel.has(colText(c, r))) return false;
        } else if (c.filter === "text") {
          const t = normalize(textFilters[c.key] ?? "").trim();
          if (t && !normalize(colText(c, r)).includes(t)) return false;
        }
      }
      return true;
    },
    [columns, catFilters, textFilters],
  );

  const catValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of columns.filter((c) => c.filter === "cat")) {
      const s = new Set<string>();
      for (const r of rows) {
        if (!matchesFilters(r, c.key)) continue;
        s.add(colText(c, r));
      }
      map[c.key] = Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
    }
    return map;
  }, [columns, rows, matchesFilters]);

  const filtered = useMemo(
    () => rows.filter((r) => matchesFilters(r)),
    [rows, matchesFilters],
  );

  const hasFilter = columns.some((c) =>
    c.filter === "cat" ? (catFilters[c.key]?.size ?? 0) > 0
      : (textFilters[c.key] ?? "").trim().length > 0);

  // ---- Sắp xếp theo cột (bấm tiêu đề để đổi asc/desc/tắt) ----
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sortableKey = useCallback((c: StdColumn<T>) => c.sortable ?? !!(c.sortValue || c.value), []);
  const cycleSort = useCallback((key: string) => setSort((prev) => {
    if (!prev || prev.key !== key) return { key, dir: "asc" };
    if (prev.dir === "asc") return { key, dir: "desc" };
    return null;
  }), []);
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = colMap.get(sort.key);
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
  }, [filtered, sort, colMap]);

  // Mặc định bảng để TRỐNG — chỉ hiển thị khi đã lọc.
  const gated = requireFilterToShow && !hasFilter;
  const fullDisplay = useMemo(() => (gated ? [] : sorted), [gated, sorted]);

  // Thông báo tổng số dòng SAU khi lọc/sắp xếp cho cha (dùng cho UI phân trang bên ngoài).
  const notifyFilteredTotal = clientPagination?.onFilteredTotalChange;
  useEffect(() => {
    notifyFilteredTotal?.(fullDisplay.length);
  }, [fullDisplay.length, notifyFilteredTotal]);

  // Cắt trang phía client SAU khi đã lọc — nhờ vậy bộ lọc/sắp xếp áp dụng cho TOÀN BỘ dữ liệu,
  // không chỉ trang hiện tại.
  const display = useMemo(() => {
    if (!clientPagination) return fullDisplay;
    const { page, pageSize } = clientPagination;
    if (pageSize >= fullDisplay.length) return fullDisplay;
    const start = Math.max(0, (page - 1) * pageSize);
    return fullDisplay.slice(start, start + pageSize);
  }, [fullDisplay, clientPagination]);

  // ---- Tích chọn dòng (bulk) ----
  // Lựa chọn được GIỮ khi chuyển trang / đổi bộ lọc: chỉ loại bỏ những id không
  // còn tồn tại trong nguồn dữ liệu. Mọi bulk action luôn chạy đúng tập đã tick.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rowById = useMemo(() => {
    const m = new Map<string, T>();
    for (const r of rows) m.set(getRowId(r), r);
    return m;
  }, [rows, getRowId]);
  const displayIds = useMemo(() => display.map((r) => getRowId(r)), [display, getRowId]);
  useEffect(() => {
    if (!selectable) return;
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set([...prev].filter((id) => rowById.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectable, rowById]);
  const selectedRows = useMemo(
    () => (selectable
      ? [...selected].map((id) => rowById.get(id)).filter((r): r is T => r !== undefined)
      : []),
    [selectable, selected, rowById],
  );
  const allSelected = displayIds.length > 0 && displayIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleRow = (id: string) => setSelected((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  // Checkbox đầu bảng: chọn/bỏ chọn các dòng của TRANG hiện tại (không đụng trang khác).
  const toggleAll = () => setSelected((prev) => {
    const n = new Set(prev);
    if (displayIds.every((id) => n.has(id))) displayIds.forEach((id) => n.delete(id));
    else displayIds.forEach((id) => n.add(id));
    return n;
  });
  const selectAllFiltered = useCallback(
    () => setSelected(new Set(fullDisplay.map((r) => getRowId(r)))),
    [fullDisplay, getRowId],
  );
  const clearSel = useCallback(() => setSelected(new Set()), []);
  const soNgoaiTrang = useMemo(
    () => selectedRows.filter((r) => !displayIds.includes(getRowId(r))).length,
    [selectedRows, displayIds, getRowId],
  );


  const toggleCat = (key: string, v: string) => setCatFilters((prev) => {
    const next = new Set(prev[key] ?? []);
    next.has(v) ? next.delete(v) : next.add(v);
    return { ...prev, [key]: next };
  });
  const clearCat = (key: string) => setCatFilters((prev) => ({ ...prev, [key]: new Set() }));

  // Kéo-thả đổi thứ tự cột.
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const onDrop = useCallback((target: string) => {
    if (!dragKey || dragKey === target) { setDragKey(null); setOverKey(null); return; }
    const next = [...order];
    const from = next.indexOf(dragKey);
    const to = next.indexOf(target);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    setOrder(next);
    setDragKey(null);
    setOverKey(null);
  }, [dragKey, order, setOrder]);

  const firstKey = shownCols[0]?.key;
  const alignClass = (a?: string) => a === "right" ? "text-right" : a === "center" ? "text-center" : "";

  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const c of columns) if (c.group && !seen.includes(c.group)) seen.push(c.group);
    return seen;
  }, [columns]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {gated
              ? `Chọn bộ lọc ở tiêu đề cột để hiển thị (${rows.length.toLocaleString("vi-VN")} ${countUnit})`
              : `${filtered.length.toLocaleString("vi-VN")} / ${rows.length.toLocaleString("vi-VN")} ${countUnit}`}
          </span>
          {hasFilter && (
            <button className="text-primary hover:underline"
              onClick={() => { setCatFilters({}); setTextFilters({}); }}>
              Xoá lọc
            </button>
          )}
          {reorder && (
            <span className="hidden items-center gap-1 text-primary/70 sm:inline-flex">
              <GripVertical className="h-3 w-3" /> Kéo tiêu đề cột để đổi thứ tự
            </span>
          )}
          {toolbarLeft}
        </div>
        <div className="flex items-center gap-2">
          {typeof toolbarRight === "function"
            ? toolbarRight({ visibleRows: display, visibleColumns: shownCols })
            : toolbarRight}
          {!hideExport && (
            <TableExportDialog<T>
              ten={exportName ?? tableKey.replace(/[:/]/g, "-")}
              visibleColumns={shownCols}
              allColumns={columns}
              countUnit={countUnit}
              rowsByScope={{ selected: selectedRows, filtered: fullDisplay, page: display }}
            />
          )}

          {!hideReorderToggle && !editMode && (
            <Button
              variant={internalEdit ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setInternalEdit((v) => !v)}
              title="Bật/tắt kéo-thả đổi thứ tự cột"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> {internalEdit ? "Xong sắp xếp" : "Sắp xếp cột"}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Cột hiển thị
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">{shownCols.length}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[70vh] w-56 overflow-auto">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-muted-foreground">Chọn cột hiển thị</span>
                <div className="flex gap-2 text-xs">
                  <button className="text-primary hover:underline"
                    onClick={() => setHidden([])}>Tất cả</button>
                  <button className="text-primary hover:underline"
                    onClick={reset}>Mặc định</button>
                </div>
              </div>
              {groups.length > 0 ? groups.map((g) => (
                <div key={g}>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{g}</DropdownMenuLabel>
                  {columns.filter((c) => c.group === g).map((c) => (
                    <DropdownMenuCheckboxItem key={c.key} checked={!isHidden(c.key)}
                      onCheckedChange={() => toggle(c.key)} onSelect={(e) => e.preventDefault()}>
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              )) : (
                <>
                  <DropdownMenuSeparator />
                  {columns.map((c) => (
                    <DropdownMenuCheckboxItem key={c.key} checked={!isHidden(c.key)}
                      onCheckedChange={() => toggle(c.key)} onSelect={(e) => e.preventDefault()}>
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <Badge className="gap-1">{selected.size}</Badge>
          <span className="text-muted-foreground">
            đã chọn
            {soNgoaiTrang > 0 && ` (${soNgoaiTrang} dòng ở trang khác)`}
          </span>
          {fullDisplay.length > selected.size && (
            <button className="text-xs text-primary hover:underline" onClick={selectAllFiltered}>
              Chọn tất cả {fullDisplay.length.toLocaleString("vi-VN")} {countUnit} sau lọc
            </button>
          )}
          <button className="text-xs text-primary hover:underline" onClick={clearSel}>Bỏ chọn</button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions?.({
              selectedRows, selectedIds: [...selected], visibleColumns: shownCols,
              allColumns: columns, filteredRows: fullDisplay, pageRows: display,
              clear: clearSel, selectAllFiltered,
            })}
          </div>
        </div>
      )}


      <Card className={cn("relative min-h-0 overflow-auto", maxHeightClass)}>
        {trangThai?.dangTai && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden"
            role="status"
            aria-label="Đang tải lại"
          >
            <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] bg-primary/70 motion-reduce:animate-pulse" />
          </div>
        )}
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="[&>th]:bg-card">
              {selectable && (
                <TableHead className="sticky top-0 z-20 w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Chọn tất cả"
                    disabled={displayIds.length === 0}
                  />
                </TableHead>
              )}
              {shownCols.map((c) => {
                const canSort = !reorder && sortableKey(c);
                const sortActive = sort?.key === c.key;
                return (
                <TableHead
                  key={c.key}
                  draggable={reorder}
                  onDragStart={reorder ? () => setDragKey(c.key) : undefined}
                  onDragOver={reorder ? (e) => { e.preventDefault(); setOverKey(c.key); } : undefined}
                  onDrop={reorder ? () => onDrop(c.key) : undefined}
                  onDragEnd={reorder ? () => { setDragKey(null); setOverKey(null); } : undefined}
                  className={cn(
                    "sticky top-0 z-20 border-r border-border/50 last:border-r-0 shadow-[inset_0_-1px_0_hsl(var(--border))]",
                    (c.sticky || c.key === firstKey) && c.sticky && "left-0 z-30",
                    c.minW,
                    alignClass(c.align),
                    sortActive && "bg-primary/5",
                    c.inherited && "bg-amber-500/[0.06] border-l-2 border-l-amber-500/50",
                    reorder && "cursor-grab select-none",
                    reorder && overKey === c.key && dragKey !== c.key && "bg-primary/10",
                    reorder && dragKey === c.key && "opacity-50",
                  )}
                >
                  <div className={cn("flex items-center gap-1", c.align === "right" && "justify-end", c.align === "center" && "justify-center")}>
                    {reorder && <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => cycleSort(c.key)}
                        className="group inline-flex min-w-0 items-center gap-1 rounded hover:text-foreground"
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
                        onToggleCat={(v) => toggleCat(c.key, v)}
                        onClearCat={() => clearCat(c.key)}
                        textVal={textFilters[c.key] ?? ""}
                        onText={(v) => setTextFilters((p) => ({ ...p, [c.key]: v }))}
                      />
                    )}
                  </div>
                </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const totalCols = (shownCols.length || 1) + (selectable ? 1 : 0);
              if (trangThai?.loi) {
                return (
                  <TableRow>
                    <TableCell colSpan={totalCols} className="py-8">
                      {errorContent ?? (
                        <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4 text-center">
                          <div className="text-sm font-medium text-destructive">Không tải được dữ liệu</div>
                          <div className="text-xs text-destructive/80 whitespace-pre-wrap">{trangThai.loi}</div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }
              if (trangThai?.dangTai && display.length === 0) {
                if (loadingContent) {
                  return (
                    <TableRow>
                      <TableCell colSpan={totalCols} className="py-6">{loadingContent}</TableCell>
                    </TableRow>
                  );
                }
                return Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {selectable && (
                      <TableCell className="w-10"><Skeleton className="h-4 w-4" /></TableCell>
                    )}
                    {shownCols.map((c) => (
                      <TableCell key={c.key}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ));
              }
              if (display.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={totalCols} className="h-24 text-center text-sm text-muted-foreground">
                      {gated
                        ? "Bảng đang trống — chọn bộ lọc ở tiêu đề cột để bắt đầu hiển thị dữ liệu."
                        : (emptyContent ?? emptyText)}
                    </TableCell>
                  </TableRow>
                );
              }
              return display.map((r) => {
                const rid = getRowId(r);
                const isSel = selectable && selected.has(rid);
                return (
                  <TableRow
                    key={rid}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    data-state={isSel ? "selected" : undefined}
                    className={cn(onRowClick && "cursor-pointer", "hover:bg-muted/40", isSel && "bg-primary/5", rowClassName?.(r))}
                  >
                    {selectable && (
                      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(rid)}
                          onCheckedChange={() => toggleRow(rid)}
                          aria-label="Chọn dòng"
                        />
                      </TableCell>
                    )}
                    {shownCols.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(
                          "border-r border-border/40 last:border-r-0 align-top",
                          "[&_span]:break-words [overflow-wrap:anywhere] [word-break:break-word]",
                          c.sticky && "sticky left-0 z-10 bg-card",
                          c.inherited && "bg-amber-500/[0.04] border-l-2 border-l-amber-500/40",
                          alignClass(c.align),
                          c.cellClassName,
                        )}
                      >
                        {c.cell ? c.cell(r) : (colText(c, r) || <span className="text-muted-foreground/40">—</span>)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </table>
      </Card>

      {pagination && (
        <div className="flex items-center justify-between px-1 py-1 text-sm text-muted-foreground">
          <span>
            {pagination.tong === 0
              ? "0 bản ghi"
              : `${(pagination.controls.state.trang - 1) * pagination.controls.state.kichThuoc + 1}–${Math.min(
                  pagination.controls.state.trang * pagination.controls.state.kichThuoc,
                  pagination.tong,
                )} / ${pagination.tong}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.controls.state.trang <= 1}
              onClick={() => pagination.controls.setTrang(pagination.controls.state.trang - 1)}
            >
              Trước
            </Button>
            <span>
              Trang {pagination.controls.state.trang}/{tongSoTrang(pagination.tong, pagination.controls.state.kichThuoc)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.controls.state.trang >= tongSoTrang(pagination.tong, pagination.controls.state.kichThuoc)}
              onClick={() => pagination.controls.setTrang(pagination.controls.state.trang + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


/** Bộ lọc gắn trên tiêu đề cột (danh mục nhiều lựa chọn / tìm chữ). */
function ColFilter({
  type, label, catValues, catSel, onToggleCat, onClearCat, textVal, onText,
}: {
  type: "cat" | "text";
  label: string;
  catValues: string[];
  catSel: Set<string>;
  onToggleCat: (v: string) => void;
  onClearCat: () => void;
  textVal: string;
  onText: (v: string) => void;
}) {
  const active = type === "cat" ? catSel.size > 0 : textVal.trim().length > 0;
  const [catQ, setCatQ] = useState("");
  const filteredCatValues = useMemo(() => {
    const q = normalize(catQ).trim();
    if (!q) return catValues;
    return catValues.filter((v) => normalize(v).includes(q));
  }, [catValues, catQ]);
  return (
    <DropdownMenu onOpenChange={(o) => { if (!o) setCatQ(""); }}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn("rounded p-0.5 transition-colors hover:bg-muted",
            active ? "text-primary" : "text-muted-foreground/50")}
          title="Lọc"
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          <Filter className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-0">
        {type === "text" ? (
          <div className="p-2">
            <Input autoFocus value={textVal} onChange={(e) => onText(e.target.value)}
              placeholder={`Tìm ${label.toLowerCase()}…`} className="h-8" />
            {textVal && (
              <button className="mt-2 text-xs text-primary hover:underline" onClick={() => onText("")}>Xoá lọc</button>
            )}
          </div>
        ) : (
          <Fragment>
            <div className="p-2">
              <Input
                autoFocus
                value={catQ}
                onChange={(e) => setCatQ(e.target.value)}
                placeholder={`Tìm ${label.toLowerCase()}…`}
                className="h-8"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs text-muted-foreground">
                {catSel.size ? `${catSel.size} đã chọn` : `${filteredCatValues.length} giá trị`}
              </span>
              {catSel.size > 0 && (
                <button className="text-xs text-primary hover:underline" onClick={onClearCat}>Xoá</button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-auto pb-1">
              {filteredCatValues.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  {catValues.length === 0 ? "Không có giá trị" : "Không khớp"}
                </div>
              )}
              {filteredCatValues.map((v) => (
                <DropdownMenuCheckboxItem key={v} checked={catSel.has(v)}
                  onCheckedChange={() => onToggleCat(v)} onSelect={(e) => e.preventDefault()}>
                  <span className="truncate">{v || "—"}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

