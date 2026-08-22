import React from "react";
import { Search, ListFilter, X, ArrowUpDown, Eye } from "lucide-react";
import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListControlsState } from "@/lib/mirats/ui/list-controls";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "checkbox-group";
  options: FilterOption[];
}

export interface SortOption {
  key: string;
  label: string;
}

export interface ColumnOption {
  key: string;
  label: string;
}

interface MobileListControlsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ListControlsState;
  setQ: (q: string) => void;
  setFilter: (k: string, v: string | string[] | null) => void;
  setSort: (field: string) => void;
  reset: () => void;
  filters: FilterConfig[];
  sortOptions?: SortOption[];
  columns?: ColumnOption[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (keys: string[]) => void;
}

export function MobileListControlsSheet({
  open,
  onOpenChange,
  state,
  setQ,
  setFilter,
  setSort,
  reset,
  filters,
  sortOptions,
  columns,
  visibleColumns,
  onVisibleColumnsChange,
}: MobileListControlsSheetProps) {
  const activeFilterCount = Object.keys(state.filters).length + (state.q.trim() ? 1 : 0);

  const handleToggleColumn = (key: string) => {
    if (!onVisibleColumnsChange || !visibleColumns) return;
    if (visibleColumns.includes(key)) {
      onVisibleColumnsChange(visibleColumns.filter((k) => k !== key));
    } else {
      onVisibleColumnsChange([...visibleColumns, key]);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bộ lọc & Tùy chỉnh"
      description={
        activeFilterCount > 0
          ? `Đang áp dụng ${activeFilterCount} điều kiện.`
          : "Tìm kiếm và lọc danh sách."
      }
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-6 pb-6">
            {/* 1. Tìm kiếm */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tìm kiếm
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập nội dung tìm..."
                  value={state.q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-11"
                />
                {state.q && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-9 w-9"
                    onClick={() => setQ("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* 2. Các bộ lọc */}
            {filters.map((f) => (
              <div key={f.key} className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </Label>
                {f.type === "select" ? (
                  <Select
                    value={(state.filters[f.key] as string) || "all"}
                    onValueChange={(v) => setFilter(f.key, v === "all" ? null : v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={`Chọn ${f.label.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {f.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {f.options.map((opt) => {
                      const current = (state.filters[f.key] as string[]) || [];
                      const checked = current.includes(opt.value);
                      return (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${f.key}-${opt.value}`}
                            checked={checked}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...current, opt.value]
                                : current.filter((v) => v !== opt.value);
                              setFilter(f.key, next.length ? next : null);
                            }}
                          />
                          <label
                            htmlFor={`${f.key}-${opt.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {opt.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* 3. Sắp xếp */}
            {sortOptions && sortOptions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sắp xếp theo
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((opt) => {
                      const isActive = state.sort?.field === opt.key;
                      return (
                        <Button
                          key={opt.key}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className="h-9 rounded-full px-4"
                          onClick={() => setSort(opt.key)}
                        >
                          {opt.label}
                          {isActive && (
                            <span className="ml-1.5 opacity-70">
                              {state.sort?.dir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 4. Hiển thị cột */}
            {columns && columns.length > 0 && onVisibleColumnsChange && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Hiển thị cột
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {columns.map((col) => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.key}`}
                          checked={visibleColumns?.includes(col.key)}
                          onCheckedChange={() => handleToggleColumn(col.key)}
                        />
                        <label
                          htmlFor={`col-${col.key}`}
                          className="text-sm font-medium leading-none truncate"
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-3 p-4 border-t bg-background sticky bottom-0">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Xóa tất cả
          </Button>
          <Button className="flex-[2] h-11" onClick={() => onOpenChange(false)}>
            Áp dụng
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
