// ============================================================================
// Task 27 — Display Registry: NGUỒN DUY NHẤT mô tả cách hiển thị 8 thực thể
// chính (thiet_bi / su_co / van_de / cong_viec / hong_hoc / ban_giao /
// giay_phep / vat_tu). Hover popup, sidebar, header chi tiết đều import
// từ đây → đảm bảo đồng nhất, không lệch nhau.
//
// Registry thuần (không React, không Supabase). Dùng format.ts (Task 25) +
// labelOf từ trang-thai.ts (Task 1) + ngưỡng cảnh báo từ han-canh-bao.ts
// (Task 13) khi render.
// ============================================================================

import {
  fmtVND, fmtSo, fmtNgay, fmtNgayGio, KHONG_CO,
} from "@/lib/mirats/format";
import { labelOf, normalizeLegacy } from "@/lib/mirats/trang-thai";
import { DEFAULT_NGAY_SAP_HET_HAN, nguongCho } from "@/lib/mirats/han-canh-bao";
import type {
  EntityLoai, EntityView, FieldView, RenderedField,
} from "@/lib/mirats/display/types";

// ---------- Helpers ---------------------------------------------------------

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}
function nonEmpty(v: unknown): string {
  const s = str(v).trim();
  return s || KHONG_CO;
}
function joinNonEmpty(parts: Array<string | null | undefined>, sep = " · "): string {
  const xs = parts.map((p) => str(p).trim()).filter(Boolean);
  return xs.length ? xs.join(sep) : KHONG_CO;
}

