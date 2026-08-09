import { SearchItem, LEVEL_META } from "./types";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function NodeSearch({ items, onPick }: { items: SearchItem[]; onPick: (it: SearchItem) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const nq = normalize(q.trim());
    if (!nq) return [];
    const tierRank: Record<SearchItem["kind"], number> = { 
      root: 0, pl: 1, lv: 2, nh: 3, ht: 4, tb: 5, tp: 6, vtg: 7, vt: 8 
    };
    const matched = items.filter(
      (it) => normalize(it.label).includes(nq) || (it.code && normalize(it.code).includes(nq)),
    );

    const byKey = new Map<string, SearchItem>();
    for (const it of matched) {
      const key = `${it.kind}:${it.ma}`;
      const prev = byKey.get(key);
      if (!prev || (it.count ?? 0) > (prev.count ?? 0)) byKey.set(key, it);
    }
    let list = [...byKey.values()];

    const childHt = new Set<string>();
    for (const it of list) if (it.kind === "ht") childHt.add(`${it.plId}|${it.lvId ?? ""}|${it.nhMa ?? ""}`);
    list = list.filter((it) => !(it.kind === "nh" && childHt.has(`${it.plId}|${it.lvId ?? ""}|${it.ma}`)));

    return list.sort((a, b) => tierRank[a.kind] - tierRank[b.kind]).slice(0, 30);
  }, [q, items]);

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder="Tìm phân loại, hệ thống, tài sản…" className="h-9 w-56 pl-8 sm:w-72"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-80 w-[22rem] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {results.map((it) => {
            const meta = LEVEL_META[it.kind];
            const Icon = meta.Icon;
            return (
              <button
                key={`${it.kind}:${it.ma}`}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => { onPick(it); setOpen(false); }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {it.code && it.kind !== "tb" && it.kind !== "tp" && <span className="mr-1 font-mono text-xs opacity-60">{it.code}</span>}
                  {it.label}
                </span>
                {(it.kind === "tb" || it.kind === "tp") && it.sysName && (
                  <span
                    className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600"
                    title={`Hệ thống: ${it.sysName}`}
                  >
                    <Network className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{it.sysName}</span>
                  </span>
                )}
                <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px]", meta.badge)}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
