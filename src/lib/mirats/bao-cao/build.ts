// ============================================================================
// bao-cao/build.ts — Hàm THUẦN để dựng cấu trúc BaoCaoData từ dữ liệu thô.
// Không I/O; test được bằng vitest.
// ============================================================================

import type { BaoCaoData, NguonBaoCao, BaoCaoBang } from "./types";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";

const nowIso = () => new Date().toISOString();

/** Số ngày còn lại tới mốc `ngay` (âm nếu đã qua). */
export function soNgayConLai(ngay: string | null | undefined, moc: Date = new Date()): number | null {
  if (!ngay) return null;
  const d = new Date(ngay);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - moc.getTime();
  return Math.ceil(ms / 86_400_000);
}

// ---------- 1) Lý lịch tài sản ----------
export function buildBaoCaoLyLichThietBi(nguon: NguonBaoCao, opts?: { thietBiMa?: string; donVi?: string }): BaoCaoData {
  const tb = (nguon.thiet_bi ?? []).find(
    (x) => !opts?.thietBiMa || x.ma === opts.thietBiMa || x.id === opts.thietBiMa,
  );
  const tbId = tb?.id ?? opts?.thietBiMa ?? "";
  const bt = (nguon.bao_tri ?? []).filter((x) => x.thiet_bi_id === tbId || x.thiet_bi_ma === tb?.ma);
  const sc = (nguon.su_co ?? []).filter((x) => x.thiet_bi_id === tbId || x.thiet_bi_ma === tb?.ma);

  const bangTB: BaoCaoBang = {
    ma: "thong_tin",
    ten: "Thông tin tài sản",
    cot: [
      { key: "truong", nhan: "Trường" },
      { key: "gia_tri", nhan: "Giá trị" },
    ],
    hang: [
      { truong: "Mã", gia_tri: tb?.ma ?? "" },
      { truong: "Tên", gia_tri: tb?.ten ?? "" },
      { truong: "Đơn vị", gia_tri: tb?.don_vi ?? "" },
      { truong: "Hệ thống", gia_tri: tb?.he_thong ?? "" },
      { truong: "Ngày đưa vào", gia_tri: tb?.ngay_dua_vao ?? "" },
      { truong: "Trạng thái", gia_tri: tb?.trang_thai ?? "" },
    ],
  };

  const bangBT: BaoCaoBang = {
    ma: "bao_tri",
    ten: "Lịch sử bảo dưỡng",
    cot: [
      { key: "ngay_thuc_hien", nhan: "Ngày thực hiện", kieu: "ngay" },
      { key: "ket_qua", nhan: "Kết quả" },
      { key: "nguoi_thuc_hien", nhan: "Người thực hiện" },
      { key: "ngay_ke_tiep", nhan: "Kỳ kế tiếp", kieu: "ngay" },
      { key: "trang_thai_duyet", nhan: "Duyệt", kieu: "trang_thai" },
    ],
    hang: bt.map((x) => ({
      ngay_thuc_hien: x.ngay_thuc_hien ?? "",
      ket_qua: x.ket_qua ?? "",
      nguoi_thuc_hien: x.nguoi_thuc_hien ?? "",
      ngay_ke_tiep: x.ngay_ke_tiep ?? "",
      trang_thai_duyet: x.trang_thai_duyet ?? "",
    })),
  };

  const bangSC: BaoCaoBang = {
    ma: "su_co",
    ten: "Lịch sử sự cố",
    cot: [
      { key: "thoi_diem", nhan: "Thời điểm", kieu: "ngay" },
      { key: "mo_ta", nhan: "Mô tả" },
      { key: "mtr_phut", nhan: "MTTR (phút)", kieu: "so" },
      { key: "trang_thai", nhan: "Trạng thái", kieu: "trang_thai" },
    ],
    hang: sc.map((x) => ({
      thoi_diem: x.thoi_diem ?? "",
      mo_ta: x.mo_ta ?? "",
      mtr_phut: x.mtr_phut ?? 0,
      trang_thai: x.trang_thai ?? "",
    })),
  };

  return {
    meta: {
      loai: "ly_lich_thiet_bi",
      tieu_de: `Lý lịch tài sản ${tb?.ma ?? ""}`.trim(),
      tao_luc: nowIso(),
      don_vi: tb?.don_vi ?? null,
    },
    bang: [bangTB, bangBT, bangSC],
    kpi: [
      { ma: "so_lan_bao_tri", nhan: "Số lần bảo dưỡng", gia_tri: bt.length },
      { ma: "so_su_co", nhan: "Số sự cố", gia_tri: sc.length },
    ],
  };
}

