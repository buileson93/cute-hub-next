import { describe, it, expect } from "vitest";
import { findOrphans } from "../bao-tri-consistency";

describe("findOrphans", () => {
  it("phiếu HOAN_THANH không có biên bản tham chiếu ⇒ phieuThieuBienBan", () => {
    const r = findOrphans(
      [
        { id: "P1", trang_thai: "HOAN_THANH", thiet_bi_id: "TB1" },
        { id: "P2", trang_thai: "HOAN_THANH", thiet_bi_id: "TB2" },
      ],
      [{ id: "B1", cong_viec_id: "P2", thiet_bi_id: "TB2" }],
    );
    expect(r.phieuThieuBienBan).toEqual(["P1"]);
    expect(r.bienBanKhongThuocPhieu).toEqual([]);
  });

  it("biên bản cong_viec_id=null ⇒ bienBanKhongThuocPhieu", () => {
    const r = findOrphans(
      [{ id: "P1", trang_thai: "HOAN_THANH", thiet_bi_id: "TB1" }],
      [
        { id: "B1", cong_viec_id: "P1", thiet_bi_id: "TB1" },
        { id: "B2", cong_viec_id: null, thiet_bi_id: "TB1" },
      ],
    );
    expect(r.phieuThieuBienBan).toEqual([]);
    expect(r.bienBanKhongThuocPhieu).toEqual(["B2"]);
  });

  it("phiếu chưa HOAN_THANH thì không cần biên bản", () => {
    const r = findOrphans(
      [
        { id: "P1", trang_thai: "DANG_LAM", thiet_bi_id: "TB1" },
        { id: "P2", trang_thai: "MOI", thiet_bi_id: "TB2" },
      ],
      [],
    );
    expect(r.phieuThieuBienBan).toEqual([]);
    expect(r.bienBanKhongThuocPhieu).toEqual([]);
  });

  it("dữ liệu sạch ⇒ không có orphan", () => {
    const r = findOrphans(
      [{ id: "P1", trang_thai: "HOAN_THANH", thiet_bi_id: "TB1" }],
      [{ id: "B1", cong_viec_id: "P1", thiet_bi_id: "TB1" }],
    );
    expect(r).toEqual({ phieuThieuBienBan: [], bienBanKhongThuocPhieu: [] });
  });
});
