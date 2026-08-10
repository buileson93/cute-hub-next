import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { GripVertical, ArrowUp, ArrowDown, ChevronsUpDown, RotateCcw, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableExportDialog } from "./TableExportDialog";

export interface StdColumn<T> {
  key: string;
  label: string;
  value: (r: T) => any;
  cell?: (r: T) => React.ReactNode;
  filter?: "text" | "cat";
  align?: "left" | "center" | "right";
  sticky?: boolean;
  minW?: string;
  cellClassName?: string;
  hidden?: boolean;
  group?: string;
  inherited?: boolean;
}

export function StandardTable<T>({
  rows,
  columns,
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
  gated,
  onRowClick,
  rowClassName,
  toolbarRight,
  presets,
  activePreset,
  handleSetPreset,
  isCustomized,
  reset,
  hideExport,
  hideReorderToggle,
  exportName,
  tableKey,
  countUnit = "bản ghi",
  bulkActions,
  pagination,
}: any) {
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => handleResize();
  }, []);

  const isMobile = vw > 0 && vw < 768;
  const shownCols = columns.filter((c: any) => !c.hidden);
  const display = rows;
  const getRowIdInternal = getRowId || ((r: any) => r.id);

  const toggleRow = (id: string) => {
    if (!setSelected) return;
    setSelected((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {isMobile ? (
        <div className="space-y-3">
          {display.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground border rounded-lg bg-card">
              {gated ? "Bảng đang trống." : (emptyContent ?? emptyText)}
            </div>
          ) : (
            display.map((r: any) => {
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
                      {shownCols.slice(0, 5).map((col: any) => (
                        <div key={col.key} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {col.label}
                          </span>
                          <div className={cn("text-sm", col.cellClassName)}>
                            {col.cell ? col.cell(r) : col.value(r)}
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
        <Card className={cn("relative min-h-0 overflow-auto", maxHeightClass)}>
          <Table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow>
                {selectable && <TableHead className="w-10"></TableHead>}
                {shownCols.map((c: any) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {display.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="h-24 text-center">
                     {trangThai?.loi ? (errorContent ?? trangThai.loi) : (emptyContent ?? emptyText)}
                   </TableCell>
                 </TableRow>
              ) : (
                display.map((r: any) => {
                  const rid = getRowIdInternal(r);
                  const isSel = selectable && selected?.has(rid);
                  return (
                    <TableRow key={rid} className={cn(onRowClick && "cursor-pointer", isSel && "bg-primary/5")} onClick={() => onRowClick?.(r)}>
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSel} onCheckedChange={() => toggleRow(rid)} />
                        </TableCell>
                      )}
                      {shownCols.map((c: any) => (
                        <TableCell key={c.key} className={c.cellClassName}>
                          {c.cell ? c.cell(r) : c.value(r)}
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
