// ============================================================================
// graph-cluster.ts — GOM CỤM / SUPER-NODE / SEMANTIC-ZOOM (renderer-agnostic).
//
// MỞ RỘNG graph-core.ts (Prompt 4/6): chỉ phần gom cụm theo tổ chức, thu/bung
// super-node, và dựng đồ thị cấp tổ chức là MỚI. KHÔNG lặp lại adjacency /
// ego-graph / highlight / phân tích tác động (đã có ở graph-core.ts).
//
// Dùng cho VIEW TỔNG QUAN MẠNG kiểu Obsidian:
//   - Tầng 1: các TỔ CHỨC là super-node (orgLevelGraph).
//   - Tầng 2: bung 1 tổ chức thành các HỆ THỐNG bên trong (collapseGraph với
//     tập collapsed = tất cả tổ chức TRỪ tổ chức đang bung).
//
// KHÔNG phụ thuộc React / DOM / canvas. Test: __tests__/graph-cluster.test.ts
// ============================================================================

import type { CoreEdge, CoreGraph, CoreNode } from "./graph-core";

/** Một tổ chức trong cây dm_to_chuc (tối giản cho logic gom cụm). */
export interface OrgInfo {
  id: string;
  cha_id?: string | null;
  ten?: string | null;
  mau_sac?: string | null;
  loai?: string | null;
}

/** Node có gắn tổ chức (cho gom cụm). */
export interface ClusterNode extends CoreNode {
  to_chuc_id?: string | null;
}

/** Cạnh gộp giữa hai super-node: trong_so = số cạnh gốc bị gộp. */
export interface ClusterEdge extends CoreEdge {
  trong_so?: number;
}

/**
 * Gom node theo tổ chức: Map<to_chuc_id, danh sách nodeId>.
 * Node không có tổ chức được gom vào khóa đặc biệt "__none__".
 */
export const NO_ORG = "__none__";

export function groupNodesByOrg(
  nodes: ClusterNode[],
): Map<string, string[]> {
  const g = new Map<string, string[]>();
  for (const n of nodes) {
    const key = n.to_chuc_id ?? NO_ORG;
    const arr = g.get(key);
    if (arr) arr.push(n.id);
    else g.set(key, [n.id]);
  }
  return g;
}

/** Map id tổ chức -> id tổ chức cha (hoặc null). */
export function buildOrgParent(orgs: OrgInfo[]): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const o of orgs) m.set(o.id, o.cha_id ?? null);
  return m;
}

/**
 * Tổ chức "đại diện" (super-node) của 1 tổ chức theo tập collapsed:
 * đi ngược lên cây cha, trả về tổ chức collapsed NGOÀI CÙNG (gần gốc nhất).
 * Nếu không tổ tiên nào (kể cả chính nó) collapsed -> trả null (node đứng riêng).
 */
export function effectiveCluster(
  orgId: string | null | undefined,
  orgParent: Map<string, string | null>,
  collapsed: Set<string>,
): string | null {
  let cur = orgId ?? null;
  let outermost: string | null = null;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    if (collapsed.has(cur)) outermost = cur;
    cur = orgParent.get(cur) ?? null;
  }
  return outermost;
}

/**
 * Thu gọn: mỗi tổ chức trong `collapsed` (gồm cả tổ chức con của nó theo cây
 * cha) gộp các node của nó thành 1 super-node. Cạnh trong cùng cụm bị loại
 * (nội bộ); cạnh giữa hai cụm/khác cụm được GỘP thành 1 cạnh có trong_so.
 *
 * @param graph  đồ thị hệ thống gốc (node = hệ thống)
 * @param orgs   danh mục tổ chức (để suy cây cha)
 * @param collapsed  tập id tổ chức đang thu gọn
 */
