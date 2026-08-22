import { describe, it, expect } from "vitest";
import { chuanHoaTen, resolveThietBiRefs } from "@/lib/mirats/master-data";

describe("chuanHoaTen", () => {
  it("hạ dấu, gộp khoảng trắng, lowercase", () => {
    expect(chuanHoaTen("  Nhà   Sản Xuất  ")).toBe("nha san xuat");
    expect(chuanHoaTen("ĐÀI KHÍ TƯỢNG")).toBe("dai khi tuong");
  });
  it("chuỗi rỗng / null-safe", () => {
    expect(chuanHoaTen("")).toBe("");
    expect(chuanHoaTen("   ")).toBe("");
  });
});

const nsx = [
  { id: "n1", ten: "Vaisala" },
  { id: "n2", ten: "Honeywell" },
];
const ncc = [{ id: "c1", ten: "Công ty ABC" }];
const model = [
  { id: "m1", ten: "AWOS-500" },
  { id: "m2", ten: "AWOS-500 " }, // trùng tên sau chuẩn hoá — ambiguous
];
const loai = [{ id: "l1", ten: "Máy đo gió" }];

describe("resolveThietBiRefs", () => {
  it("có text nhưng thiếu FK và match duy nhất → trả FK gợi ý", () => {
    const r = resolveThietBiRefs(
      { nha_san_xuat: "vaisala", nha_san_xuat_id: null },
      { nsx, ncc, model: [], loai },
    );
    expect(r.goiY.nha_san_xuat_id).toBe("n1");
    expect(r.lech).toBe(true);
  });

  it("text ≠ tên FK hiện tại → lech=true, không gợi ý ghi đè", () => {
    const r = resolveThietBiRefs(
      { nha_san_xuat: "Honeywell", nha_san_xuat_id: "n1" /* Vaisala */ },
      { nsx, ncc, model: [], loai },
    );
    expect(r.lech).toBe(true);
    expect(r.goiY.nha_san_xuat_id).toBeUndefined();
  });

  it("nhiều ứng viên cùng tên → không tự gán, vẫn báo lệch", () => {
    const r = resolveThietBiRefs({ model: "AWOS-500", model_id: null }, { nsx, ncc, model, loai });
    expect(r.goiY.model_id).toBeUndefined();
    expect(r.lech).toBe(true);
  });

  it("text và FK khớp hoàn toàn → không lệch", () => {
    const r = resolveThietBiRefs(
      { nha_san_xuat: "Vaisala", nha_san_xuat_id: "n1" },
      { nsx, ncc, model: [], loai },
    );
    expect(r.lech).toBe(false);
    expect(Object.keys(r.goiY)).toHaveLength(0);
  });

  it("alias 'loai' theo spec = phan_loai — vẫn resolve được", () => {
    const r = resolveThietBiRefs(
      { phan_loai: "máy đo gió", phan_loai_id: null },
      { nsx, ncc, model: [], loai },
    );
    expect(r.goiY.phan_loai_id).toBe("l1");
  });

  it("chuẩn hoá dấu + khoảng trắng khi match", () => {
    const r = resolveThietBiRefs(
      { nha_cung_cap: "  cong ty   abc ", nha_cung_cap_id: null },
      { nsx, ncc, model: [], loai },
    );
    expect(r.goiY.nha_cung_cap_id).toBe("c1");
  });
});
