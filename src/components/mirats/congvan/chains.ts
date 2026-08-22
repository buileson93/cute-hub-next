// ============================================================================
// Phân tích "luồng công văn": gom các công văn có liên kết (trả lời / căn cứ /
// liên quan / parent) thành từng luồng, tính upstream–downstream và độ trễ.
// ============================================================================
import type { CongVanLinkRow, CongVanRow } from "./types";
import { cvMoc } from "./types";

export type CongVanGraph = {
  /** id → chỉ số luồng (0,1,2…) */
  chainOf: Map<string, number>;
  /** chỉ số luồng → danh sách công văn (đã sắp theo thời gian) */
  chains: { index: number; items: CongVanRow[]; from: Date; to: Date; open: number }[];
  /** id → các id đứng trước (căn cứ / được trả lời) */
  parents: Map<string, string[]>;
  /** id → các id đứng sau */
  childrenOf: Map<string, string[]>;
};

const CLOSED = new Set(["hoan_tat", "da_phat_hanh", "huy"]);

/** Cạnh hiệu lực: liên kết tường minh + quan hệ parent_id. */
export function effectiveEdges(
  congVans: CongVanRow[],
  links: CongVanLinkRow[],
): { id: string; tu_id: string; den_id: string; loai: CongVanLinkRow["loai"] }[] {
  const ids = new Set(congVans.map((c) => c.id));
  const seen = new Set<string>();
  const out: { id: string; tu_id: string; den_id: string; loai: CongVanLinkRow["loai"] }[] = [];
  for (const l of links) {
    if (!ids.has(l.tu_id) || !ids.has(l.den_id)) continue;
    const k = `${l.tu_id}>${l.den_id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ id: l.id, tu_id: l.tu_id, den_id: l.den_id, loai: l.loai });
  }
  for (const cv of congVans) {
    if (!cv.parent_id || !ids.has(cv.parent_id)) continue;
    const k = `${cv.parent_id}>${cv.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ id: `p-${cv.id}`, tu_id: cv.parent_id, den_id: cv.id, loai: "tra_loi" });
  }
  return out;
}

export function buildGraph(congVans: CongVanRow[], links: CongVanLinkRow[]): CongVanGraph {
  const edges = effectiveEdges(congVans, links);
  const parents = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  for (const e of edges) {
    parents.set(e.den_id, [...(parents.get(e.den_id) ?? []), e.tu_id]);
    childrenOf.set(e.tu_id, [...(childrenOf.get(e.tu_id) ?? []), e.den_id]);
  }

  // Hợp nhất thành phần liên thông (union–find đơn giản bằng BFS).
  const adj = new Map<string, Set<string>>();
  for (const cv of congVans) adj.set(cv.id, new Set());
  for (const e of edges) {
    adj.get(e.tu_id)?.add(e.den_id);
    adj.get(e.den_id)?.add(e.tu_id);
  }
  const byDate = (a: CongVanRow, b: CongVanRow) => cvMoc(a).getTime() - cvMoc(b).getTime();
  const byId = new Map(congVans.map((c) => [c.id, c]));
  const chainOf = new Map<string, number>();
  const groups: CongVanRow[][] = [];
  for (const cv of [...congVans].sort(byDate)) {
    if (chainOf.has(cv.id)) continue;
    const idx = groups.length;
    const bucket: CongVanRow[] = [];
    const queue = [cv.id];
    chainOf.set(cv.id, idx);
    while (queue.length) {
      const cur = queue.shift()!;
      const row = byId.get(cur);
      if (row) bucket.push(row);
      for (const nb of adj.get(cur) ?? []) {
        if (chainOf.has(nb)) continue;
        chainOf.set(nb, idx);
        queue.push(nb);
      }
    }
    groups.push(bucket.sort(byDate));
  }

  const chains = groups.map((items, index) => ({
    index,
    items,
    from: cvMoc(items[0]),
    to: cvMoc(items[items.length - 1]),
    open: items.filter((c) => !CLOSED.has(c.trang_thai)).length,
  }));

  return { chainOf, chains, parents, childrenOf };
}

/** Tập id liên quan tới `id`: chính nó + toàn bộ tổ tiên + toàn bộ hậu duệ. */
export function relatedIds(g: CongVanGraph, id: string): Set<string> {
  const out = new Set<string>([id]);
  const walk = (start: string, map: Map<string, string[]>) => {
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of map.get(cur) ?? []) {
        if (out.has(nb)) continue;
        out.add(nb);
        queue.push(nb);
      }
    }
  };
  walk(id, g.parents);
  walk(id, g.childrenOf);
  return out;
}

/** Số ngày giữa hai công văn (làm tròn), dùng cho nhãn độ trễ trên cạnh. */
export function gapDays(a: CongVanRow, b: CongVanRow): number {
  return Math.round((cvMoc(b).getTime() - cvMoc(a).getTime()) / 86_400_000);
}

export function isOverdue(cv: CongVanRow): boolean {
  return (
    !!cv.han_phuc_dap &&
    new Date(cv.han_phuc_dap).getTime() < Date.now() &&
    !CLOSED.has(cv.trang_thai)
  );
}

/** Màu nhận diện luồng (theo chỉ số). */
export const CHAIN_COLORS = [
  { stroke: "stroke-sky-500", text: "text-sky-700", bg: "bg-sky-500", ring: "ring-sky-400" },
  {
    stroke: "stroke-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-500",
    ring: "ring-violet-400",
  },
  {
    stroke: "stroke-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-500",
    ring: "ring-amber-400",
  },
  { stroke: "stroke-teal-500", text: "text-teal-700", bg: "bg-teal-500", ring: "ring-teal-400" },
  { stroke: "stroke-rose-500", text: "text-rose-700", bg: "bg-rose-500", ring: "ring-rose-400" },
  {
    stroke: "stroke-indigo-500",
    text: "text-indigo-700",
    bg: "bg-indigo-500",
    ring: "ring-indigo-400",
  },
];
export const chainColor = (i: number) => CHAIN_COLORS[i % CHAIN_COLORS.length];
