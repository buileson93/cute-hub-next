import { describe, it, expect } from "vitest";
import {
  canonicalPhanLoaiForHeThong,
  canonicalKeysForThietBi,
  findTaxonomyConflicts,
  type NhomRef,
  type HeThongRef,
} from "../taxonomy-invariant";

// ============================================================================
// Invariant: Phân loại → Nhóm hệ thống → Hệ thống → Tài sản.
// Test "cây chuẩn" (canonical) và các "tổ hợp FK sai" (conflict) — trước khi có
// trigger đồng bộ, dữ liệu lệch phải bị phát hiện; sau đồng bộ phải khớp cha.
// ============================================================================

// --- Cây chuẩn: PL_A ⊃ NH_1 ⊃ HT_1 ⊃ TB_1 ---
const PL_A = "pl-a";
const PL_B = "pl-b";
const NH_1: NhomRef = { id: "nh-1", phanLoaiId: PL_A };
const NH_2: NhomRef = { id: "nh-2", phanLoaiId: PL_B };
const nhomById = new Map([
  [NH_1.id, NH_1],
  [NH_2.id, NH_2],
]);

const HT_1: HeThongRef = { id: "ht-1", nhomId: NH_1.id, phanLoaiId: PL_A };

describe("canonicalPhanLoaiForHeThong", () => {
  it("cây chuẩn: hệ thống lấy phân loại theo nhóm cha", () => {
    expect(canonicalPhanLoaiForHeThong(HT_1, nhomById)).toBe(PL_A);
  });

  it("tổ hợp FK sai: hệ thống gán phân loại KHÁC nhóm cha → canonical vẫn theo nhóm", () => {
    const bad: HeThongRef = { id: "ht-x", nhomId: NH_1.id, phanLoaiId: PL_B };
    expect(canonicalPhanLoaiForHeThong(bad, nhomById)).toBe(PL_A);
  });

  it("legacy: chưa gán nhóm → giữ nguyên phân loại hiện có", () => {
    const legacy: HeThongRef = { id: "ht-l", nhomId: null, phanLoaiId: PL_B };
    expect(canonicalPhanLoaiForHeThong(legacy, nhomById)).toBe(PL_B);
  });
});

describe("canonicalKeysForThietBi", () => {
  const htById = new Map([[HT_1.id, HT_1]]);

  it("cây chuẩn: tài sản dẫn xuất nhóm + phân loại từ hệ thống cha", () => {
    const r = canonicalKeysForThietBi("ht-1", { nhomId: null, phanLoaiId: null }, htById, nhomById);
    expect(r).toEqual({ nhomId: NH_1.id, phanLoaiId: PL_A });
  });

  it("tổ hợp FK sai: tài sản gán nhóm/phân loại lệch hệ thống → canonical theo hệ thống", () => {
    const r = canonicalKeysForThietBi(
      "ht-1",
      { nhomId: NH_2.id, phanLoaiId: PL_B },
      htById,
      nhomById,
    );
    expect(r).toEqual({ nhomId: NH_1.id, phanLoaiId: PL_A });
  });

  it("legacy: chưa gán hệ thống → giữ nguyên khóa hiện có", () => {
    const r = canonicalKeysForThietBi(
      null,
      { nhomId: NH_2.id, phanLoaiId: PL_B },
      htById,
      nhomById,
    );
    expect(r).toEqual({ nhomId: NH_2.id, phanLoaiId: PL_B });
  });
});

describe("findTaxonomyConflicts", () => {
  it("cây chuẩn: không có mâu thuẫn", () => {
    const rep = findTaxonomyConflicts(
      [HT_1],
      [{ id: "tb-1", heThongId: "ht-1", nhomId: NH_1.id, phanLoaiId: PL_A }],
      nhomById,
    );
    expect(rep.total).toBe(0);
  });

  it("tổ hợp FK sai: phát hiện đủ 3 loại lệch", () => {
    const htBad: HeThongRef = { id: "ht-bad", nhomId: NH_1.id, phanLoaiId: PL_B }; // pl lệch nhóm
    const rep = findTaxonomyConflicts(
      [HT_1, htBad],
      [
        { id: "tb-nh", heThongId: "ht-1", nhomId: NH_2.id, phanLoaiId: PL_A }, // nhóm lệch hệ thống
        { id: "tb-pl", heThongId: "ht-1", nhomId: NH_1.id, phanLoaiId: PL_B }, // phân loại lệch hệ thống
      ],
      nhomById,
    );
    expect(rep.heThongPhanLoai).toEqual(["ht-bad"]);
    expect(rep.thietBiNhom).toEqual(["tb-nh"]);
    expect(rep.thietBiPhanLoai).toEqual(["tb-pl"]);
    expect(rep.total).toBe(3);
  });
});
