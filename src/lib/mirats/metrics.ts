// ============================================================================
// metrics.ts — Hàm tính toán & định dạng THUẦN (không phụ thuộc dữ liệu mẫu).
//
// Task 1 (nền dữ liệu): tách các tiện ích tính toán/định dạng ra khỏi
// `data.ts` (module gom JSON demo) để mã production KHÔNG kéo dữ liệu mẫu vào
// bundle. Mọi hàm ở đây chỉ nhận dữ liệu qua tham số — không đọc collection
// toàn cục nào. Kết quả hiển thị giữ nguyên so với trước (tài sản thật trong
// CSDL không khớp mã demo nên phần sự cố/chi phí vốn đã bằng 0).
// ============================================================================

import type { ThietBi, GiayPhep, SuCo } from "./types";

// ---- Định dạng (Task 25: chuyển về format.ts, giữ re-export cho mã cũ) ----
import { fmtVND as _fmtVND, fmtDowntime as _fmtDowntime } from "./format";

/** @deprecated Task 25 — dùng `@/lib/mirats/format#fmtVND`. */
export function fmtVND(n: number | null | undefined) {
  return _fmtVND(n);
}

/** @deprecated Task 25 — dùng `@/lib/mirats/format#fmtDowntime`. */
export function fmtDowntime(mins: number | null | undefined) {
  return _fmtDowntime(mins);
}

// ---- Chỉ số sự cố (nhận danh sách qua tham số) ----
/**
 * @deprecated Dùng `mttr()` trong `@/lib/mirats/reliability` — thuật toán
 * chuẩn hoá downtime qua `incidentDowntimeMinutes`, trả `KpiResult` (có
 * `insufficient` khi rỗng thay vì 0). Chỉ giữ hàm này cho `demo-data.ts`
 * và mã cũ; route Sự cố / Dashboard đã chuyển sang reliability.ts.
 */
export function mttrPhut(list: SuCo[]) {
  const done = list.filter((s) => s.thoi_gian_gian_doan != null);
  if (!done.length) return 0;
  return Math.round(done.reduce((a, s) => a + (s.thoi_gian_gian_doan ?? 0), 0) / done.length);
}
/**
 * @deprecated Dùng `mtbf()` trong `@/lib/mirats/reliability` — sắp xếp theo
 * timestamp (không phải `localeCompare` chuỗi) và trả `KpiResult`.
 */
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

// ---- Vòng đời tài sản ----
// Task 12: delegate về `lifecycle.ts` — nguồn duy nhất, đồng bộ với view Postgres `v_tuoi_tho`.
import {
  phanTramTuoiTho as _phanTram,
  tuoiThoConLai as _conLai,
  namThayThe as _namThay,
} from "./lifecycle";

const MS_YEAR = 1000 * 60 * 60 * 24 * 365.25;
export function tuoiThietBi(t: ThietBi, today = new Date()) {
  const raw = t.ngay_dua_vao_su_dung || t.ngay_mua;
  if (!raw) return 0;
  const d = new Date(raw);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, (today.getTime() - ms) / MS_YEAR);
}
export function conBaoHanh(t: ThietBi, today = new Date()) {
  return !!t.han_bao_hanh && new Date(t.han_bao_hanh).getTime() >= today.getTime();
}
function _namKhaiThac(t: ThietBi) {
  return (t as unknown as { nam_dua_vao_khai_thac?: number | null }).nam_dua_vao_khai_thac ?? null;
}
function _namSanXuat(t: ThietBi) {
  return (t as unknown as { nam_san_xuat?: number | null }).nam_san_xuat ?? null;
}
/** @deprecated Dùng `phanTramTuoiTho` từ `@/lib/mirats/lifecycle`. */
export function phanTramVongDoi(t: ThietBi, today = new Date()) {
  const life = (t.tuoi_tho_thiet_ke_nam as number | null) ?? null;
  const pt = _phanTram(
    { namSanXuat: _namSanXuat(t), namKhaiThac: _namKhaiThac(t), tuoiThoThietKe: life },
    today,
  );
  if (pt != null) return pt;
  const fallback = t.tuoi_tho_thiet_ke_nam || 10;
  const age = tuoiThietBi(t, today);
  // Thiếu ngày sử dụng → trả 40 (trung tính, khớp diemTuoi≈60 của lifecycle.ts)
  // để tránh vừa NaN vừa "A giả" cho tài sản chưa khai đủ dữ liệu.
  if (!Number.isFinite(age) || age <= 0 || fallback <= 0) return 40;
  return Math.min(100, Math.max(0, Math.round((age / fallback) * 100)));
}

// ---- Health score (M9) ----
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

/**
 * Ngữ cảnh sự cố/chi phí 12 tháng cho một tài sản. Nếu không truyền, mặc
 * định 0 — dùng cho luồng hiển thị dựa trên CSDL (không lấy từ demo).
 */
export interface HealthContext {
  suCo12t?: number;
  downtime12t?: number; // phút
  chiPhiLuyKe?: number; // triệu VND
}

export function healthDetail(
  t: ThietBi,
  today = new Date(),
  ctx: HealthContext = {},
): HealthDetail {
  const ptVongDoi = phanTramVongDoi(t, today);
  const suCo12t = ctx.suCo12t ?? 0;
  const downtimeMin = ctx.downtime12t ?? 0;
  const downtimeH = downtimeMin / 60;
  const chiPhiLuyKe = ctx.chiPhiLuyKe ?? 0; // triệu VND
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

export function healthScore(t: ThietBi, today = new Date(), ctx: HealthContext = {}) {
  return healthDetail(t, today, ctx).score;
}

// Predict remaining useful life (years) — Task 12: delegate về lifecycle.ts.
/** @deprecated Dùng `tuoiThoConLai(namKhaiThac, tuoiThoThietKe)` từ `@/lib/mirats/lifecycle`. */
export function tuoiThoConLai(t: ThietBi, today = new Date(), _ctx: HealthContext = {}) {
  const life = (t.tuoi_tho_thiet_ke_nam as number | null) ?? null;
  const namKhai = _namKhaiThac(t);
  const pure = _conLai(namKhai, life, today);
  if (pure != null) return pure;
  // Fallback theo ngày để giữ backward-compat khi thiếu năm.
  const fallback = t.tuoi_tho_thiet_ke_nam || 10;
  return Math.max(0, Math.round((fallback - tuoiThietBi(t, today)) * 10) / 10);
}
/** @deprecated Dùng `namThayThe(namKhaiThac, tuoiThoThietKe)` từ `@/lib/mirats/lifecycle`. */
export function namThayThe(t: ThietBi, today = new Date(), ctx: HealthContext = {}) {
  const life = (t.tuoi_tho_thiet_ke_nam as number | null) ?? null;
  const pure = _namThay(_namKhaiThac(t), life);
  if (pure != null) return pure;
  return today.getFullYear() + Math.max(0, Math.ceil(tuoiThoConLai(t, today, ctx)));
}

// ---- Giấy phép ----
import { DEFAULT_NGAY_SAP_HET_HAN } from "./han-canh-bao";
export type LicenseStatus = "valid" | "expiring" | "expired" | "none";
export function licenseStatus(g: GiayPhep, today = new Date()): LicenseStatus {
  if (!g.ngayHetHan) return "none";
  const exp = new Date(g.ngayHetHan);
  const diff = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "expired";
  if (diff <= DEFAULT_NGAY_SAP_HET_HAN) return "expiring";
  return "valid";
}
