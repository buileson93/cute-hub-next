// ============================================================================
// graph-core.ts — LÕI ĐỒ THỊ DÙNG CHUNG (renderer-agnostic).
//
// KHÔNG phụ thuộc React Flow / DOM / canvas. Chỉ toán học đồ thị thuần:
//   - buildAdjacency: danh sách kề (vô hướng + có hướng theo huong)
//   - neighborsWithin: BFS bán kính N (khoảng cách theo bậc)
//   - highlightNeighbors: tô sáng hàng xóm bậc N quanh 1 node
//   - egoGraph: trích đồ thị con bán kính N quanh 1 node
//   - filterGraph: lọc theo lớp / loại / ẩn liên kết 'ngung'
//
// Prompt 6 MỞ RỘNG chính file này để gắn renderer nhẹ kiểu Obsidian
// (canvas / WebGL) mà không phải viết lại logic. Vì vậy mọi kiểu ở đây là
// generic (string) để dùng lại được với bất kỳ nguồn dữ liệu đồ thị nào.
// Test: __tests__/graph-core.test.ts
// ============================================================================

/** Node đồ thị tối giản, không gắn với renderer. */
export interface CoreNode {
  id: string;
  ten: string;
  nhom?: string | null;
  don_vi?: string | null;
  /** Node thuộc tổ chức bên ngoài (vẽ nét đứt + nhãn tổ chức). */
  ben_ngoai?: boolean;
  to_chuc?: string | null;
  meta?: Record<string, unknown>;
}

/** Cạnh đồ thị tối giản. huong/lop/loai/trang_thai để string cho generic. */
export interface CoreEdge {
  id: string;
  nguon: string;
  dich: string;
  loai: string;
  loai_ten?: string | null;
  lop: string;
  huong: string;
  trang_thai: string;
  mau_sac?: string | null;
  kieu_net?: string | null;
  /** true = có hướng (mũi tên 1 chiều); false = 2 chiều. */
  co_huong?: boolean;
  hai_chieu?: boolean;
  meta?: Record<string, unknown>;
}

export interface CoreGraph {
  nodes: CoreNode[];
  edges: CoreEdge[];
}

export interface Adjacency {
  /** Kề vô hướng: node -> tập node hàng xóm. */
  neighbors: Map<string, Set<string>>;
  /** Cạnh kề: node -> tập id cạnh chạm vào nó. */
  incident: Map<string, Set<string>>;
  /** Kề CÓ HƯỚNG theo huong/co_huong: node -> node đi tới được. */
  outAdj: Map<string, Set<string>>;
}

function ensure(m: Map<string, Set<string>>, k: string): Set<string> {
  let s = m.get(k);
  if (!s) {
    s = new Set();
    m.set(k, s);
  }
  return s;
}

/** Dựng danh sách kề (vô hướng + có hướng). Bỏ qua cạnh trỏ tới node không tồn tại. */
export function buildAdjacency(graph: CoreGraph): Adjacency {
  const neighbors = new Map<string, Set<string>>();
  const incident = new Map<string, Set<string>>();
  const outAdj = new Map<string, Set<string>>();

  const known = new Set(graph.nodes.map((n) => n.id));
  for (const n of graph.nodes) {
    ensure(neighbors, n.id);
    ensure(incident, n.id);
    ensure(outAdj, n.id);
  }

  for (const e of graph.edges) {
    if (!known.has(e.nguon) || !known.has(e.dich)) continue;
    ensure(neighbors, e.nguon).add(e.dich);
    ensure(neighbors, e.dich).add(e.nguon);
    ensure(incident, e.nguon).add(e.id);
    ensure(incident, e.dich).add(e.id);

    ensure(outAdj, e.nguon).add(e.dich);
    const twoWay = e.hai_chieu ?? e.huong === "hai_chieu";
    if (twoWay || e.co_huong === false) ensure(outAdj, e.dich).add(e.nguon);
  }

  return { neighbors, incident, outAdj };
}

/** Bậc (số hàng xóm vô hướng) của một node. */
export function degree(adj: Adjacency, id: string): number {
  return adj.neighbors.get(id)?.size ?? 0;
}

