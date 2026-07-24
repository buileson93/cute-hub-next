import { describe, it, expect } from "vitest";
import { buildSuCoInsert, type SuCoInsertForm, type SuCoDevice } from "@/lib/mirats/su-co-insert";

const dev = (over: Partial<SuCoDevice> = {}): SuCoDevice => ({
  id: "tb-1", ma_thiet_bi: "TB_00000001", don_vi: "DV1", _htId: "ht-1", _htTen: "AWOS", ...over,
});

const base = (over: Partial<SuCoInsertForm> = {}): SuCoInsertForm => ({
  ma_nhom_bc: "BC-XYZ",
  ngay_phat_hien: "2026-07-14T08:00",
  nguoi_bao_cao: "KTV A",
  muc_do: "Trung bình",
  anh_huong_dhb: "Không ảnh hưởng",
  hien_tuong: "Mất tín hiệu",
  nguyen_nhan: null,
  bien_phap_xu_ly: null,
  bao_cao_ban_dau: { nguon: "Người dùng" },
  selected: [dev()],
  ...over,
});

describe("buildSuCoInsert — gắn van_de_id vào payload", () => {
  it("không chọn Vấn đề → payload KHÔNG có key van_de_id", () => {
    const rows = buildSuCoInsert(base());
    expect(rows).toHaveLength(1);
    expect("van_de_id" in rows[0]).toBe(false);
  });

  it("van_de_id là chuỗi rỗng / whitespace → coi như không chọn", () => {
    for (const v of ["", "   ", null, undefined]) {
      const rows = buildSuCoInsert(base({ van_de_id: v as string | null | undefined }));
      expect("van_de_id" in rows[0]).toBe(false);
    }
  });

  it("chọn Vấn đề → mọi row đều có van_de_id giống nhau", () => {
    const rows = buildSuCoInsert(base({
      van_de_id: "vd-42",
      selected: [dev({ id: "a", ma_thiet_bi: "TB_A" }), dev({ id: "b", ma_thiet_bi: "TB_B" })],
    }));
    expect(rows).toHaveLength(2);
    expect(rows[0].van_de_id).toBe("vd-42");
    expect(rows[1].van_de_id).toBe("vd-42");
  });

  it("mã sự cố = ma_nhom_bc + số thứ tự 2 chữ số", () => {
    const rows = buildSuCoInsert(base({
      selected: [dev({ id: "a", ma_thiet_bi: "TB_A" }), dev({ id: "b", ma_thiet_bi: "TB_B" })],
    }));
    expect(rows.map((r) => r.ma_su_co)).toEqual(["BC-XYZ-01", "BC-XYZ-02"]);
  });

  it("snapshot đúng field cơ bản", () => {
    const rows = buildSuCoInsert(base());
    expect(rows[0]).toMatchObject({
      thiet_bi: "TB_00000001",
      thiet_bi_id: "tb-1",
      he_thong: "AWOS",
      he_thong_id: "ht-1",
      don_vi: "DV1",
      trang_thai: "Mới",
      ma_nhom_bc: "BC-XYZ",
    });
  });
});