export function collapseGraph(
  graph: { nodes: ClusterNode[]; edges: CoreEdge[] },
  orgs: OrgInfo[],
  collapsed: Set<string>,
): { nodes: ClusterNode[]; edges: ClusterEdge[] } {
  const orgParent = buildOrgParent(orgs);
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  // node.id -> super-node id (hoặc chính node nếu không thuộc cụm collapsed)
  const rep = new Map<string, string>();
  const superNodes = new Map<string, ClusterNode>();
  const keepIndividual = new Map<string, ClusterNode>();

  for (const n of graph.nodes) {
    const eff = effectiveCluster(n.to_chuc_id, orgParent, collapsed);
    if (eff) {
      const sid = `org:${eff}`;
      rep.set(n.id, sid);
      if (!superNodes.has(sid)) {
        const org = orgById.get(eff);
        superNodes.set(sid, {
          id: sid,
          ten: org?.ten ?? eff,
          to_chuc_id: eff,
          nhom: null,
          don_vi: null,
          ben_ngoai: org?.loai === "co_quan_ngoai",
          to_chuc: org?.ten ?? null,
          meta: { la_cum: true, mau_sac: org?.mau_sac ?? null, so_thanh_vien: 0 },
        });
      }
      const sn = superNodes.get(sid)!;
      (sn.meta!.so_thanh_vien as number) += 1;
    } else {
      rep.set(n.id, n.id);
      keepIndividual.set(n.id, n);
    }
  }

  // Gộp cạnh: khóa theo cặp (a,b) không định hướng.
  const merged = new Map<string, ClusterEdge>();
  for (const e of graph.edges) {
    const a = rep.get(e.nguon) ?? e.nguon;
    const b = rep.get(e.dich) ?? e.dich;
    if (a === b) continue; // cạnh nội bộ cụm -> bỏ
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const existing = merged.get(key);
    if (existing) {
      existing.trong_so = (existing.trong_so ?? 1) + 1;
    } else {
      merged.set(key, {
        ...e,
        id: `cum:${key}`,
        nguon: a,
        dich: b,
        trong_so: 1,
      });
    }
  }

  return {
    nodes: [...keepIndividual.values(), ...superNodes.values()],
    edges: [...merged.values()],
  };
}

/**
 * Đồ thị CẤP TỔ CHỨC (Tầng 1): thu gọn TẤT CẢ tổ chức thành super-node.
 * Trả về đồ thị mà mỗi node là 1 tổ chức, cạnh liên-tổ-chức có trong_so.
 */
export function orgLevelGraph(
  graph: { nodes: ClusterNode[]; edges: CoreEdge[] },
  orgs: OrgInfo[],
): { nodes: ClusterNode[]; edges: ClusterEdge[] } {
  const all = new Set(orgs.map((o) => o.id));
  return collapseGraph(graph, orgs, all);
}

/**
 * Bung 1 tổ chức (Tầng 2): giữ nguyên node hệ thống của tổ chức `expandId`
 * (và các tổ chức con của nó), thu gọn mọi tổ chức khác thành super-node.
 */
export function expandOrgGraph(
  graph: { nodes: ClusterNode[]; edges: CoreEdge[] },
  orgs: OrgInfo[],
  expandId: string,
): { nodes: ClusterNode[]; edges: ClusterEdge[] } {
  const orgParent = buildOrgParent(orgs);

  // Tổ tiên (kể cả chính nó) của expandId — KHÔNG được thu gọn, nếu không
  // node của expandId sẽ bị gộp lên super-node của tổ tiên.
  const ancestors = new Set<string>();
  {
    let cur: string | null = expandId;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      ancestors.add(cur);
      cur = orgParent.get(cur) ?? null;
    }
  }

  const inBranch = (id: string): boolean => {
    let cur: string | null = id;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (cur === expandId) return true;
      cur = orgParent.get(cur) ?? null;
    }
    return false;
  };

  // collapsed = tổ chức KHÔNG thuộc nhánh expandId VÀ không phải tổ tiên nó.
  const collapsed = new Set<string>();
  for (const o of orgs) {
    if (!inBranch(o.id) && !ancestors.has(o.id)) collapsed.add(o.id);
  }
  return collapseGraph(graph, orgs, collapsed);
}
