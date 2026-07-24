// Test cho graph-cluster.ts — gom cụm / super-node / semantic-zoom.
import { describe, it, expect } from "vitest";
import type { CoreEdge } from "../graph-core";
import {
  groupNodesByOrg,
  buildOrgParent,
  effectiveCluster,
  collapseGraph,
  orgLevelGraph,
  expandOrgGraph,
  NO_ORG,
  type ClusterNode,
  type OrgInfo,
} from "../graph-cluster";

// Cây tổ chức: VATM -> QLBMT ; ACV (ngoài, gốc riêng).
const orgs: OrgInfo[] = [
  { id: "vatm", cha_id: null, ten: "VATM", loai: "tong_cong_ty" },
  { id: "qlbmt", cha_id: "vatm", ten: "QLBMT", loai: "don_vi_thanh_vien" },
  { id: "acv", cha_id: null, ten: "ACV", loai: "co_quan_ngoai" },
];

// Hệ thống: VHF, VCCS, Ghi âm thuộc QLBMT; Mạng ACV thuộc ACV.
const nodes: ClusterNode[] = [
  { id: "vhf", ten: "VHF", to_chuc_id: "qlbmt" },
  { id: "vccs", ten: "VCCS", to_chuc_id: "qlbmt" },
  { id: "ghiam", ten: "Ghi âm", to_chuc_id: "qlbmt" },
  { id: "acvnet", ten: "Mạng ACV", to_chuc_id: "acv" },
];

function edge(id: string, a: string, b: string): CoreEdge {
  return {
    id,
    nguon: a,
    dich: b,
    loai: "LUONG_TIN_HIEU",
    lop: "logic",
    huong: "hai_chieu",
    trang_thai: "hoat_dong",
  };
}

// vhf<->vccs, vccs<->ghiam (nội bộ QLBMT) ; vccs<->acvnet (liên tổ chức)
const edges: CoreEdge[] = [
  edge("e1", "vhf", "vccs"),
  edge("e2", "vccs", "ghiam"),
  edge("e3", "vccs", "acvnet"),
];

const graph = { nodes, edges };

describe("groupNodesByOrg", () => {
  it("gom cụm đúng theo dm_to_chuc", () => {
    const g = groupNodesByOrg(nodes);
    expect(g.get("qlbmt")?.sort()).toEqual(["ghiam", "vccs", "vhf"]);
    expect(g.get("acv")).toEqual(["acvnet"]);
  });

  it("node không tổ chức gom vào NO_ORG", () => {
    const g = groupNodesByOrg([{ id: "x", ten: "X" }]);
    expect(g.get(NO_ORG)).toEqual(["x"]);
  });
});

describe("effectiveCluster", () => {
  const parent = buildOrgParent(orgs);
  it("chọn tổ chức collapsed ngoài cùng (gần gốc)", () => {
    // collapse VATM -> hệ thống QLBMT quy về super-node VATM
    expect(effectiveCluster("qlbmt", parent, new Set(["vatm"]))).toBe("vatm");
  });
  it("chính nó collapsed khi cha không collapsed", () => {
    expect(effectiveCluster("qlbmt", parent, new Set(["qlbmt"]))).toBe("qlbmt");
  });
  it("không collapsed -> null", () => {
    expect(effectiveCluster("qlbmt", parent, new Set())).toBeNull();
  });
});

describe("collapseGraph — thu gọn VATM", () => {
  it("collapse VATM gộp hệ thống QLBMT thành 1 super-node", () => {
    const out = collapseGraph(graph, orgs, new Set(["vatm"]));
    const superNode = out.nodes.find((n) => n.id === "org:vatm");
    expect(superNode).toBeTruthy();
    expect(superNode?.meta?.so_thanh_vien).toBe(3); // vhf, vccs, ghiam
    // acvnet vẫn đứng riêng (không collapsed)
    expect(out.nodes.some((n) => n.id === "acvnet")).toBe(true);
  });

  it("gộp đúng số cạnh liên-tổ-chức (nội bộ bị loại)", () => {
    const out = collapseGraph(graph, orgs, new Set(["vatm"]));
    // e1,e2 nội bộ QLBMT -> loại; chỉ còn 1 cạnh org:vatm <-> acvnet
    expect(out.edges).toHaveLength(1);
    const c = out.edges[0];
    expect(new Set([c.nguon, c.dich])).toEqual(new Set(["org:vatm", "acvnet"]));
    expect(c.trong_so).toBe(1);
  });
});

describe("orgLevelGraph — Tầng 1", () => {
  it("mỗi tổ chức là 1 super-node, cạnh liên-tổ-chức có trọng số", () => {
    const out = orgLevelGraph(graph, orgs);
    const ids = out.nodes.map((n) => n.id).sort();
    // vatm (gom vhf/vccs/ghiam) + acv (gom acvnet)
    expect(ids).toEqual(["org:acv", "org:vatm"]);
    expect(out.edges).toHaveLength(1);
    expect(out.edges[0].trong_so).toBe(1);
  });

  it("gộp nhiều cạnh liên-tổ-chức thành 1 cạnh có trong_so", () => {
    const extra = { nodes, edges: [...edges, edge("e4", "vhf", "acvnet")] };
    const out = orgLevelGraph(extra, orgs);
    expect(out.edges).toHaveLength(1);
    expect(out.edges[0].trong_so).toBe(2); // e3 + e4
  });
});

describe("expandOrgGraph — Tầng 2 (bung QLBMT)", () => {
  it("giữ node hệ thống QLBMT, thu gọn tổ chức khác", () => {
    const out = expandOrgGraph(graph, orgs, "qlbmt");
    const ids = out.nodes.map((n) => n.id).sort();
    // vhf/vccs/ghiam giữ nguyên; acv gom thành super-node
    expect(ids).toEqual(["ghiam", "org:acv", "vccs", "vhf"]);
    // cạnh nội bộ QLBMT giữ lại (e1,e2) + 1 cạnh tới org:acv
    expect(out.edges).toHaveLength(3);
  });
});
