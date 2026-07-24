import { describe, it, expect } from "vitest";
import {
  buildAdjacency,
  degree,
  neighborsWithin,
  highlightNeighbors,
  egoGraph,
  filterGraph,
  chipHslTheoKhoa,
  type CoreGraph,
} from "../graph-core";

// Đồ thị mẫu:  A - B - C - D ,  A - E (E lẻ),  B <-> C hai chiều
function sample(): CoreGraph {
  return {
    nodes: [
      { id: "A", ten: "A", don_vi: "DV1" },
      { id: "B", ten: "B", don_vi: "DV1" },
      { id: "C", ten: "C", don_vi: "DV2" },
      { id: "D", ten: "D", don_vi: "DV2" },
      { id: "E", ten: "E", don_vi: "DV3", ben_ngoai: true, to_chuc: "Org" },
    ],
    edges: [
      { id: "e1", nguon: "A", dich: "B", loai: "CAP_QUANG", lop: "vat_ly", huong: "mot_chieu", trang_thai: "hoat_dong", co_huong: true },
      { id: "e2", nguon: "B", dich: "C", loai: "LUONG_TIN_HIEU", lop: "logic", huong: "hai_chieu", trang_thai: "hoat_dong", hai_chieu: true },
      { id: "e3", nguon: "C", dich: "D", loai: "CAP_QUANG", lop: "vat_ly", huong: "mot_chieu", trang_thai: "ngung", co_huong: true },
      { id: "e4", nguon: "A", dich: "E", loai: "CAP_QUANG", lop: "vat_ly", huong: "mot_chieu", trang_thai: "hoat_dong", co_huong: true },
    ],
  };
}

describe("buildAdjacency", () => {
  it("dựng kề vô hướng đúng", () => {
    const adj = buildAdjacency(sample());
    expect([...adj.neighbors.get("A")!].sort()).toEqual(["B", "E"]);
    expect([...adj.neighbors.get("B")!].sort()).toEqual(["A", "C"]);
    expect(degree(adj, "A")).toBe(2);
    expect(degree(adj, "D")).toBe(1);
  });

  it("kề có hướng theo huong/co_huong", () => {
    const adj = buildAdjacency(sample());
    // e1 A->B một chiều: A tới B, B KHÔNG tới A qua e1
    expect(adj.outAdj.get("A")!.has("B")).toBe(true);
    expect(adj.outAdj.get("B")!.has("A")).toBe(false);
    // e2 B<->C hai chiều
    expect(adj.outAdj.get("B")!.has("C")).toBe(true);
    expect(adj.outAdj.get("C")!.has("B")).toBe(true);
  });

  it("bỏ qua cạnh trỏ tới node không tồn tại", () => {
    const g: CoreGraph = {
      nodes: [{ id: "A", ten: "A" }],
      edges: [{ id: "x", nguon: "A", dich: "Z", loai: "X", lop: "vat_ly", huong: "mot_chieu", trang_thai: "hoat_dong" }],
    };
    const adj = buildAdjacency(g);
    expect(adj.neighbors.get("A")!.size).toBe(0);
  });
});

describe("neighborsWithin", () => {
  it("BFS trả khoảng cách theo bậc", () => {
    const adj = buildAdjacency(sample());
    const d = neighborsWithin(adj, "A", 2);
    expect(d.get("A")).toBe(0);
    expect(d.get("B")).toBe(1);
    expect(d.get("E")).toBe(1);
    expect(d.get("C")).toBe(2);
    expect(d.has("D")).toBe(false); // ngoài bán kính 2
  });

  it("radius 0 chỉ trả chính node", () => {
    const adj = buildAdjacency(sample());
    const d = neighborsWithin(adj, "A", 0);
    expect([...d.keys()]).toEqual(["A"]);
  });

  it("node không tồn tại trả rỗng", () => {
    const adj = buildAdjacency(sample());
    expect(neighborsWithin(adj, "ZZ", 3).size).toBe(0);
  });
});

describe("highlightNeighbors", () => {
  it("tô sáng hàng xóm bậc 1 + cạnh giữa chúng", () => {
    const h = highlightNeighbors(sample(), "B", 1);
    expect([...h.nodes].sort()).toEqual(["A", "B", "C"]);
    // e1 (A-B) và e2 (B-C) sáng; e3 (C-D) và e4 (A-E) không
    expect(h.edges.has("e1")).toBe(true);
    expect(h.edges.has("e2")).toBe(true);
    expect(h.edges.has("e3")).toBe(false);
    expect(h.edges.has("e4")).toBe(false);
  });
});

describe("egoGraph", () => {
  it("trích đồ thị con bán kính N", () => {
    const ego = egoGraph(sample(), "B", 1);
    expect(ego.nodes.map((n) => n.id).sort()).toEqual(["A", "B", "C"]);
    expect(ego.edges.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });
});

describe("filterGraph", () => {
  it("lọc theo lớp", () => {
    const g = filterGraph(sample(), { lop: ["logic"] });
    expect(g.edges.map((e) => e.id)).toEqual(["e2"]);
  });

  it("lọc theo loại", () => {
    const g = filterGraph(sample(), { loai: ["CAP_QUANG"] });
    expect(g.edges.map((e) => e.id).sort()).toEqual(["e1", "e3", "e4"]);
  });

  it("ẩn liên kết ngung", () => {
    const g = filterGraph(sample(), { hideNgung: true });
    expect(g.edges.find((e) => e.id === "e3")).toBeUndefined();
  });

  it("dropOrphans loại node không còn cạnh", () => {
    const g = filterGraph(sample(), { lop: ["logic"], dropOrphans: true });
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["B", "C"]);
  });
});

describe("chipHslTheoKhoa", () => {
  it("cùng khóa cùng màu, khác khóa thường khác màu", () => {
    expect(chipHslTheoKhoa("DV1")).toBe(chipHslTheoKhoa("DV1"));
    expect(chipHslTheoKhoa("DV1")).not.toBe(chipHslTheoKhoa("DV2"));
    expect(chipHslTheoKhoa(null)).toBeNull();
  });
});
