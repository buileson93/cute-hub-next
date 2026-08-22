import { useEffect, useMemo, useState } from "react";
import { Paperclip, CalendarClock, AlertTriangle, Focus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  type CongVanLinkRow,
  type CongVanRow,
  type CongVanTepRow,
  LIEN_KET_META,
  LOAI_META,
  TRANG_THAI_META,
  cvMoc,
  fmtDate,
} from "./types";
import { buildGraph, chainColor, effectiveEdges, gapDays, isOverdue, relatedIds } from "./chains";

const NODE_W = 250;
const ROW_H = 96;
const PAD_X = 24;
const HEADER_H = 34;
const CHAIN_GAP = 18;

export function CongVanTimeline({
  congVans,
  links,
  teps,
  onOpen,
}: {
  congVans: CongVanRow[];
  links: CongVanLinkRow[];
  teps: CongVanTepRow[];
  onOpen: (cv: CongVanRow) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const graph = useMemo(() => buildGraph(congVans, links), [congVans, links]);
  const edges = useMemo(() => effectiveEdges(congVans, links), [congVans, links]);

  // Xếp hàng: gom theo luồng, trong luồng sắp theo thời gian.
  const rows = useMemo(() => {
    const out: { cv: CongVanRow; chain: number; firstOfChain: boolean }[] = [];
    for (const ch of graph.chains) {
      ch.items.forEach((cv, i) => out.push({ cv, chain: ch.index, firstOfChain: i === 0 }));
    }
    return out;
  }, [graph]);

  useEffect(() => {
    if (focusId && !congVans.some((c) => c.id === focusId)) setFocusId(null);
  }, [congVans, focusId]);

  const geom = useMemo(() => {
    if (!rows.length) return null;
    const times = rows.map((r) => cvMoc(r.cv).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const days = Math.max(1, Math.round((max - min) / 86_400_000));
    const track = Math.max(560, Math.min(days * 26, 2600));
    const width = track + NODE_W + PAD_X * 2;
    const tops = new Map<string, number>();
    let y = HEADER_H;
    for (const r of rows) {
      if (r.firstOfChain && y > HEADER_H) y += CHAIN_GAP;
      tops.set(r.cv.id, y);
      y += ROW_H;
    }
    const x = (cv: CongVanRow) =>
      PAD_X + (max === min ? 0 : ((cvMoc(cv).getTime() - min) / (max - min)) * track);
    return {
      min,
      max,
      width,
      height: y + 16,
      x,
      top: (cv: CongVanRow) => tops.get(cv.id) ?? HEADER_H,
    };
  }, [rows]);

  const tepCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of teps) m.set(t.cong_van_id, (m.get(t.cong_van_id) ?? 0) + 1);
    return m;
  }, [teps]);

  const active = focusId ?? hoverId;
  const highlight = useMemo(() => (active ? relatedIds(graph, active) : null), [graph, active]);

  if (!rows.length || !geom) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Chưa có công văn nào — thêm công văn gốc để bắt đầu dòng thời gian.
      </div>
    );
  }

  const byId = new Map(congVans.map((r) => [r.id, r]));
  const drawEdges = edges
    .map((l) => ({ l, a: byId.get(l.tu_id), b: byId.get(l.den_id) }))
    .filter(
      (e): e is { l: (typeof edges)[number]; a: CongVanRow; b: CongVanRow } => !!e.a && !!e.b,
    );

  const dim = (id: string) => !!highlight && !highlight.has(id);
  const focusRow = focusId ? byId.get(focusId) : null;

  return (
    <div className="rounded-lg border bg-card">
      {/* Thanh trạng thái luồng */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-[11px]">
        <span className="text-muted-foreground">Luồng liên kết:</span>
        {graph.chains.map((ch) => {
          const c = chainColor(ch.index);
          const on = focusId != null && graph.chainOf.get(focusId) === ch.index;
          return (
            <button
              key={ch.index}
              type="button"
              onClick={() => setFocusId(on ? null : ch.items[0].id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition",
                on ? "border-foreground/30 bg-muted" : "hover:bg-muted/60",
              )}
              title={`${ch.items.length} công văn · ${fmtDate(ch.from.toISOString())} → ${fmtDate(ch.to.toISOString())}`}
            >
              <span className={cn("h-2 w-2 rounded-full", c.bg)} />
              <span className="font-medium">{ch.items[0].so_cong_van}</span>
              <span className="text-muted-foreground">·{ch.items.length}</span>
              {ch.open > 0 && <span className="text-amber-600">{ch.open} mở</span>}
            </button>
          );
        })}
        {focusRow && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-[11px]"
            onClick={() => setFocusId(null)}
          >
            <X className="mr-1 h-3 w-3" /> Bỏ tiêu điểm {focusRow.so_cong_van}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: geom.width, height: geom.height }}>
          {/* Trục thời gian */}
          <div className="absolute inset-x-0 top-0 flex h-[34px] items-center justify-between border-b px-6 text-[11px] text-muted-foreground">
            <span>{fmtDate(new Date(geom.min).toISOString())}</span>
            <span className="uppercase tracking-wide">Dòng thời gian &amp; liên kết công văn</span>
            <span>{fmtDate(new Date(geom.max).toISOString())}</span>
          </div>

          {/* Đường nối phụ thuộc */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={geom.width}
            height={geom.height}
          >
            <defs>
              <marker
                id="cv-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" className="fill-current" />
              </marker>
            </defs>
            {drawEdges.map(({ l, a, b }) => {
              const chain = graph.chainOf.get(a.id) ?? 0;
              const c = chainColor(chain);
              const on = !highlight || (highlight.has(a.id) && highlight.has(b.id));
              const x1 = geom.x(a) + NODE_W / 2;
              const y1 = geom.top(a) + 70;
              const x2 = geom.x(b) + NODE_W / 2;
              const y2 = geom.top(b) + 8;
              const mid = (y1 + y2) / 2;
              const d = gapDays(a, b);
              return (
                <g key={l.id} className={cn(c.stroke, c.text, on ? "opacity-100" : "opacity-15")}>
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                    strokeWidth={on && highlight ? 2.4 : 1.5}
                    strokeDasharray={l.loai === "lien_quan" ? "4 4" : undefined}
                    fill="none"
                    markerEnd="url(#cv-arrow)"
                  />
                  {on && (
                    <text
                      x={(x1 + x2) / 2}
                      y={mid - 3}
                      textAnchor="middle"
                      className="fill-current text-[10px]"
                    >
                      {LIEN_KET_META[l.loai].label}
                      {Number.isFinite(d) ? ` · ${d >= 0 ? "+" : ""}${d} ngày` : ""}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node công văn */}
          {rows.map(({ cv, chain }) => {
            const meta = LOAI_META[cv.loai];
            const st = TRANG_THAI_META[cv.trang_thai];
            const c = chainColor(chain);
            const files = tepCount.get(cv.id) ?? 0;
            const preds = edges.filter((l) => l.den_id === cv.id);
            const succs = edges.filter((l) => l.tu_id === cv.id);
            const late = isOverdue(cv);
            return (
              <HoverCard key={cv.id} openDelay={120}>
                <HoverCardTrigger asChild>
                  <div
                    style={{ left: geom.x(cv), top: geom.top(cv), width: NODE_W }}
                    className={cn(
                      "absolute rounded-lg border bg-background text-left shadow-sm transition",
                      dim(cv.id) ? "opacity-25" : "opacity-100",
                      focusId === cv.id && cn("ring-2", c.ring),
                    )}
                    onMouseEnter={() => setHoverId(cv.id)}
                    onMouseLeave={() => setHoverId((v) => (v === cv.id ? null : v))}
                  >
                    <span className={cn("absolute inset-y-0 left-0 w-1 rounded-l-lg", c.bg)} />
                    <button
                      type="button"
                      onClick={() => onOpen(cv)}
                      className="w-full rounded-lg p-2.5 pl-3 text-left focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                        <span className="truncate text-sm font-semibold">{cv.so_cong_van}</span>
                        <Badge
                          variant="outline"
                          className={cn("ml-auto shrink-0 text-[10px]", meta.tone)}
                        >
                          {meta.short}
                        </Badge>
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {cv.trich_yeu || "(chưa có trích yếu)"}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />
                        {fmtDate(cv.ngay_ban_hanh ?? cv.ngay_tiep_nhan)}
                        {files > 0 && (
                          <span className="ml-auto inline-flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {files}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px]", st.tone)}>
                          {st.label}
                        </Badge>
                        {late && (
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-[10px] text-rose-700"
                          >
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" /> quá hạn
                          </Badge>
                        )}
                        {(preds.length > 0 || succs.length > 0) && (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            ←{preds.length} · {succs.length}→
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      title={focusId === cv.id ? "Bỏ tiêu điểm" : "Chỉ xem luồng của công văn này"}
                      onClick={() => setFocusId(focusId === cv.id ? null : cv.id)}
                      className="absolute right-1 top-1 rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                    >
                      <Focus className="h-3 w-3" />
                    </button>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-80 text-xs">
                  <div className="text-sm font-semibold">{cv.so_cong_van}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {cv.trich_yeu || "(chưa có trích yếu)"}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Ban hành</dt>
                    <dd>{fmtDate(cv.ngay_ban_hanh)}</dd>
                    <dt className="text-muted-foreground">Tiếp nhận</dt>
                    <dd>{fmtDate(cv.ngay_tiep_nhan)}</dd>
                    <dt className="text-muted-foreground">Hạn phúc đáp</dt>
                    <dd className={late ? "font-medium text-rose-600" : ""}>
                      {fmtDate(cv.han_phuc_dap)}
                    </dd>
                    <dt className="text-muted-foreground">Cơ quan</dt>
                    <dd className="truncate">{cv.co_quan_ban_hanh || cv.co_quan_nhan || "—"}</dd>
                  </dl>
                  {preds.length > 0 && (
                    <div className="mt-2">
                      <div className="text-muted-foreground">Căn cứ / tiền nhiệm</div>
                      {preds.map((p) => {
                        const a = byId.get(p.tu_id);
                        return (
                          <div key={p.id}>
                            ← {a?.so_cong_van} · {LIEN_KET_META[p.loai].label}
                            {a ? ` · ${gapDays(a, cv)} ngày` : ""}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {succs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-muted-foreground">Kế nhiệm</div>
                      {succs.map((p) => {
                        const b = byId.get(p.den_id);
                        return (
                          <div key={p.id}>
                            → {b?.so_cong_van} · {LIEN_KET_META[p.loai].label}
                            {b ? ` · ${gapDays(cv, b)} ngày` : ""}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {preds.length === 0 && succs.length === 0 && (
                    <div className="mt-2 text-muted-foreground">
                      Chưa liên kết với công văn nào.
                    </div>
                  )}
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