/** Số ngày từ hôm nay đến `iso` (dương = còn lại; âm = quá hạn). Null khi rỗng. */
export function soNgayDenHan(iso: unknown): number | null {
  const s = str(iso).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

// ---------- Registry -------------------------------------------------------

const R: Record<EntityLoai, EntityView> = {
  thiet_bi: {
    ten: "Tài sản",
    tieuDe: (r) => nonEmpty(r.ten_thiet_bi),
    phu: (r) => joinNonEmpty([str(r.ma_thiet_bi), str(r.ma_serial)]),
    highlight: [
      { key: "ma_thiet_bi", nhan: "Mã tài sản", loai: "text", highlight: true },
      { key: "ma_serial", nhan: "Số serial", loai: "text", highlight: true },
      { key: "model", nhan: "Model", loai: "text" },
      { key: "vi_tri", nhan: "Vị trí", loai: "text" },
    ],
    chiTiet: [
      { key: "ma_thiet_bi", nhan: "Mã tài sản", loai: "text", highlight: true },
      { key: "ten_thiet_bi", nhan: "Tên tài sản", loai: "text", highlight: true },
      { key: "ma_serial", nhan: "Serial", loai: "text" },
      { key: "model", nhan: "Model", loai: "text" },
      { key: "nha_san_xuat", nhan: "Nhà sản xuất", loai: "text" },
      { key: "nam_san_xuat", nhan: "Năm sản xuất", loai: "so" },
      { key: "nam_dua_vao_khai_thac", nhan: "Năm khai thác", loai: "so" },
      { key: "ngay_mua", nhan: "Ngày mua", loai: "date" },
      { key: "han_bao_hanh", nhan: "Bảo hành đến", loai: "expiring" },
      { key: "ngay_bao_tri_ke_tiep", nhan: "Bảo dưỡng kế tiếp", loai: "expiring" },
      { key: "ngay_kiem_ke_ke_tiep", nhan: "Kiểm kê kế tiếp", loai: "expiring" },
      { key: "che_do_kd_hc", nhan: "Chế độ KĐ/HC", loai: "text" },
      { key: "vi_tri", nhan: "Vị trí", loai: "text" },
    ],
  },

  su_co: {
    ten: "Sự cố",
    tieuDe: (r) => nonEmpty(r.hien_tuong ?? r.ma_su_co),
    phu: (r) => joinNonEmpty([str(r.ma_su_co), str(r.snapshot_ma_thiet_bi ?? r.thiet_bi)]),
    badgeTrangThai: { domain: "su_co", key: "trang_thai" },
    highlight: [
      { key: "ma_su_co", nhan: "Mã sự cố", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "su_co", highlight: true },
      { key: "muc_do", nhan: "Mức độ", loai: "text" },
      { key: "ngay_phat_hien", nhan: "Phát hiện", loai: "datetime" },
    ],
    chiTiet: [
      { key: "ma_su_co", nhan: "Mã sự cố", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "su_co" },
      { key: "muc_do", nhan: "Mức độ", loai: "text" },
      { key: "hien_tuong", nhan: "Hiện tượng", loai: "text" },
      { key: "nguyen_nhan", nhan: "Nguyên nhân", loai: "text" },
      { key: "bien_phap_xu_ly", nhan: "Biện pháp xử lý", loai: "text" },
      { key: "ngay_phat_hien", nhan: "Phát hiện", loai: "datetime" },
      { key: "thoi_diem_khac_phuc", nhan: "Khắc phục", loai: "datetime" },
      { key: "thoi_gian_gian_doan", nhan: "Gián đoạn (phút)", loai: "so" },
      { key: "nguoi_bao_cao", nhan: "Người báo cáo", loai: "text" },
      { key: "nguoi_xu_ly", nhan: "Người xử lý", loai: "text" },
    ],
  },

  van_de: {
    ten: "Vấn đề",
    tieuDe: (r) => nonEmpty(r.tieu_de ?? r.ma_van_de),
    phu: (r) => nonEmpty(r.ma_van_de),
    badgeTrangThai: { domain: "van_de", key: "trang_thai" },
    highlight: [
      { key: "ma_van_de", nhan: "Mã vấn đề", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "van_de", highlight: true },
      { key: "muc_do", nhan: "Mức độ", loai: "text" },
    ],
    chiTiet: [
      { key: "ma_van_de", nhan: "Mã vấn đề", loai: "text", highlight: true },
      { key: "tieu_de", nhan: "Tiêu đề", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "van_de" },
      { key: "muc_do", nhan: "Mức độ", loai: "text" },
      { key: "mo_ta", nhan: "Mô tả", loai: "text" },
      { key: "nguyen_nhan_goc", nhan: "Nguyên nhân gốc", loai: "text" },
      { key: "bien_phap_khac_phuc", nhan: "Biện pháp khắc phục", loai: "text" },
      { key: "created_at", nhan: "Tạo lúc", loai: "datetime" },
    ],
  },

  cong_viec: {
    ten: "Phiếu công việc",
    tieuDe: (r) => nonEmpty(r.mo_ta ?? r.ma_cong_viec),
    phu: (r) => joinNonEmpty([str(r.ma_cong_viec), str(r.loai)]),
    badgeTrangThai: { domain: "cong_viec", key: "trang_thai" },
    highlight: [
      { key: "ma_cong_viec", nhan: "Mã công việc", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "cong_viec", highlight: true },
      { key: "uu_tien", nhan: "Ưu tiên", loai: "text" },
      { key: "ngay_den_han", nhan: "Đến hạn", loai: "expiring" },
    ],
    chiTiet: [
      { key: "ma_cong_viec", nhan: "Mã công việc", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "cong_viec" },
      { key: "loai", nhan: "Loại", loai: "text" },
      { key: "uu_tien", nhan: "Ưu tiên", loai: "text" },
      { key: "mo_ta", nhan: "Mô tả", loai: "text" },
      { key: "ngay_den_han", nhan: "Đến hạn", loai: "expiring" },
      { key: "ngay_bat_dau", nhan: "Bắt đầu", loai: "date" },
      { key: "ngay_hoan_thanh", nhan: "Hoàn thành", loai: "date" },
      { key: "nguoi_phu_trach", nhan: "Phụ trách", loai: "text" },
    ],
  },

  hong_hoc: {
    ten: "Hỏng hóc / Thay thế",
    tieuDe: (r) => nonEmpty(r.mo_ta_hong_hoc ?? r.ma_hong_hoc),
    phu: (r) => joinNonEmpty([str(r.ma_hong_hoc), str(r.snapshot_ma_thiet_bi ?? r.thiet_bi_hong)]),
    badgeTrangThai: { domain: "hong_hoc", key: "trang_thai" },
    highlight: [
      { key: "ma_hong_hoc", nhan: "Mã phiếu", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "hong_hoc", highlight: true },
      { key: "phuong_an", nhan: "Phương án", loai: "text" },
      { key: "ngay_hong", nhan: "Ngày hỏng", loai: "date" },
    ],
    chiTiet: [
      { key: "ma_hong_hoc", nhan: "Mã phiếu", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "hong_hoc" },
      { key: "phuong_an", nhan: "Phương án", loai: "text" },
      { key: "bo_phan_hong", nhan: "Bộ phận hỏng", loai: "text" },
      { key: "mo_ta_hong_hoc", nhan: "Mô tả", loai: "text" },
      { key: "chi_phi", nhan: "Chi phí", loai: "vnd" },
      { key: "ngay_hong", nhan: "Ngày hỏng", loai: "date" },
      { key: "ngay_hoan_thanh", nhan: "Hoàn thành", loai: "date" },
      { key: "nguoi_thuc_hien", nhan: "Người thực hiện", loai: "text" },
    ],
  },

  ban_giao: {
    ten: "Bàn giao",
    tieuDe: (r) => nonEmpty(r.snapshot_ten_thiet_bi ?? r.thiet_bi ?? r.ma_ban_giao),
    phu: (r) => joinNonEmpty([str(r.ma_ban_giao), str(r.loai_ban_giao)]),
    badgeTrangThai: { domain: "ban_giao", key: "trang_thai" },
    highlight: [
      { key: "ma_ban_giao", nhan: "Mã bàn giao", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "ban_giao", highlight: true },
      { key: "loai_ban_giao", nhan: "Loại", loai: "text" },
      { key: "ngay_nhan", nhan: "Ngày nhận", loai: "date" },
    ],
    chiTiet: [
      { key: "ma_ban_giao", nhan: "Mã bàn giao", loai: "text", highlight: true },
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "ban_giao" },
      { key: "loai_ban_giao", nhan: "Loại", loai: "text" },
      { key: "nguoi_giao", nhan: "Người giao", loai: "text" },
      { key: "nguoi_nhan", nhan: "Người nhận", loai: "text" },
      { key: "don_vi_nhan", nhan: "Đơn vị nhận", loai: "text" },
      { key: "ngay_nhan", nhan: "Ngày nhận", loai: "date" },
      { key: "ngay_tra", nhan: "Ngày trả", loai: "date" },
      { key: "tinh_trang_khi_nhan", nhan: "Tình trạng khi nhận", loai: "text" },
    ],
  },

  giay_phep: {
    ten: "Giấy phép",
    tieuDe: (r) => nonEmpty(r.so_giay_phep ?? r.ma_giay_phep),
    phu: (r) => nonEmpty(r.ma_giay_phep),
    highlight: [
      { key: "so_giay_phep", nhan: "Số giấy phép", loai: "text", highlight: true },
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring", highlight: true },
      { key: "ngay_cap", nhan: "Ngày cấp", loai: "date" },
    ],
    chiTiet: [
      { key: "ma_giay_phep", nhan: "Mã giấy phép", loai: "text", highlight: true },
      { key: "so_giay_phep", nhan: "Số giấy phép", loai: "text", highlight: true },
      { key: "ngay_cap", nhan: "Ngày cấp", loai: "date" },
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring", highlight: true },
      { key: "ghi_chu", nhan: "Ghi chú", loai: "text" },
    ],
  },

  vat_tu: {
    ten: "Vật tư",
    tieuDe: (r) => nonEmpty(r.ten ?? r.ma_vat_tu),
    phu: (r) => joinNonEmpty([str(r.ma_vat_tu), str(r.loai)]),
    highlight: [
      { key: "ma_vat_tu", nhan: "Mã vật tư", loai: "text", highlight: true },
      { key: "loai", nhan: "Loại", loai: "text", highlight: true },
      { key: "don_gia", nhan: "Đơn giá", loai: "vnd" },
      { key: "muc_ton_toi_thieu", nhan: "Tồn tối thiểu", loai: "so" },
    ],
    chiTiet: [
      { key: "ma_vat_tu", nhan: "Mã vật tư", loai: "text", highlight: true },
      { key: "ten", nhan: "Tên", loai: "text", highlight: true },
      { key: "loai", nhan: "Loại", loai: "text" },
      { key: "don_vi_tinh", nhan: "Đơn vị tính", loai: "text" },
      { key: "don_gia", nhan: "Đơn giá", loai: "vnd" },
      { key: "muc_ton_toi_thieu", nhan: "Tồn tối thiểu", loai: "so" },
      { key: "ghi_chu", nhan: "Ghi chú", loai: "text" },
    ],
  },
  dm_model: {
    ten: "Model tài sản",
    tieuDe: (r) => nonEmpty(r.ten),
    phu: (r) => joinNonEmpty([str(r.ma), str(r.so_model), str(r.p_n)]),
    highlight: [
      { key: "so_model", nhan: "Số model", loai: "text", highlight: true },
      { key: "p_n", nhan: "P/N", loai: "text", highlight: true },
      { key: "nha_san_xuat", nhan: "Nhà sản xuất", loai: "text" },
      { key: "loai_thiet_bi", nhan: "Chủng loại", loai: "text" },
    ],
    chiTiet: [
      { key: "ten", nhan: "Tên model", loai: "text", highlight: true },
      { key: "ma", nhan: "Mã model", loai: "text" },
      { key: "so_model", nhan: "Số model", loai: "text" },
      { key: "p_n", nhan: "P/N", loai: "text" },
      { key: "nha_san_xuat", nhan: "Nhà sản xuất", loai: "text" },
      { key: "loai_thiet_bi", nhan: "Chủng loại", loai: "text" },
      { key: "mo_ta", nhan: "Mô tả", loai: "text" },
    ],
  },
};

