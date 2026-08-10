import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";

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
  activePreset?: any;
  handleSetPreset?: (p: any) => void;
  isCustomized?: boolean;
  reset?: () => void;
  hideExport?: boolean;
  hideReorderToggle?: boolean;
  exportName?: string;
  autoFit?: boolean;
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
}: StandardTableProps<T>) {
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  
  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = vw > 0 && vw < 768;
  const shownCols = columns.filter((c) => !c.hidden);
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

  return (
    <div className="space-y-3">
      {(toolbarRight || toolbarLeft || (selectable && selectedRows.length > 0)) && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            {toolbarLeft && toolbarLeft({ visibleRows: rows, visibleColumns: shownCols })}
            {selectable && selectedRows.length > 0 && bulkActions && (
              bulkActions({
                selectedRows,
                visibleColumns: shownCols,
                allColumns: columns,
                filteredRows: rows,
                pageRows: rows,
                clear: clearSelection
              })
            )}
          </div>
          <div className="flex items-center gap-2">
            {toolbarRight && toolbarRight({ visibleRows: rows, visibleColumns: shownCols })}
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
        <Card className={cn("relative min-h-0 overflow-auto border shadow-sm", maxHeightClass)}>
          <Table className="w-full caption-bottom text-sm">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                {selectable && <TableHead className="w-10"></TableHead>}
                {shownCols.map((c) => (
                  <TableHead key={c.key} className={cn(c.align === "center" && "text-center", c.align === "right" && "text-right")}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trangThai?.dangTai ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    {loadingContent || "Đang tải dữ liệu..."}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24 text-center">
                    {trangThai?.loi ? (errorContent ?? String(trangThai.loi)) : (emptyContent ?? emptyText)}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const rid = getRowIdInternal(r);
                  const isSel = selectable && selected?.has(rid);
                  return (
                    <TableRow key={rid} className={cn(onRowClick && "cursor-pointer", isSel && "bg-primary/5", rowClassName?.(r))} onClick={() => onRowClick?.(r)}>
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSel} onCheckedChange={() => toggleRow(rid)} />
                        </TableCell>
                      )}
                      {shownCols.map((c) => (
                        <TableCell key={c.key} className={cn(c.cellClassName, c.align === "center" && "text-center", c.align === "right" && "text-right")}>
                          {c.cell ? c.cell(r) : String(c.value?.(r) ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
