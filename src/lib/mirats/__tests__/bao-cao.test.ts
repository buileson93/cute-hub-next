import { describe, it, expect } from "vitest";
import {
  buildBaoCaoLyLichThietBi,
  buildBaoCaoBaoDuongKy,
  buildBaoCaoSapHetHan,
  soNgayConLai,
} from "@/lib/mirats/bao-cao/build";
import { xuatBaoCaoExcel } from "@/lib/mirats/bao-cao/excel";
import type { NguonBaoCao } from "@/lib/mirats/bao-cao/types";

const nguon: NguonBaoCao = {
  thiet_bi: [
    {
      id: "tb1",
      ma: "TB_00000001",
      ten: "Máy VHF",
      don_vi: "Đài ATC",
      he_thong: "VCS",
      ngay_dua_vao: "2024-01-01",
      ngay_kiem_ke_ke_tiep: "2026-08-15",
      trang_thai: "dang_hoat_dong",
    },
    {
      id: "tb2",
      ma: "TB_00000002",
      ten: "AWOS",
      ngay_kiem_ke_ke_tiep: "2027-01-01",
    },
  ],
  bao_tri: [
    {
      id: "b1",
      thiet_bi_id: "tb1",
      thiet_bi_ma: "TB_00000001",
      thiet_bi_ten: "Máy VHF",
      ngay_thuc_hien: "2026-06-01",
      ket_qua: "OK",
      trang_thai_duyet: "da_duyet",
      nguoi_thuc_hien: "KTV A",
    },
    {
      id: "b2",
      thiet_bi_id: "tb1",
      thiet_bi_ma: "TB_00000001",
      ngay_thuc_hien: "2026-07-01",
      trang_thai_duyet: "cho_duyet",
    },
    {
      id: "b3",
      thiet_bi_id: "tb2",
      thiet_bi_ma: "TB_00000002",
      ngay_thuc_hien: "2026-07-05",
      trang_thai_duyet: "da_duyet",
    },
  ],
  su_co: [
    { id: "s1", thiet_bi_id: "tb1", mo_ta: "Mất tín hiệu", thoi_diem: "2026-06-10", mtr_phut: 30, trang_thai: "hoan_thanh" },
  ],
  giay_phep: [
    { id: "g1", so_gp: "GP-01", ten_gp: "GP khai thác VHF", han_gp: "2026-08-01", he_thong: "VCS", don_vi: "Đài ATC" },
    { id: "g2", so_gp: "GP-02", ten_gp: "GP khai thác AWOS", han_gp: "2029-01-01", he_thong: "AWOS", don_vi: "MET" },
  ],
};

describe("soNgayConLai", () => {
  it("tính đúng ngày còn lại (mốc cố định)", () => {
    const moc = new Date("2026-07-14T00:00:00Z");
    expect(soNgayConLai("2026-07-14", moc)).toBe(0);
    expect(soNgayConLai("2026-08-13", moc)).toBe(30);
    expect(soNgayConLai("2026-07-13", moc)).toBe(-1);
    expect(soNgayConLai(null, moc)).toBeNull();
    expect(soNgayConLai("invalid", moc)).toBeNull();
  });
});

describe("buildBaoCaoLyLichThietBi", () => {
  it("gom bảng tài sản, bảo trì, sự cố theo mã", () => {
    const r = buildBaoCaoLyLichThietBi(nguon, { thietBiMa: "TB_00000001" });
    expect(r.meta.loai).toBe("ly_lich_thiet_bi");
    expect(r.bang).toHaveLength(3);
    const bt = r.bang.find((b) => b.ma === "bao_tri")!;
    expect(bt.hang).toHaveLength(2);
    const sc = r.bang.find((b) => b.ma === "su_co")!;
    expect(sc.hang).toHaveLength(1);
    expect(r.kpi?.find((k) => k.ma === "so_lan_bao_tri")?.gia_tri).toBe(2);
    expect(r.kpi?.find((k) => k.ma === "so_su_co")?.gia_tri).toBe(1);
  });
});

describe("buildBaoCaoBaoDuongKy", () => {
  it("lọc theo kỳ và tính tỷ lệ duyệt", () => {
    const r = buildBaoCaoBaoDuongKy(nguon, { tu: "2026-06-01", den: "2026-06-30" });
    const bang = r.bang[0];
    expect(bang.hang).toHaveLength(1);
    expect(bang.tom_tat?.thiet_bi_ma).toBe("TỔNG");
    expect(r.kpi?.find((k) => k.ma === "tong_luot")?.gia_tri).toBe(1);
    expect(r.kpi?.find((k) => k.ma === "da_duyet")?.gia_tri).toBe(1);
    expect(r.kpi?.find((k) => k.ma === "ty_le_duyet")?.gia_tri).toBe(100);
  });

  it("kỳ rộng ra: cả 3 lượt, 2 đã duyệt", () => {
    const r = buildBaoCaoBaoDuongKy(nguon, { tu: "2026-01-01", den: "2026-12-31" });
    expect(r.kpi?.find((k) => k.ma === "tong_luot")?.gia_tri).toBe(3);
    expect(r.kpi?.find((k) => k.ma === "da_duyet")?.gia_tri).toBe(2);
    expect(r.kpi?.find((k) => k.ma === "ty_le_duyet")?.gia_tri).toBe(67);
  });
});

describe("buildBaoCaoSapHetHan", () => {
  it("chỉ lấy giấy phép/kiểm kê trong ngưỡng ngày", () => {
    const moc = new Date("2026-07-14T00:00:00Z");
    const r = buildBaoCaoSapHetHan(nguon, { nguongNgay: 90, moc });
    const gp = r.bang.find((b) => b.ma === "giay_phep")!;
    // GP-01 hạn 2026-08-01 (18 ngày) → có; GP-02 hạn 2029 → loại
    expect(gp.hang).toHaveLength(1);
    expect(gp.hang[0].so_gp).toBe("GP-01");
    const kd = r.bang.find((b) => b.ma === "kiem_ke")!;
    // TB1 kiểm kê 2026-08-15 (32 ngày) → có; TB2 → loại
    expect(kd.hang).toHaveLength(1);
    expect(kd.hang[0].ma).toBe("TB_00000001");
    expect(r.kpi?.find((k) => k.ma === "so_gp")?.gia_tri).toBe(1);
  });

  it("giấy phép đã quá hạn không đưa vào (chỉ cảnh báo sắp hết)", () => {
    const moc = new Date("2027-01-01T00:00:00Z");
    const r = buildBaoCaoSapHetHan(nguon, { nguongNgay: 30, moc });
    const gp = r.bang.find((b) => b.ma === "giay_phep")!;
    expect(gp.hang).toHaveLength(0);
  });
});

describe("xuatBaoCaoExcel", () => {
  it("tạo buffer xlsx hợp lệ (PK signature)", () => {
    const r = buildBaoCaoLyLichThietBi(nguon, { thietBiMa: "TB_00000001" });
    const buf = xuatBaoCaoExcel(r);
    expect(buf.byteLength).toBeGreaterThan(100);
    // xlsx là zip → 2 byte đầu là 'PK'
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });
});
