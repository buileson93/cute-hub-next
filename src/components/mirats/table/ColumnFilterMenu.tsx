import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { normalize } from "@/lib/mirats/global-search";

export interface ColumnFilterMenuProps {
  /** Nhãn cột hiển thị trên tiêu đề popover */
  label: string;
  /** Kiểu lọc: nhập văn bản hoặc chọn từ danh sách giá trị */
  kind: "text" | "cat";
  /** Giá trị lọc văn bản hiện tại */
  textValue: string;
  onTextChange: (value: string) => void;
  /** Danh sách giá trị duy nhất kèm số lượng (chỉ dùng cho kind = "cat") */
  options?: { value: string; count: number }[];
  selected?: Set<string>;
  onToggleValue?: (value: string) => void;
  onSelectOnly?: (value: string) => void;
  onClear: () => void;
  /** Sắp xếp theo cột này */
  sortDir?: "asc" | "desc" | null;
  onSort?: (dir: "asc" | "desc" | null) => void;
}

/**
 * Bộ lọc theo từng cột: hỗ trợ cả ô tìm kiếm văn bản và danh sách chọn
 * (droplist) với tìm nhanh trong danh sách + sắp xếp.
 */
export function ColumnFilterMenu({
  label,
  kind,
  textValue,
  onTextChange,
  options = [],
  selected,
  onToggleValue,
  onSelectOnly,
  onClear,
  sortDir = null,
  onSort,
}: ColumnFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const active = kind === "cat" ? (selected?.size ?? 0) > 0 : textValue.trim().length > 0;

  const visibleOptions = useMemo(() => {
    if (kind !== "cat") return [];
    const needle = normalize(q).trim();
    const list = needle
      ? options.filter((o) => normalize(o.value).includes(needle))
      : options;
    return list.slice(0, 300);
  }, [options, q, kind]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Lọc cột ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-meta font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {active && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-meta"
              onClick={onClear}
            >
              <X className="mr-1 h-3 w-3" />
              Xóa lọc
            </Button>
          )}
        </div>

        {onSort && (
          <div className="mb-2 flex items-center gap-1">
            {(["asc", "desc"] as const).map((dir) => (
              <Button
                key={dir}
                size="sm"
                variant={sortDir === dir ? "secondary" : "ghost"}
                className="h-7 flex-1 px-2 text-meta"
                onClick={() => onSort(sortDir === dir ? null : dir)}
              >
                {dir === "asc" ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3" />
                )}
                {dir === "asc" ? "Tăng dần" : "Giảm dần"}
              </Button>
            ))}
          </div>
        )}

        {kind === "text" ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Tìm trong ${label.toLowerCase()}…`}
              className="h-8 pl-7 text-xs"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm giá trị…"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <div className="max-h-56 space-y-0.5 overflow-y-auto mirats-scroll pr-1">
              {visibleOptions.length === 0 ? (
                <p className="px-1 py-4 text-center text-meta text-muted-foreground">
                  Không có giá trị phù hợp
                </p>
              ) : (
                visibleOptions.map((o) => {
                  const checked = selected?.has(o.value) ?? false;
                  return (
                    <div
                      key={o.value || "__empty__"}
                      className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/60"
                    >
                      <Checkbox
                        id={`f-${label}-${o.value}`}
                        checked={checked}
                        onCheckedChange={() => onToggleValue?.(o.value)}
                      />
                      <label
                        htmlFor={`f-${label}-${o.value}`}
                        className="flex-1 cursor-pointer truncate text-xs"
                        title={o.value || "(trống)"}
                      >
                        {o.value || "(trống)"}
                      </label>
                      <span className="text-mini tabular-nums text-muted-foreground">
                        {o.count}
                      </span>
                      {onSelectOnly && (
                        <button
                          type="button"
                          className="hidden text-mini text-primary group-hover:inline"
                          onClick={() => onSelectOnly(o.value)}
                        >
                          chỉ
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
