// ============================================================================
// Dữ liệu DEMO — CHỈ dùng cho dev / staging / test / fixture.
// Guard runtime: khi chạy production (import.meta.env.PROD === true và
// VITE_APP_ENV === "production"), việc import module này sẽ ném lỗi để tránh
// rò rỉ dữ liệu mẫu vào bundle prod. Cổng test tĩnh
// `no-demo-in-production.test.ts` đã chặn ở CI; guard này là lớp bảo vệ thứ hai.
// ============================================================================
if (
  typeof import.meta !== "undefined" &&
  (import.meta as unknown as { env?: Record<string, string | boolean> }).env?.PROD === true &&
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_ENV === "production"
) {
  throw new Error(
    "[mirats] demo-data.ts được import trong môi trường production — vi phạm quy ước tách demo/prod.",
  );
}

import donViRaw from "@/data/don_vi.json";
import nhomHeThongRaw from "@/data/nhom_he_thong.json";
import heThongRaw from "@/data/he_thong.json";
import loaiThietBiRaw from "@/data/loai_thiet_bi.json";
import nhaSanXuatRaw from "@/data/nha_san_xuat.json";
import viTriRaw from "@/data/vi_tri.json";
import nhanVienRaw from "@/data/nhan_vien.json";
import thietBiRaw from "@/data/thiet_bi.json";
import suKienRaw from "@/data/su_kien_thiet_bi.json";
import giayPhepRaw from "@/data/licenses.json";
import suCoRaw from "@/data/su_co.json";
import baoTriRaw from "@/data/bao_tri.json";
import baoTriHangMucRaw from "@/data/bao_tri_hang_muc.json";
import keHoachBaoTriRaw from "@/data/ke_hoach_bao_tri.json";
import vatTuRaw from "@/data/vat_tu.json";
import hongHocRaw from "@/data/hong_hoc_thay_the.json";
import banGiaoRaw from "@/data/ban_giao.json";
import xnkRaw from "@/data/xuat_nhap_kho.json";
import type {
  DonVi,
  NhomHeThong,
  HeThong,
  LoaiThietBi,
  NhaSanXuat,
  ViTri,
  NhanVien,
  ThietBi,
  SuKienThietBi,
  GiayPhep,
  SuCo,
  BaoTri,
  BaoTriHangMuc,
  KeHoachBaoTri,
  VatTu,
  HongHocThayThe,
  BanGiao,
  XuatNhapKho,
} from "./types";

export const donVi = donViRaw as DonVi[];
export const nhomHeThong = nhomHeThongRaw as NhomHeThong[];
export const heThong = heThongRaw as HeThong[];
export const loaiThietBi = loaiThietBiRaw as LoaiThietBi[];
export const nhaSanXuat = nhaSanXuatRaw as NhaSanXuat[];
export const viTri = viTriRaw as ViTri[];
export const nhanVien = nhanVienRaw as NhanVien[];
export const thietBi = thietBiRaw as ThietBi[];
export const suKien = suKienRaw as SuKienThietBi[];
export const giayPhep = giayPhepRaw as GiayPhep[];
export const suCo = suCoRaw as SuCo[];
export const baoTri = baoTriRaw as BaoTri[];
export const baoTriHangMuc = baoTriHangMucRaw as BaoTriHangMuc[];
export const keHoachBaoTri = keHoachBaoTriRaw as KeHoachBaoTri[];
export const vatTu = vatTuRaw as VatTu[];
export const hongHoc = hongHocRaw as HongHocThayThe[];
export const banGiao = banGiaoRaw as BanGiao[];
export const xnk = xnkRaw as XuatNhapKho[];
export const vatTuMap = new Map(vatTu.map((v) => [v.ma, v]));
export const hongHocMap = new Map(hongHoc.map((h) => [h.ma_hong_hoc, h]));
export const banGiaoMap = new Map(banGiao.map((b) => [b.ma_ban_giao, b]));

export function tonKhoHienTai(maVt: string) {
  return xnk.reduce((sum, t) => {
    if (t.vat_tu !== maVt) return sum;
    if (t.loai_giao_dich === "Nhập") return sum + t.so_luong;
    if (t.loai_giao_dich === "Xuất") return sum - t.so_luong;
    return sum + t.so_luong; // Kiểm kê điều chỉnh (delta)
  }, 0);
}
export function xnkByVatTu(ma: string) {
  return xnk.filter((t) => t.vat_tu === ma).sort((a, b) => b.ngay.localeCompare(a.ngay));
}

export function banGiaoByThietBi(ma: string) {
  return banGiao
    .filter((b) => b.thiet_bi === ma)
    .sort((a, b) => b.ngay_nhan.localeCompare(a.ngay_nhan));
}
export function currentHolder(ma: string) {
  return (
    banGiao
      .filter((b) => b.thiet_bi === ma && b.trang_thai === "Đang giữ")
      .sort((a, b) => b.ngay_nhan.localeCompare(a.ngay_nhan))[0] ?? null
  );
}

