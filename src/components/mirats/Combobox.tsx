import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalize } from "@/lib/mirats/global-search";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface ComboboxProps {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Cho phép nhập giá trị tự do (không có trong danh sách). */
  allowCustom?: boolean;
  /** Đang tải danh sách lựa chọn — hiện skeleton thay vì ô rỗng nhấp nháy. */
  loading?: boolean;
  className?: string;
  /** Callback khi người dùng nhập vào ô tìm kiếm (dùng để search server-side). */
  onSearchChange?: (value: string) => void;
}

/** Ô chọn có tìm kiếm, dùng chung cho báo cáo (đơn vị / hệ thống / vị trí…). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Chọn…",
  searchPlaceholder = "Tìm kiếm…",
  emptyText = "Không có kết quả",
  allowCustom = false,
  loading = false,
  className,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? (value || "");

  if (loading) {
    return (
      <Skeleton
        aria-busy="true"
        aria-label="Đang tải danh sách"
        className={cn("h-9 w-full rounded-md", className)}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{displayLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[220px] p-0"
        align="start"
      >
        <Command shouldFilter={!allowCustom}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              onSearchChange?.(v);
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowCustom &&
                query.trim() &&
                !options.some((o) => normalize(o.label) === normalize(query)) && (
                  <CommandItem
                    value={`__custom__ ${query}`}
                    className="items-center gap-2 text-sm"
                    onSelect={() => {
                      onChange(query.trim());
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check className="h-4 w-4 shrink-0 opacity-0" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      Dùng: <span className="font-medium">{query.trim()}</span>
                    </span>
                  </CommandItem>
                )}
              {(allowCustom
                ? options.filter((o) => {
                    const q = normalize(query);
                    if (!q) return true;
                    return (
                      normalize(o.label).includes(q) || normalize(o.hint ?? "").includes(q)
                    );
                  })
                : options
              ).map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""}`}
                  className="items-center gap-2 text-sm"
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate text-left">{o.label}</span>
                  {o.hint && (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{o.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
