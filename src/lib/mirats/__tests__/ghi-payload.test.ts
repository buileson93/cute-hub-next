import { describe, it, expect } from "vitest";
import {
  buildSuCoPayload,
  buildBaoDuongPayload,
  buildHongHocPayload,
} from "@/lib/mirats/ghi-payload";

describe("buildSuCoPayload — form → payload cho RPC ghi_su_co_atomic(jsonb)", () => {
  it("map đầy đủ các trường + van_de_id khi có", () => {
    const p = buildSuCoPayload({
      ma_nhom_bc: "BC-XYZ",
      ngay_phat_hien: "2026-07-15",
      nguoi_bao_cao: "Nguyễn A",
      muc_do: "Cao",
      anh_huong_dhb: "Có gián đoạn ĐHB",
      hien_tuong: "Mất tín hiệu",
      nguyen_nhan: null,
      bien_phap_xu_ly: null,
      bao_cao_ban_dau: { tom_tat: "..." },
      van_de_id: "abc-123",
      devices: [
        { id: "d1", ma_thiet_bi: "TB_1", don_vi: "DAN", he_thong_id: "h1", he_thong_ten: "AWOS" },
      ],
      vat_tu: [{ vat_tu_id: "v1", kho_id: "k1", so_luong: 2 }],
    });
    expect(p.ma_nhom_bc).toBe("BC-XYZ");
    expect(p.van_de_id).toBe("abc-123");
    expect(p.devices).toHaveLength(1);
    expect((p.devices as unknown[])[0]).toMatchObject({
      id: "d1",
      ma_thiet_bi: "TB_1",
      he_thong_id: "h1",
    });
    expect(p.vat_tu).toEqual([{ vat_tu_id: "v1", kho_id: "k1", so_luong: 2 }]);
  });

  it("van_de_id rỗng → null (không gắn RCA)", () => {
    const p = buildSuCoPayload({
      ma_nhom_bc: "BC-1",
      ngay_phat_hien: "2026-07-15",
      nguoi_bao_cao: "A",
      muc_do: "Thấp",
      anh_huong_dhb: "Không",
      hien_tuong: "x",
      van_de_id: "   ",
      devices: [{ id: "d", ma_thiet_bi: "TB_A" }],
    });
    expect(p.van_de_id).toBeNull();
  });

  it("trang_thai mặc định 'Mới'", () => {
    const p = buildSuCoPayload({
      ma_nhom_bc: "BC-1",
      ngay_phat_hien: "2026-07-15",
      nguoi_bao_cao: "A",
      muc_do: "Thấp",
      anh_huong_dhb: "Không",
      hien_tuong: "x",
      devices: [{ id: "d", ma_thiet_bi: "TB" }],
    });
    expect(p.trang_thai).toBe("Mới");
  });
});

describe("buildBaoDuongPayload", () => {
  it("bao gồm submission + devices + item_results", () => {
    const p = buildBaoDuongPayload({
      submission: {
        template_id: "t1",
        template_code: "PL01",
        template_version: 1,
        template_snapshot: { ok: true },
        he_thong_id: "h1",
        tieu_de: "Bảo dưỡng AWOS",
        data: { a: 1 },
      },
      ma_base: "BD-1",
      he_thong_ten: "AWOS",
      loai_bao_tri: "Định kỳ",
      ngay_bat_dau: "2026-07-15",
      trang_thai: "Hoàn thành",
      nguoi_thuc_hien: "A, B",
      don_vi_thuc_hien: "KT",
      devices: [{ id: "d1", ma_thiet_bi: "TB_1", don_vi: "DAN" }],
      item_results: [{ item_code: "01", ket_qua: "dat", section_code: "S1" }],
    });
    expect((p.submission as { template_id: string }).template_id).toBe("t1");
    expect(p.devices as unknown[]).toHaveLength(1);
    expect((p.item_results as unknown[])[0]).toMatchObject({ item_code: "01", ket_qua: "dat" });
  });
});

describe("buildHongHocPayload", () => {
  it("bao gồm thiet_bi_hong_ids + su_co (text) + phuong_an", () => {
    const p = buildHongHocPayload({
      ma_hong_hoc: "HH-1",
      ngay_hong: "2026-07-15",
      mo_ta_hong_hoc: "Chết nguồn",
      phuong_an: "Thay thế",
      thiet_bi_hong_ids: ["tb-1"],
      thiet_bi_thay_the_id: "tb-2",
      he_thong_id: "h1",
      su_co: "SC-01",
      nguoi_thuc_hien: ["A"],
    });
    expect(p.thiet_bi_hong_ids).toEqual(["tb-1"]);
    expect(p.thiet_bi_thay_the_id).toBe("tb-2");
    expect(p.su_co).toBe("SC-01");
    expect(p.phuong_an).toBe("Thay thế");
    expect(p.trang_thai).toBe("Mới");
  });

  it("mặc định thay_the_id = null khi không có", () => {
    const p = buildHongHocPayload({
      ma_hong_hoc: "HH-1",
      ngay_hong: "2026-07-15",
      mo_ta_hong_hoc: "x",
      phuong_an: "Sửa chữa",
      thiet_bi_hong_ids: ["tb-1"],
    });
    expect(p.thiet_bi_thay_the_id).toBeNull();
  });
});
