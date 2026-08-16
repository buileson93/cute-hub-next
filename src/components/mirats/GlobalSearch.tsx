import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteItem,
  CommandPaletteGroup,
  CommandPaletteEmpty,
  CommandPaletteFooter,
} from "@astryxdesign/core/CommandPalette";
import {
  useGlobalSearch,
  ENTITY_META,
  Highlight,
  type SearchRow,
} from "@/lib/mirats/global-search";

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const { rows, loading, hasQuery, activeTerm } = useGlobalSearch(q);

  // Reset con trỏ chọn khi tập kết quả đổi.
  useEffect(() => {
    setActive(0);
  }, [rows]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (h: SearchRow) => {
    setOpen(false);
    setQ("");
    navigate({ to: h.to });
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && rows[active]) { e.preventDefault(); go(rows[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={rootRef} className="relative hidden max-w-md flex-1 md:block">
      <div 
        className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm text-muted-foreground transition-colors focus-within:bg-accent cursor-text"
        onClick={() => setOpen(true)}
      >
        {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} />}
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Tìm hệ thống, tài sản, tài liệu, giấy phép…"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <CommandPalette 
        isOpen={open && hasQuery} 
        onOpenChange={setOpen}
        isInline
        width="100%"
        maxHeight="400px"
        xstyle={undefined}
        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
      >
        <CommandPaletteList>
          {rows.length === 0 && loading && (
             <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
               <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…
             </div>
          )}
          
          {rows.length === 0 && !loading && (
            <CommandPaletteEmpty>
              Không tìm thấy kết quả cho “{q.trim()}”
            </CommandPaletteEmpty>
          )}

          {rows.length > 0 && (
            <CommandPaletteGroup heading="Kết quả tìm kiếm">
              {rows.map((h, i) => {
                const meta = ENTITY_META[h.entity];
                const EntityIcon = meta.icon;
                return (
                  <CommandPaletteItem
                    key={`${h.entity}-${h.id}`}
                    onSelect={() => go(h)}
                    isActive={i === active}
                    xstyle={{ padding: 0 }}
                  >
                    <div 
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer",
                        i === active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                    >
                      <EntityIcon className={cn("h-4 w-4 shrink-0", h.entity === "he_thong" ? "text-primary" : "text-muted-foreground")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          <Highlight text={h.title || "(không tiêu đề)"} query={activeTerm} />
                        </div>
                        {h.subtitle && (
                          <div className="truncate text-xs text-muted-foreground">
                            <Highlight text={h.subtitle} query={activeTerm} />
                          </div>
                        )}
                      </div>
                      {h.entity === "thiet_bi" && h.sysName && (
                        <Badge variant="outline" className="shrink-0 gap-1 border-primary/30 text-primary" title={`Hệ thống: ${h.sysName}`}>
                          <Network className="h-3 w-3" />
                          <span className="max-w-[10rem] truncate">{h.sysName}</span>
                        </Badge>
                      )}
                      {h.entity === "he_thong" && typeof h.count === "number" && (
                        <Badge variant="secondary" className="shrink-0 tabular-nums">{h.count} TB</Badge>
                      )}
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {meta.label}
                      </span>
                    </div>
                  </CommandPaletteItem>
                );
              })}
            </CommandPaletteGroup>
          )}
        </CommandPaletteList>
        <CommandPaletteFooter>
          ↑↓ chọn · Enter mở · Esc đóng
        </CommandPaletteFooter>
      </CommandPalette>
    </div>
  );
}