export function hongHocByThietBi(ma: string) {
  return hongHoc
    .filter((h) => h.thiet_bi_hong === ma || h.thiet_bi_thay_the === ma)
    .sort((a, b) => b.ngay_hong.localeCompare(a.ngay_hong));
}

export const donViMap = new Map(donVi.map((d) => [d.ma, d]));
export const nhomHeThongMap = new Map(nhomHeThong.map((n) => [n.ma, n]));
export const heThongMap = new Map(heThong.map((h) => [h.ma, h]));
export const loaiThietBiMap = new Map(loaiThietBi.map((l) => [l.ma, l]));
export const viTriMap = new Map(viTri.map((v) => [v.ma, v]));
export const thietBiMap = new Map(thietBi.map((t) => [t.ma_thiet_bi, t]));
export const nhanVienMap: Map<string, NhanVien> = new Map(nhanVien.map((n) => [n.ma_nhan_vien, n]));
export const suCoMap = new Map(suCo.map((s) => [s.ma_su_co, s]));
export const baoTriMap = new Map(baoTri.map((b) => [b.ma_bao_tri, b]));

export function baoTriByThietBi(ma: string) {
  return baoTri
    .filter((b) => b.thiet_bi === ma)
    .sort((a, b) => b.ngay_bat_dau.localeCompare(a.ngay_bat_dau));
}
export function hangMucByBaoTri(ma: string) {
  return baoTriHangMuc.filter((h) => h.bao_tri === ma);
}
/** @deprecated Task 25 — dùng `@/lib/mirats/format#fmtVND`. */
export { fmtVND } from "./format";

export function suCoByThietBi(ma: string) {
  return suCo
    .filter((s) => s.thiet_bi === ma)
    .sort((a, b) => b.ngay_phat_hien.localeCompare(a.ngay_phat_hien));
}
export function mttrPhut(list: SuCo[]) {
  const done = list.filter((s) => s.thoi_gian_gian_doan != null);
  if (!done.length) return 0;
  return Math.round(done.reduce((a, s) => a + (s.thoi_gian_gian_doan ?? 0), 0) / done.length);
}
export function mtbfNgay(list: SuCo[]) {
  if (list.length < 2) return null;
  const sorted = [...list].sort((a, b) => a.ngay_phat_hien.localeCompare(b.ngay_phat_hien));
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total +=
      (new Date(sorted[i].ngay_phat_hien).getTime() -
        new Date(sorted[i - 1].ngay_phat_hien).getTime()) /
      86400000;
  }
  return Math.round(total / (sorted.length - 1));
}
/** @deprecated Task 25 — dùng `@/lib/mirats/format#fmtDowntime`. */
export { fmtDowntime } from "./format";

export function giayPhepByThietBi(ma: string) {
  return giayPhep.filter((g) => g.thietBi === ma);
}
export function suKienByThietBi(ma: string) {
  return suKien
    .filter((s) => s.thiet_bi === ma)
    .sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? ""));
}

export function childrenOfThietBi(ma: string) {
  return thietBi.filter((t) => t.thiet_bi_cha === ma);
}
export function eventsBySource(ma: string, nguon: string) {
  return suKien
    .filter((e) => e.thiet_bi === ma && e.nguon === nguon)
    .sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? ""));
}

const MS_YEAR = 1000 * 60 * 60 * 24 * 365.25;
export function tuoiThietBi(t: ThietBi, today = new Date()) {
  const d = new Date(t.ngay_dua_vao_su_dung || t.ngay_mua);
  return Math.max(0, (today.getTime() - d.getTime()) / MS_YEAR);
}
export function conBaoHanh(t: ThietBi, today = new Date()) {
  return !!t.han_bao_hanh && new Date(t.han_bao_hanh).getTime() >= today.getTime();
}
export function phanTramVongDoi(t: ThietBi, today = new Date()) {
  const life = t.tuoi_tho_thiet_ke_nam || 10;
  return Math.min(100, Math.round((tuoiThietBi(t, today) / life) * 100));
}
export function soSuCo12Thang(ma: string, today = new Date()) {
  const cutoff = new Date(today.getTime() - 365 * 86400000).toISOString().slice(0, 10);
  return suKien.filter((e) => e.thiet_bi === ma && e.nguon === "su_co" && (e.ngay ?? "") >= cutoff)
    .length;
}
export function chiPhiBaoTriLuyKe(ma: string) {
  // Parse "X triệu đồng" from event descriptions
  const re = /(\d+(?:[.,]\d+)?)\s*triệu/i;
  return suKien
    .filter((e) => e.thiet_bi === ma && (e.nguon === "bao_tri" || e.nguon === "hong_hoc_thay_the"))
    .reduce((sum, e) => {
      const m = (e.mo_ta ?? "").match(re);
      return sum + (m ? parseFloat(m[1].replace(",", ".")) : 0);
    }, 0);
}
export function healthScore(t: ThietBi, today = new Date()) {
  return healthDetail(t, today).score;
}