// ---------- 2) Bảo dưỡng theo kỳ ----------
export function buildBaoCaoBaoDuongKy(
  nguon: NguonBaoCao,
  opts: { tu: string; den: string; donVi?: string },
): BaoCaoData {
  const tu = new Date(opts.tu).getTime();
  const den = new Date(opts.den).getTime();
  const rows = (nguon.bao_tri ?? []).filter((x) => {
    if (!x.ngay_thuc_hien) return false;
    const t = new Date(x.ngay_thuc_hien).getTime();
    return t >= tu && t <= den;
  });

  const daDuyet = rows.filter((x) => x.trang_thai_duyet === "da_duyet").length;
  const bang: BaoCaoBang = {
    ma: "bao_duong",
    ten: `Bảo dưỡng ${opts.tu} → ${opts.den}`,
    cot: [
      { key: "thiet_bi_ma", nhan: "Mã tài sản" },
      { key: "thiet_bi_ten", nhan: "Tên tài sản" },
      { key: "ngay_thuc_hien", nhan: "Ngày thực hiện", kieu: "ngay" },
      { key: "ket_qua", nhan: "Kết quả" },
      { key: "nguoi_thuc_hien", nhan: "Người thực hiện" },
      { key: "trang_thai_duyet", nhan: "Duyệt", kieu: "trang_thai" },
    ],
    hang: rows.map((x) => ({
      thiet_bi_ma: x.thiet_bi_ma ?? "",
      thiet_bi_ten: x.thiet_bi_ten ?? "",
      ngay_thuc_hien: x.ngay_thuc_hien ?? "",
      ket_qua: x.ket_qua ?? "",
      nguoi_thuc_hien: x.nguoi_thuc_hien ?? "",
      trang_thai_duyet: x.trang_thai_duyet ?? "",
    })),
    tom_tat: { thiet_bi_ma: "TỔNG", thiet_bi_ten: `${rows.length} lượt`, ket_qua: `${daDuyet} đã duyệt` },
  };

  return {
    meta: {
      loai: "bao_duong_ky",
      tieu_de: `Báo cáo bảo dưỡng kỳ ${opts.tu} → ${opts.den}`,
      tao_luc: nowIso(),
      ky_bat_dau: opts.tu,
      ky_ket_thuc: opts.den,
      don_vi: opts.donVi ?? null,
    },
    bang: [bang],
    kpi: [
      { ma: "tong_luot", nhan: "Tổng lượt bảo dưỡng", gia_tri: rows.length },
      { ma: "da_duyet", nhan: "Đã duyệt", gia_tri: daDuyet },
      { ma: "ty_le_duyet", nhan: "Tỷ lệ duyệt (%)", gia_tri: rows.length ? Math.round((daDuyet / rows.length) * 100) : 0 },
    ],
  };
}

// ---------- 3) Sắp hết hạn (giấy phép + kiểm định) ----------
export function buildBaoCaoSapHetHan(
  nguon: NguonBaoCao,
  opts?: { nguongNgay?: number; moc?: Date },
): BaoCaoData {
  const nguong = opts?.nguongNgay ?? DEFAULT_NGAY_SAP_HET_HAN;
  const moc = opts?.moc ?? new Date();

  const gp = (nguon.giay_phep ?? [])
    .map((x) => ({ ...x, con_lai: soNgayConLai(x.han_gp ?? null, moc) }))
    .filter((x) => x.con_lai !== null && x.con_lai >= 0 && x.con_lai <= nguong)
    .sort((a, b) => (a.con_lai! - b.con_lai!));

  const tb = (nguon.thiet_bi ?? [])
    .map((x) => ({ ...x, con_lai: soNgayConLai(x.ngay_kiem_ke_ke_tiep ?? null, moc) }))
    .filter((x) => x.con_lai !== null && x.con_lai >= 0 && x.con_lai <= nguong)
    .sort((a, b) => (a.con_lai! - b.con_lai!));

  const bangGP: BaoCaoBang = {
    ma: "giay_phep",
    ten: "Giấy phép sắp hết hạn",
    cot: [
      { key: "so_gp", nhan: "Số GP" },
      { key: "ten_gp", nhan: "Tên GP" },
      { key: "he_thong", nhan: "Hệ thống" },
      { key: "don_vi", nhan: "Đơn vị" },
      { key: "han_gp", nhan: "Hạn", kieu: "ngay" },
      { key: "con_lai", nhan: "Còn (ngày)", kieu: "so" },
    ],
    hang: gp.map((x) => ({
      so_gp: x.so_gp ?? "",
      ten_gp: x.ten_gp ?? "",
      he_thong: x.he_thong ?? "",
      don_vi: x.don_vi ?? "",
      han_gp: x.han_gp ?? "",
      con_lai: x.con_lai,
    })),
  };

  const bangKD: BaoCaoBang = {
    ma: "kiem_ke",
    ten: "Kiểm kê/kiểm định sắp tới",
    cot: [
      { key: "ma", nhan: "Mã TB" },
      { key: "ten", nhan: "Tên TB" },
      { key: "don_vi", nhan: "Đơn vị" },
      { key: "ngay_kiem_ke_ke_tiep", nhan: "Ngày kế tiếp", kieu: "ngay" },
      { key: "con_lai", nhan: "Còn (ngày)", kieu: "so" },
    ],
    hang: tb.map((x) => ({
      ma: x.ma,
      ten: x.ten,
      don_vi: x.don_vi ?? "",
      ngay_kiem_ke_ke_tiep: x.ngay_kiem_ke_ke_tiep ?? "",
      con_lai: x.con_lai,
    })),
  };

  return {
    meta: {
      loai: "sap_het_han",
      tieu_de: `Báo cáo sắp hết hạn (≤ ${nguong} ngày)`,
      tao_luc: nowIso(),
    },
    bang: [bangGP, bangKD],
    kpi: [
      { ma: "so_gp", nhan: "Số giấy phép sắp hết hạn", gia_tri: gp.length },
      { ma: "so_kd", nhan: "Số kiểm kê sắp đến", gia_tri: tb.length },
    ],
  };
}
