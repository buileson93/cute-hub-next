// ============================================================================
// Bảng phân cấp (thay cho sơ đồ tư duy react-flow).
// - Dữ liệu thật lấy từ cùng nguồn `tree` (PlGroup[]) mà TreeView đang dùng.
// - Làm phẳng theo trạng thái mở/thu gọn → chỉ render các dòng đang hiển thị,
//   nên không có đệ quy sâu gây kẹt giao diện.
// - Chống dữ liệu xấu: node thiếu mã, trùng ID, vòng lặp (đã thấy ở nhánh cha),
//   độ sâu vượt ngưỡng.
// ============================================================================
import { useCallback, useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LEVEL_META, STATUS_TONE, type PlGroup } from "./types";
import { statusCat } from "./utils";

export type HierarchyKind = "pl" | "lv" | "nh" | "ht" | "tb";

export type FlatRow = {
  /** Khoá duy nhất trong toàn bảng (đã kèm đường dẫn cha). */
  key: string;
  /** Mã nghiệp vụ của node. */
  ma: string;
  kind: HierarchyKind;
  ten: string;
  depth: number;
  hasChildren: boolean;
  count: number;
  meta?: string | null;
  trangThai?: string | null;
};

const MAX_DEPTH = 8;

/** Làm phẳng cây theo tập node đang mở. Thuần tuý, có test riêng. */
export function flattenHierarchy(tree: PlGroup[], expanded: Set<string>): FlatRow[] {
  const rows: FlatRow[] = [];
  const seenKeys = new Set<string>();

  const push = (r: FlatRow) => {
    if (!r.ma) return false;
    if (seenKeys.has(r.key)) return false; // node trùng ID trong cùng nhánh
    if (r.depth > MAX_DEPTH) return false;
    seenKeys.add(r.key);
    rows.push(r);
    return true;
  };

  for (const pl of tree ?? []) {
    if (!pl?.id) continue;
    const plKey = `pl:${pl.id}`;
    const plHas = (pl.fields ?? []).length > 0;
    if (!push({
      key: plKey, ma: pl.id, kind: "pl", ten: pl.ten || pl.id,
      depth: 0, hasChildren: plHas, count: pl.count ?? 0,
    })) continue;
    if (!plHas || !expanded.has(plKey)) continue;

    for (const lv of pl.fields ?? []) {
      if (!lv?.id) continue;
      const lvKey = `${plKey}/lv:${lv.id}`;
      const lvHas = (lv.groups ?? []).length > 0;
      const lvVisible = !lv.passthrough;
      if (lvVisible) {
        if (!push({
          key: lvKey, ma: lv.id, kind: "lv", ten: lv.ten || lv.id,
          depth: 1, hasChildren: lvHas, count: lv.count ?? 0,
        })) continue;
        if (!lvHas || !expanded.has(lvKey)) continue;
      }
      const lvDepth = lvVisible ? 2 : 1;

      for (const nh of lv.groups ?? []) {
        if (!nh?.ma) continue;
        const nhKey = `${lvKey}/nh:${nh.ma}`;
        const nhHas = (nh.systems ?? []).length > 0;
        const nhVisible = !nh.passthrough;
        if (nhVisible) {
          if (!push({
            key: nhKey, ma: nh.ma, kind: "nh", ten: nh.ten || nh.ma,
            depth: lvDepth, hasChildren: nhHas, count: nh.count ?? 0,
          })) continue;
          if (!nhHas || !expanded.has(nhKey)) continue;
        }
        const nhDepth = nhVisible ? lvDepth + 1 : lvDepth;

        for (const ht of nh.systems ?? []) {
          if (!ht?.ma) continue;
          const htKey = `${nhKey}/ht:${ht.ma}`;
          const htHas = (ht.devices ?? []).length > 0;
          if (!push({
            key: htKey, ma: ht.ma, kind: "ht", ten: ht.ten || ht.ma,
            depth: nhDepth, hasChildren: htHas, count: ht.count ?? 0,
            meta: ht.donViMa ?? null,
          })) continue;
          if (!htHas || !expanded.has(htKey)) continue;

          for (const dev of ht.devices ?? []) {
            const tb: any = dev?.tb;
            const ma = tb?.ma_thiet_bi;
            if (!ma) continue;
            push({
              key: `${htKey}/tb:${ma}`,
              ma,
              kind: "tb",
              ten: tb.ten_thiet_bi || tb._modelTen || tb._loaiTbTen || "Chưa có tên",
              depth: nhDepth + 1,
              hasChildren: false,
              count: 0,
              meta: tb.vi_tri ?? null,
              trangThai: tb.trang_thai ?? null,
            });
          }
        }
      }
    }
  }
  return rows;
}

export function HierarchyTable({
  tree,
  onOpenEditor,
  className,
}: {
  tree: PlGroup[];
  onOpenEditor?: (kind: HierarchyKind, ma: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const rows = useMemo(() => flattenHierarchy(tree ?? [], expanded), [tree, expanded]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!rows.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Chưa có dữ liệu phân cấp để hiển thị.
      </div>
    );
  }

  return (
    <div className={cn("h-full overflow-auto mirats-scroll", className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <tr className="border-b text-meta uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pl-3 pr-2 text-left font-semibold">Tên</th>
            <th className="w-36 px-2 py-2 text-left font-semibold">Cấp</th>
            <th className="w-44 px-2 py-2 text-left font-semibold">Mã</th>
            <th className="w-24 px-2 py-2 text-right font-semibold">Số lượng</th>
            <th className="w-56 px-2 py-2 text-left font-semibold">Thông tin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const meta = LEVEL_META[r.kind];
            const Icon = meta.Icon;
            const open = expanded.has(r.key);
            return (
              <tr
                key={r.key}
                className="border-b border-border/50 transition-colors hover:bg-muted/40"
              >
                <td className="py-1.5 pl-3 pr-2">
                  <div
                    className="flex items-center gap-1.5"
                    style={{ paddingLeft: r.depth * 18 }}
                  >
                    {r.hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(r.key)}
                        aria-expanded={open}
                        aria-label={open ? `Thu gọn ${r.ten}` : `Mở rộng ${r.ten}`}
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {open ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="inline-block size-6 shrink-0" aria-hidden="true" />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {onOpenEditor ? (
                      <button
                        type="button"
                        className="truncate text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => onOpenEditor(r.kind, r.ma)}
                      >
                        {r.ten}
                      </button>
                    ) : (
                      <span className="truncate">{r.ten}</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Badge variant="outline" className={cn("text-mini", meta.badge)}>
                    {meta.label}
                  </Badge>
                </td>
                <td className="px-2 py-1.5 font-mono text-mini text-muted-foreground">{r.ma}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                  {r.kind === "tb" ? "—" : r.count}
                </td>
                <td className="px-2 py-1.5 text-mini text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {r.trangThai ? (
                      <Badge
                        variant="outline"
                        className={cn("text-mini", STATUS_TONE[statusCat(r.trangThai)])}
                      >
                        {r.trangThai}
                      </Badge>
                    ) : null}
                    {r.meta ? <span className="truncate">{r.meta}</span> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
