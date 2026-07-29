import { useMemo } from "react";
import { Paperclip, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  type CongVanLinkRow, type CongVanRow, type CongVanTepRow,
  LIEN_KET_META, LOAI_META, TRANG_THAI_META, cvMoc, fmtDate,
} from "./types";

const NODE_W = 250;
const ROW_H = 92;
const PAD_X = 24;
const HEADER_H = 34;

export function CongVanTimeline({
  congVans, links, teps, onOpen,
}: {
  congVans: CongVanRow[];
  links: CongVanLinkRow[];
  teps: CongVanTepRow[];
  onOpen: (cv: CongVanRow) => void;
}) {
  const rows = useMemo(
    () => [...congVans].sort((a, b) => cvMoc(a).getTime() - cvMoc(b).getTime()),
    [congVans],
  );

  const geom = useMemo(() => {
    if (!rows.length) return null;
    const times = rows.map((r) => cvMoc(r).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const days = Math.max(1, Math.round((max - min) / 86_400_000));
    const track = Math.max(560, Math.min(days * 26, 2600));
    const width = track + NODE_W + PAD_X * 2;
    const index = new Map(rows.map((r, i) => [r.id, i]));
    const x = (r: CongVanRow) =>
      PAD_X + (max === min ? 0 : ((cvMoc(r).getTime() - min) / (max - min)) * track);
    const y = (r: CongVanRow) => HEADER_H + (index.get(r.id) ?? 0) * ROW_H;
    return { min, max, width, height: HEADER_H + rows.length * ROW_H + 16, x, y, index };
  }, [rows]);

  const tepCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of teps) m.set(t.cong_van_id, (m.get(t.cong_van_id) ?? 0) + 1);
    return m;
  }, [teps]);

  if (!rows.length || !geom) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Chưa có công văn nào — thêm công văn gốc để bắt đầu dòng thời gian.
      </div>
    );
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const edges = links
    .map((l) => ({ l, a: byId.get(l.tu_id), b: byId.get(l.den_id) }))
    .filter((e): e is { l: CongVanLinkRow; a: CongVanRow; b: CongVanRow } => !!e.a && !!e.b);

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <div className="relative" style={{ width: geom.width, height: geom.height }}>
          {/* Trục thời gian */}
          <div className="absolute inset-x-0 top-0 flex h-[34px] items-center justify-between border-b px-6 text-[11px] text-muted-foreground">
            <span>{fmtDate(new Date(geom.min).toISOString())}</span>
            <span className="uppercase tracking-wide">Dòng thời gian công văn</span>
            <span>{fmtDate(new Date(geom.max).toISOString())}</span>
          </div>

          {/* Đường nối phụ thuộc */}
          <svg className="pointer-events-none absolute inset-0" width={geom.width} height={geom.height}>
            <defs>
              <marker id="cv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" className="fill-primary/70" />
              </marker>
            </defs>
            {edges.map(({ l, a, b }) => {
              const x1 = geom.x(a) + NODE_W / 2;
              const y1 = geom.y(a) + 66;
              const x2 = geom.x(b) + NODE_W / 2;
              const y2 = geom.y(b) + 10;
              const mid = (y1 + y2) / 2;
              return (
                <path
                  key={l.id}
                  d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                  className="stroke-primary/50"
                  strokeWidth={1.5}
                  strokeDasharray={l.loai === "lien_quan" ? "4 4" : undefined}
                  fill="none"
                  markerEnd="url(#cv-arrow)"
                />
              );
            })}
          </svg>

          {/* Node công văn */}
          {rows.map((cv) => {
            const meta = LOAI_META[cv.loai];
            const st = TRANG_THAI_META[cv.trang_thai];
            const files = tepCount.get(cv.id) ?? 0;
            const preds = links.filter((l) => l.den_id === cv.id);
            const succs = links.filter((l) => l.tu_id === cv.id);
            return (
              <HoverCard key={cv.id} openDelay={120}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onOpen(cv)}
                    style={{ left: geom.x(cv), top: geom.y(cv), width: NODE_W }}
                    className={cn(
                      "absolute rounded-lg border bg-background p-2.5 text-left shadow-sm transition",
                      "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                      <span className="truncate text-sm font-semibold">{cv.so_cong_van}</span>
                      <Badge variant="outline" className={cn("ml-auto shrink-0 text-[10px]", meta.tone)}>
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
                          <Paperclip className="h-3 w-3" />{files}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("mt-1.5 text-[10px]", st.tone)}>{st.label}</Badge>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-80 text-xs">
                  <div className="text-sm font-semibold">{cv.so_cong_van}</div>
                  <div className="mt-0.5 text-muted-foreground">{cv.trich_yeu || "(chưa có trích yếu)"}</div>
                  <dl className="mt-2 grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Ban hành</dt><dd>{fmtDate(cv.ngay_ban_hanh)}</dd>
                    <dt className="text-muted-foreground">Tiếp nhận</dt><dd>{fmtDate(cv.ngay_tiep_nhan)}</dd>
                    <dt className="text-muted-foreground">Hạn phúc đáp</dt><dd>{fmtDate(cv.han_phuc_dap)}</dd>
                    <dt className="text-muted-foreground">Cơ quan</dt>
                    <dd className="truncate">{cv.co_quan_ban_hanh || cv.co_quan_nhan || "—"}</dd>
                  </dl>
                  {preds.length > 0 && (
                    <div className="mt-2">
                      <div className="text-muted-foreground">Căn cứ / tiền nhiệm</div>
                      {preds.map((p) => (
                        <div key={p.id}>← {byId.get(p.tu_id)?.so_cong_van} · {LIEN_KET_META[p.loai].label}</div>
                      ))}
                    </div>
                  )}
                  {succs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-muted-foreground">Kế nhiệm</div>
                      {succs.map((p) => (
                        <div key={p.id}>→ {byId.get(p.den_id)?.so_cong_van} · {LIEN_KET_META[p.loai].label}</div>
                      ))}
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