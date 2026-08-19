import { useEffect, useState } from "react";
import { Search, X, Download, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseListControlsReturn } from "@/lib/mirats/ui/use-list-controls";

export interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props {
  controls: UseListControlsReturn;
  filters?: FilterDef[];
  placeholder?: string;
  onExport?: () => void;
  debounceMs?: number;
  extra?: React.ReactNode;
}

/**
 * Thanh điều khiển danh sách chuẩn: search debounce + filter chip + reset + export.
 * Không tự lọc dữ liệu — chỉ đọc/ghi state qua `controls`.
 */
export function ListToolbar({
  controls,
  filters = [],
  placeholder = "Tìm kiếm...",
  onExport,
  debounceMs = 250,
  extra,
}: Props) {
  const { state, setQ, setFilter, reset } = controls;
  const [qLocal, setQLocal] = useState(state.q);

  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal !== state.q) setQ(qLocal);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [qLocal, state.q, setQ, debounceMs]);

  useEffect(() => {
    // đồng bộ khi reset ngoài
    if (state.q !== qLocal) setQLocal(state.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.q]);

  const filterEntries = Object.entries(state.filters).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== "" && v !== "all",
  );
  const soFilter = filterEntries.length;
  const daLoc = !!state.q || soFilter > 0 || state.sort !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            placeholder={placeholder}
            className="pl-8 pr-8"
          />
          {qLocal && (
            <button
              type="button"
              aria-label="Xoá tìm kiếm"
              onClick={() => {
                setQLocal("");
                setQ("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {filters.map((f) => {
          const cur = state.filters[f.id];
          const val = Array.isArray(cur) ? cur[0] ?? "all" : (cur as string) ?? "all";
          return (
            <Select
              key={f.id}
              value={val}
              onValueChange={(v) => setFilter(f.id, v === "all" ? null : v)}
            >
              <SelectTrigger className="w-auto min-w-[140px] h-9">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.label}: Tất cả</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {daLoc && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {extra}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="gap-1 !bg-white !text-[#0074e2] border-primary/20 hover:bg-primary/5">
              <Download className="h-4 w-4" />
              Xuất
            </Button>
          )}
        </div>
      </div>

      {filterEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground">Đang lọc:</span>
          {filterEntries.map(([k, v]) => {
            const def = filters.find((f) => f.id === k);
            const label = def?.label ?? k;
            const val = Array.isArray(v) ? v.join(", ") : String(v);
            const shown =
              def?.options.find((o) => o.value === val)?.label ?? val;
            return (
              <Badge key={k} variant="secondary" size="sm" className="gap-1 font-medium bg-secondary/50">
                {label}: {shown}
                <button
                  type="button"
                  aria-label={`Bỏ lọc ${label}`}
                  onClick={() => setFilter(k, null)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