/**
 * BFS trả Map<nodeId, khoảng-cách> cho tất cả node trong bán kính `radius`
 * quanh `startId` (gồm chính nó ở khoảng cách 0). radius < 1 -> chỉ start.
 */
export function neighborsWithin(
  adj: Adjacency,
  startId: string,
  radius: number,
): Map<string, number> {
  const dist = new Map<string, number>();
  if (!adj.neighbors.has(startId)) return dist;
  dist.set(startId, 0);
  let frontier = [startId];
  for (let d = 1; d <= radius && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const nb of adj.neighbors.get(id) ?? []) {
        if (!dist.has(nb)) {
          dist.set(nb, d);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return dist;
}

export interface HighlightSet {
  /** Node được tô sáng (start + hàng xóm trong bán kính). */
  nodes: Set<string>;
  /** Cạnh được tô sáng (hai đầu đều nằm trong tập node tô sáng). */
  edges: Set<string>;
}

/**
 * Tô sáng hàng xóm bậc `radius` (mặc định 1) quanh `selectedId`.
 * Cạnh được tô sáng khi cả hai đầu nằm trong tập node tô sáng.
 */
export function highlightNeighbors(graph: CoreGraph, selectedId: string, radius = 1): HighlightSet {
  const adj = buildAdjacency(graph);
  const dist = neighborsWithin(adj, selectedId, radius);
  const nodes = new Set(dist.keys());
  const edges = new Set<string>();
  for (const e of graph.edges) {
    if (nodes.has(e.nguon) && nodes.has(e.dich)) edges.add(e.id);
  }
  return { nodes, edges };
}

/**
 * Ego-graph: đồ thị con gồm mọi node trong bán kính `radius` quanh `centerId`
 * và các cạnh có cả hai đầu nằm trong tập đó.
 */
export function egoGraph(graph: CoreGraph, centerId: string, radius: number): CoreGraph {
  const adj = buildAdjacency(graph);
  const dist = neighborsWithin(adj, centerId, radius);
  const keep = new Set(dist.keys());
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    edges: graph.edges.filter((e) => keep.has(e.nguon) && keep.has(e.dich)),
  };
}

export interface GraphFilter {
  /** Lọc theo lớp (vd ['vat_ly'] hoặc ['logic']). null/[] => tất cả. */
  lop?: string[] | null;
  /** Lọc theo mã loại liên kết. null/[] => tất cả. */
  loai?: string[] | null;
  /** Ẩn cạnh trạng thái 'ngung'. */
  hideNgung?: boolean;
  /** Bỏ node không còn cạnh nào sau khi lọc. */
  dropOrphans?: boolean;
}

/** Lọc đồ thị theo lớp / loại / ẩn 'ngung'. Trả đồ thị mới (không mutate). */
export function filterGraph(graph: CoreGraph, f: GraphFilter): CoreGraph {
  const lopSet = f.lop && f.lop.length ? new Set(f.lop) : null;
  const loaiSet = f.loai && f.loai.length ? new Set(f.loai) : null;

  const edges = graph.edges.filter((e) => {
    if (lopSet && !lopSet.has(e.lop)) return false;
    if (loaiSet && !loaiSet.has(e.loai)) return false;
    if (f.hideNgung && e.trang_thai === "ngung") return false;
    return true;
  });

  if (!f.dropOrphans) return { nodes: graph.nodes, edges };

  const used = new Set<string>();
  for (const e of edges) {
    used.add(e.nguon);
    used.add(e.dich);
  }
  return { nodes: graph.nodes.filter((n) => used.has(n.id)), edges };
}

/**
 * Màu chip ổn định theo đơn vị (hoặc bất kỳ khóa nào). Hue suy ra từ hash tên
 * -> cùng đơn vị luôn cùng màu. Trả chuỗi hsl() để renderer nào cũng dùng được.
 */
export function chipHslTheoKhoa(key: string | null | undefined): string | null {
  if (!key) return null;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360;
  return `hsl(${h} 62% 48%)`;
}
