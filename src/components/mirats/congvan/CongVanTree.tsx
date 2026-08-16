import { useMemo } from "react";
import { ChevronRight, CornerDownRight, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  type CongVanLinkRow, type CongVanRow, type CongVanTepRow,
  LIEN_KET_META, LOAI_META, TRANG_THAI_META, cvMoc, fmtDate,
} from "./types";

/** Danh sách phân cấp: công văn phúc đáp là "thẻ con" của công văn gốc, sắp xếp ngày tăng dần. */
export function CongVanTree({
  congVans, links, teps, onOpen,
}: {
  congVans: CongVanRow[];
  links: CongVanLinkRow[];
  teps: CongVanTepRow[];
  onOpen: (cv: CongVanRow) => void;
}) {
  const tepCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of teps) m.set(t.cong_van_id, (m.get(t.cong_van_id) ?? 0) + 1);
    return m;
  }, [teps]);

  const tree = useMemo(() => {
    // Cha = parent_id, nếu trống thì suy ra từ liên kết trả lời/căn cứ.
    const parentOf = new Map<string, string>();
    for (const cv of congVans) if (cv.parent_id) parentOf.set(cv.id, cv.parent_id);
    for (const l of links) {
      if (l.loai === "lien_quan") continue;
      if (!parentOf.has(l.den_id)) parentOf.set(l.den_id, l.tu_id);
    }
    const byId = new Map(congVans.map((c) => [c.id, c]));
    const children = new Map<string, CongVanRow[]>();
    const roots: CongVanRow[] = [];
    for (const cv of congVans) {
      const p = parentOf.get(cv.id);
      if (p && byId.has(p) && p !== cv.id) {
        children.set(p, [...(children.get(p) ?? []), cv]);
      } else roots.push(cv);
    }
    const byDate = (a: CongVanRow, b: CongVanRow) => cvMoc(a).getTime() - cvMoc(b).getTime();
    const out: { cv: CongVanRow; depth: number; rel: string | null }[] = [];
    const seen = new Set<string>();
    const walk = (node: CongVanRow, depth: number, rel: string | null) => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      out.push({ cv: node, depth, rel });
      for (const c of (children.get(node.id) ?? []).sort(byDate)) {
        const link = links.find((l) => l.tu_id === node.id && l.den_id === c.id);
        walk(c, depth + 1, link ? LIEN_KET_META[link.loai].arrow : "Thẻ con");
      }
    };
    for (const r of roots.sort(byDate)) walk(r, 0, null);
    for (const cv of congVans.sort(byDate)) walk(cv, 0, null); // an toàn với vòng lặp
    return out;
  }, [congVans, links]);

  if (!tree.length) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Chưa có công văn nào trong dự án này.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {tree.map(({ cv, depth, rel }) => {
        const meta = LOAI_META[cv.loai];
        const st = TRANG_THAI_META[cv.trang_thai];
        const files = tepCount.get(cv.id) ?? 0;
        return (
          <button
            key={cv.id}
            type="button"
            onClick={() => onOpen(cv)}
            className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
            style={{ paddingLeft: 12 + depth * 26 }}
          >
            {depth > 0
              ? <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
            <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
            <span className="w-[110px] shrink-0 text-xs tabular-nums text-muted-foreground">
              {fmtDate(cv.ngay_ban_hanh ?? cv.ngay_tiep_nhan)}
            </span>
            <Badge variant="outline" className={cn("shrink-0 text-meta", meta.tone)}>{meta.short}</Badge>
            <span className="shrink-0 font-medium">{cv.so_cong_van}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {cv.trich_yeu || "(chưa có trích yếu)"}
            </span>
            {rel && <span className="hidden shrink-0 text-meta text-muted-foreground lg:inline">{rel}</span>}
            {files > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 text-meta text-muted-foreground">
                <Paperclip className="h-3 w-3" />{files}
              </span>
            )}
            <Badge variant="outline" className={cn("shrink-0 text-meta", st.tone)}>{st.label}</Badge>
          </button>
        );
      })}
    </div>
  );
}