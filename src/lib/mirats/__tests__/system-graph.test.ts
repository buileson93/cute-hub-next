// ============================================================================
// Test LOGIC THUẦN cho liên kết hệ thống (system-graph.ts):
//   * buildSystemGraph: gom node duy nhất, dựng cạnh, màu/nét theo loại,
//     ưu tiên màu/nét từ danh mục nhưng fallback theo mã loại,
//   * phanTichTacDong: lan truyền theo LUONG_TIN_HIEU (+ hai chiều) và
//     PHU_THUOC_DICH_VU (đích -> nguồn), bỏ cạnh ngừng, không lặp vô hạn.
// PILOT VHF–VCCS được dùng làm ví dụ.
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  buildSystemGraph,
  phanTichTacDong,
  LOAI_LIEN_KET_MAU,
  LOAI_LIEN_KET_NET,
  type DoThiRow,
} from "../system-graph";

function row(
  p: Partial<DoThiRow> & Pick<DoThiRow, "id" | "nguon_id" | "dich_id" | "loai_ma">,
): DoThiRow {
  return {
    nguon_ten: p.nguon_id,
    nguon_nhom: null,
    nguon_don_vi: null,
    dich_ten: p.dich_id,
    dich_nhom: null,
    dich_don_vi: null,
    loai_lien_ket_id: "loai-" + p.loai_ma,
    loai_ten: null,
    mau_sac: null,
    kieu_net: null,
    lop: "logic",
    huong: "mot_chieu",
    vai_tro_du_phong: null,
    giao_dien_nguon: null,
    giao_dien_dich: null,
    giao_thuc: null,
    trang_thai: "hoat_dong",
    don_vi_id_snapshot: null,
    ...p,
  };
}

describe("buildSystemGraph", () => {
  it("gom node duy nhất từ hai đầu các cạnh", () => {
    const g = buildSystemGraph([
      row({ id: "e1", nguon_id: "VHF", dich_id: "VCCS", loai_ma: "LUONG_TIN_HIEU" }),
      row({ id: "e2", nguon_id: "VHF", dich_id: "VCCS", loai_ma: "DAU_NOI_VAT_LY" }),
    ]);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["VCCS", "VHF"]);
    expect(g.edges).toHaveLength(2);
  });

  it("dùng màu/nét từ danh mục khi có, fallback theo mã loại khi trống", () => {
    const g = buildSystemGraph([
      row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "PHU_THUOC_DICH_VU" }),
      row({
        id: "e2",
        nguon_id: "A",
        dich_id: "B",
        loai_ma: "LUONG_TIN_HIEU",
        mau_sac: "#ff0000",
        kieu_net: "dotted",
      }),
    ]);
    const e1 = g.edges.find((e) => e.id === "e1")!;
    const e2 = g.edges.find((e) => e.id === "e2")!;
    // fallback
    expect(e1.mau_sac).toBe(LOAI_LIEN_KET_MAU.PHU_THUOC_DICH_VU);
    expect(e1.kieu_net).toBe(LOAI_LIEN_KET_NET.PHU_THUOC_DICH_VU);
    // override từ danh mục
    expect(e2.mau_sac).toBe("#ff0000");
    expect(e2.kieu_net).toBe("dotted");
  });

  it("đánh dấu cạnh hai chiều", () => {
    const g = buildSystemGraph([
      row({
        id: "e1",
        nguon_id: "VHF",
        dich_id: "VCCS",
        loai_ma: "LUONG_TIN_HIEU",
        huong: "hai_chieu",
      }),
    ]);
    expect(g.edges[0].hai_chieu).toBe(true);
  });
});

describe("phanTichTacDong", () => {
  it("lan truyền LUONG_TIN_HIEU theo chiều nguồn -> đích", () => {
    const rows = [
      row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "LUONG_TIN_HIEU" }),
      row({ id: "e2", nguon_id: "B", dich_id: "C", loai_ma: "LUONG_TIN_HIEU" }),
    ];
    const kq = phanTichTacDong(rows, "A");
    expect(kq.map((r) => r.he_thong_id)).toEqual(["B", "C"]);
    expect(kq.find((r) => r.he_thong_id === "C")!.do_sau).toBe(2);
  });

  it("không lan truyền ngược cạnh một chiều", () => {
    const rows = [row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "LUONG_TIN_HIEU" })];
    expect(phanTichTacDong(rows, "B")).toHaveLength(0);
  });

  it("cạnh hai chiều lan truyền cả hai phía", () => {
    const rows = [
      row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "LUONG_TIN_HIEU", huong: "hai_chieu" }),
    ];
    expect(phanTichTacDong(rows, "B").map((r) => r.he_thong_id)).toEqual(["A"]);
  });

  it("PHU_THUOC_DICH_VU: đích ngừng thì nguồn bị ảnh hưởng", () => {
    // A phụ thuộc dịch vụ của B (nguồn=A, đích=B). B ngừng -> A ảnh hưởng.
    const rows = [row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "PHU_THUOC_DICH_VU" })];
    expect(phanTichTacDong(rows, "B").map((r) => r.he_thong_id)).toEqual(["A"]);
    expect(phanTichTacDong(rows, "A")).toHaveLength(0);
  });

  it("bỏ qua cạnh đã ngừng và không lặp vô hạn khi có chu trình", () => {
    const rows = [
      row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "LUONG_TIN_HIEU", huong: "hai_chieu" }),
      row({ id: "e2", nguon_id: "B", dich_id: "A", loai_ma: "LUONG_TIN_HIEU", huong: "hai_chieu" }),
      row({
        id: "e3",
        nguon_id: "A",
        dich_id: "Z",
        loai_ma: "LUONG_TIN_HIEU",
        trang_thai: "ngung",
      }),
    ];
    const kq = phanTichTacDong(rows, "A");
    expect(kq.map((r) => r.he_thong_id)).toEqual(["B"]); // Z bị loại (ngừng), không loop
  });

  it("DAU_NOI_VAT_LY và DU_PHONG không lan truyền tác động", () => {
    const rows = [
      row({ id: "e1", nguon_id: "A", dich_id: "B", loai_ma: "DAU_NOI_VAT_LY" }),
      row({ id: "e2", nguon_id: "A", dich_id: "C", loai_ma: "DU_PHONG" }),
    ];
    expect(phanTichTacDong(rows, "A")).toHaveLength(0);
  });
});