// M9 — Weighted health score per module spec
export type HealthDetail = {
  score: number;
  xepLoai: "A" | "B" | "C" | "D";
  khuyenNghi: string;
  diemTuoi: number;
  diemSuCo: number;
  diemDowntime: number;
  diemChiPhi: number;
  diemBaoHanh: number;
  diemTinhTrang: number;
  ptVongDoi: number;
  suCo12t: number;
  downtime12t: number;
  chiPhiLuyKe: number; // triệu VND
  tyLeChiPhi: number; // %
};
export function downtime12Thang(ma: string, today = new Date()) {
  const cutoff = new Date(today.getTime() - 365 * 86400000).toISOString().slice(0, 10);
  return suCo
    .filter((s) => s.thiet_bi === ma && s.ngay_phat_hien >= cutoff && s.thoi_gian_gian_doan)
    .reduce((sum, s) => sum + (s.thoi_gian_gian_doan ?? 0), 0);
}
export function healthDetail(t: ThietBi, today = new Date()): HealthDetail {
  const ptVongDoi = phanTramVongDoi(t, today);
  const suCo12t = soSuCo12Thang(t.ma_thiet_bi, today);
  const downtimeMin = downtime12Thang(t.ma_thiet_bi, today);
  const downtimeH = downtimeMin / 60;
  const chiPhiLuyKe = chiPhiBaoTriLuyKe(t.ma_thiet_bi); // triệu VND
  const giaTriMuaTrieu = (t.gia_tri_mua ?? 0) / 1_000_000;
  const tyLeChiPhi = giaTriMuaTrieu > 0 ? (chiPhiLuyKe / giaTriMuaTrieu) * 100 : 0;

  const diemTuoi = Math.max(0, Math.min(100, 100 - ptVongDoi));
  const diemSuCo = Math.max(0, 100 - suCo12t * 20);
  const diemDowntime = Math.max(0, 100 - downtimeH * 2); // 50h → 0
  const diemChiPhi = Math.max(0, 100 - tyLeChiPhi * 2); // 50% → 0
  const diemBaoHanh = conBaoHanh(t, today) ? 100 : 0;
  const diemTinhTrang =
    { Tốt: 100, Khá: 75, "Trung bình": 50, Kém: 25 }[t.tinh_trang_ky_thuat] ?? 60;

  let score = Math.round(
    0.3 * diemTuoi +
      0.25 * diemSuCo +
      0.15 * diemDowntime +
      0.15 * diemChiPhi +
      0.05 * diemBaoHanh +
      0.1 * diemTinhTrang,
  );
  if (t.trang_thai === "Chờ thanh lý" || t.trang_thai === "Đã thanh lý")
    score = Math.min(score, 20);
  if (t.trang_thai === "Đang sửa chữa") score = Math.max(0, score - 10);
  score = Math.max(0, Math.min(100, score));

  let xepLoai: HealthDetail["xepLoai"];
  let khuyenNghi: string;
  if (score >= 80) {
    xepLoai = "A";
    khuyenNghi = "Tiếp tục sử dụng";
  } else if (score >= 60) {
    xepLoai = "B";
    khuyenNghi = "Theo dõi, BT bình thường";
  } else if (score >= 40) {
    xepLoai = "C";
    khuyenNghi = "Tăng cường BT, lên kế hoạch thay";
  } else {
    xepLoai = "D";
    khuyenNghi = "Ưu tiên thay thế/nâng cấp";
  }

  return {
    score,
    xepLoai,
    khuyenNghi,
    diemTuoi,
    diemSuCo,
    diemDowntime,
    diemChiPhi,
    diemBaoHanh,
    diemTinhTrang,
    ptVongDoi,
    suCo12t,
    downtime12t: downtimeMin,
    chiPhiLuyKe,
    tyLeChiPhi,
  };
}
// Predict remaining useful life (years) — simple heuristic from health & lifecycle
export function tuoiThoConLai(t: ThietBi, today = new Date()) {
  const life = t.tuoi_tho_thiet_ke_nam || 10;
  const age = tuoiThietBi(t, today);
  const remaining = Math.max(0, life - age);
  const h = healthDetail(t, today).score;
  const factor = h >= 80 ? 1 : h >= 60 ? 0.85 : h >= 40 ? 0.55 : 0.2;
  return Math.round(remaining * factor * 10) / 10;
}
// Year in which the device should be replaced
export function namThayThe(t: ThietBi, today = new Date()) {
  const y = today.getFullYear() + Math.max(0, Math.ceil(tuoiThoConLai(t, today)));
  return y;
}

export type LicenseStatus = "valid" | "expiring" | "expired" | "none";
export function licenseStatus(g: GiayPhep, today = new Date()): LicenseStatus {
  if (!g.ngayHetHan) return "none";
  const exp = new Date(g.ngayHetHan);
  const diff = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "expired";
  if (diff <= 90) return "expiring";
  return "valid";
}