/** Trả về EntityView cho một loại thực thể. Ném lỗi nếu không có trong registry. */
export function entityView(loai: EntityLoai): EntityView {
  const v = R[loai];
  if (!v) throw new Error(`entityView: chưa đăng ký thực thể "${loai}"`);
  return v;
}

/** Danh sách các loại thực thể có mặt — dùng trong test / kiểm tra tổng quát. */
export function entityLoaiList(): EntityLoai[] {
  return Object.keys(R) as EntityLoai[];
}

/**
 * Render một trường đơn về `{ nhan, giaTri, highlight }`.
 * - date/datetime → fmtNgay / fmtNgayGio.
 * - vnd/so → fmtVND / fmtSo.
 * - status → labelOf(domain, raw) (giữ nguyên chuỗi khi domain thiếu).
 * - expiring → "còn X ngày" / "quá hạn X ngày"; highlight khi ≤ ngưỡng cảnh báo.
 */
export function renderField(f: FieldView, row: Record<string, unknown>): RenderedField {
  const raw = row[f.key];
  const baseHighlight = !!f.highlight;

  switch (f.loai) {
    case "date":
      return { nhan: f.nhan, giaTri: fmtNgay(raw as string | Date | null | undefined), highlight: baseHighlight };
    case "datetime":
      return { nhan: f.nhan, giaTri: fmtNgayGio(raw as string | Date | null | undefined), highlight: baseHighlight };
    case "vnd":
      return { nhan: f.nhan, giaTri: fmtVND(raw as number | null | undefined), highlight: baseHighlight };
    case "so":
      return { nhan: f.nhan, giaTri: fmtSo(raw as number | null | undefined), highlight: baseHighlight };
    case "status": {
      const s = str(raw).trim();
      if (!s) return { nhan: f.nhan, giaTri: KHONG_CO, highlight: baseHighlight };
      const code = f.domain ? normalizeLegacy(f.domain, s) : s;
      const giaTri = f.domain ? labelOf(f.domain, code || s) : s;
      return { nhan: f.nhan, giaTri, highlight: baseHighlight };
    }
    case "expiring": {
      const soNgay = soNgayDenHan(raw);
      if (soNgay == null) {
        return { nhan: f.nhan, giaTri: KHONG_CO, highlight: baseHighlight, soNgay: null };
      }
      const gia = soNgay < 0
        ? `Quá hạn ${Math.abs(soNgay)} ngày`
        : soNgay === 0
          ? "Hết hạn hôm nay"
          : `Còn ${soNgay} ngày`;
      const soatCanhBao = soNgay < 0 || nguongCho(soNgay) != null || soNgay <= DEFAULT_NGAY_SAP_HET_HAN;
      return {
        nhan: f.nhan,
        giaTri: `${gia} (${fmtNgay(raw as string)})`,
        highlight: baseHighlight || soatCanhBao,
        soNgay,
      };
    }
    case "text":
    default:
      return { nhan: f.nhan, giaTri: nonEmpty(raw), highlight: baseHighlight };
  }
}