// ============================================================================
// Test mô hình CẠNH ĐỊNH HƯỚNG (mirror v_canh_dieu_huong + RPC mới):
//   hướng/lan-truyền khai ở danh mục; chặn chu trình; DU_PHONG không lan truyền.
// ============================================================================
import { sinhCanhDieuHuong, phanTichTacDongTheoCanh, type LienKetCanh } from "../system-graph";

function lk(
  p: Partial<LienKetCanh> & Pick<LienKetCanh, "lien_ket_id" | "nguon_id" | "dich_id" | "loai_ma">,
): LienKetCanh {
  return { co_huong: false, lan_truyen_tac_dong: true, ...p };
}

describe("sinhCanhDieuHuong", () => {
  it("cạnh hai chiều (co_huong=false) sinh đúng 2 dòng", () => {
    const canh = sinhCanhDieuHuong([
      lk({
        lien_ket_id: "l1",
        nguon_id: "VHF",
        dich_id: "VCCS",
        loai_ma: "LUONG_TIN_HIEU",
        co_huong: false,
      }),
    ]);
    expect(canh).toHaveLength(2);
    expect(canh.map((c) => `${c.tu}->${c.den}`).sort()).toEqual(["VCCS->VHF", "VHF->VCCS"]);
  });

  it("cạnh có hướng (co_huong=true) sinh đúng 1 dòng nguồn->đích", () => {
    const canh = sinhCanhDieuHuong([
      lk({
        lien_ket_id: "l1",
        nguon_id: "A",
        dich_id: "B",
        loai_ma: "PHU_THUOC_DICH_VU",
        co_huong: true,
      }),
    ]);
    expect(canh).toHaveLength(1);
    expect(`${canh[0].tu}->${canh[0].den}`).toBe("A->B");
  });
});

describe("phanTichTacDongTheoCanh", () => {
  it("đồ thị CÓ CHU TRÌNH VHF<->VCCS không lặp vô hạn, trả đúng tập bị ảnh hưởng", () => {
    const canh = sinhCanhDieuHuong([
      lk({
        lien_ket_id: "l1",
        nguon_id: "VHF",
        dich_id: "VCCS",
        loai_ma: "LUONG_TIN_HIEU",
        co_huong: false,
      }),
      lk({
        lien_ket_id: "l2",
        nguon_id: "VCCS",
        dich_id: "VHF",
        loai_ma: "LUONG_TIN_HIEU",
        co_huong: false,
      }),
    ]);
    const kq = phanTichTacDongTheoCanh(canh, "VHF");
    expect(kq.map((r) => r.he_thong_id)).toEqual(["VCCS"]);
    expect(kq[0].do_sau).toBe(1);
  });

  it("cạnh DU_PHONG (lan_truyen=false) không lan truyền", () => {
    const canh = sinhCanhDieuHuong([
      lk({
        lien_ket_id: "l1",
        nguon_id: "A",
        dich_id: "B",
        loai_ma: "DU_PHONG",
        co_huong: false,
        lan_truyen_tac_dong: false,
      }),
    ]);
    expect(phanTichTacDongTheoCanh(canh, "A")).toHaveLength(0);
  });

  it("lan truyền nhiều bậc và trả do_sau nhỏ nhất", () => {
    const canh = sinhCanhDieuHuong([
      lk({
        lien_ket_id: "l1",
        nguon_id: "A",
        dich_id: "B",
        loai_ma: "PHU_THUOC_DICH_VU",
        co_huong: true,
      }),
      lk({
        lien_ket_id: "l2",
        nguon_id: "B",
        dich_id: "C",
        loai_ma: "PHU_THUOC_DICH_VU",
        co_huong: true,
      }),
      lk({
        lien_ket_id: "l3",
        nguon_id: "A",
        dich_id: "C",
        loai_ma: "PHU_THUOC_DICH_VU",
        co_huong: true,
      }),
    ]);
    const kq = phanTichTacDongTheoCanh(canh, "A");
    expect(kq.find((r) => r.he_thong_id === "C")!.do_sau).toBe(1);
  });
});
