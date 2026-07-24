// Registry các CỘT VẬT LÝ có thể sửa trực tiếp trên sơ đồ/danh sách hệ thống,
// tổ chức theo từng LAYER (level). Khoá (key) và các cột hệ thống bị loại trừ.
//
// Quy ước:
// - "text"     : ô nhập 1 dòng
// - "textarea" : ô nhập nhiều dòng
// - "number"   : số (int/numeric) — rỗng => null
// - "date"     : ngày (YYYY-MM-DD) — rỗng => null
//
// Các cột KHÔNG đưa vào (không cho sửa tự do ở đây):
// - Khoá & định danh hệ thống: id, ma_thiet_bi/ma, ten_thiet_bi/ten (sửa qua ô "Tên đầy đủ")
// - Cột hệ thống: created_*, updated_*, search_*, tsv, thuoc_tinh (khai qua trường động)
// - Tệp đính kèm: file_tai_lieu, hinh_anh (QR nhãn dựng từ /q/&lt;ma_thiet_bi&gt;)
// - Khoá ngoại *_id (chọn qua danh mục riêng)
// - Cột do quy trình quản lý: cấp phát (nguoi_giu, ngay_cap_phat…), kiểm kê (ngay_kiem_ke_ke_tiep)

import { parseHtSysMa } from "./phan-loai";

export type PhysColType = "text" | "textarea" | "number" | "date" | "reference";

export interface PhysCol {
  key: string;
  label: string;
  type: PhysColType;
  placeholder?: string;
  /** Với type="reference": bảng danh mục nguồn (dm_*). Giá trị lưu là id (uuid). */
  refTable?: string;
  /** Trường "chọn model" — render ở khối riêng, không lặp trong danh sách cột. */
  modelPicker?: boolean;
  /**
   * Trường được KẾ THỪA TỰ ĐỘNG từ model (dm_model) qua trigger
   * `thiet_bi_inherit_model`. Khi tài sản đã gắn mẫu, trường này chỉ hiển thị
   * giá trị kế thừa (read-only) — không nhập tay để tránh lệch dữ liệu.
   */
  inheritedFromModel?: boolean;
}

export interface PhysGroup {
  title: string;
  cols: PhysCol[];
}

// LAYER tài sản / thành phần tài sản → bảng thiet_bi
//
// Nguyên tắc chuẩn hoá:
//  • MẪU THIẾT BỊ (dm_model) giữ thông tin dùng chung: chủng loại, nhà sản
//    xuất, bộ trường kỹ thuật (field_set), hình ảnh, mô tả…
//  • THIẾT BỊ (thiet_bi) chỉ khai phần ĐẠI DIỆN cho cá thể đó: số serial,
//    P/N, mã tài sản, vị trí, trạng thái, thời gian… Khi đã gắn mẫu, các
//    trường dùng chung sẽ TỰ ĐỘNG kế thừa từ mẫu (không nhập lại).
//
// PHẠM VI EDIT MODE Ở LAYER THIẾT BỊ (chỉ khai phần ĐẠI DIỆN cho cá thể):
//  • Trường dùng chung (loại, NSX, P/N, bộ trường, hình ảnh…) → thuộc MẪU
//    tài sản (dm_model), khai ở Danh mục → Model và TỰ KẾ THỪA.
//  • Trường quản lý & giấy phép (phân loại, nơi quản lý, giấy phép khai thác,
//    giấy phép tần số, độ tin cậy, nguồn dữ liệu…) → thuộc LAYER HỆ THỐNG.
//  • Trường vật tư, đánh giá, điều chuyển/chấm dứt → tuy vẫn liên kết trong
//    CSDL nhưng CHỈ hiển thị ở Sổ lý lịch, KHÔNG nhập ở edit mode tại đây.
export const THIET_BI_PHYS_GROUPS: PhysGroup[] = [
  {
    title: "Model (nguồn thông tin dùng chung)",
    cols: [
      { key: "model_id", label: "Model (Model)", type: "reference", refTable: "dm_model", modelPicker: true },
    ],
  },
  {
    title: "Đại diện cá thể tài sản",
    cols: [
      { key: "ma_serial", label: "Số serial", type: "text" },
      { key: "ma_tai_san_bravo", label: "Mã tài sản (Bravo)", type: "text" },
      { key: "thanh_phan", label: "Thành phần", type: "text" },
    ],
  },
  {
    title: "Kế thừa từ model",
    cols: [
      { key: "loai_thiet_bi_id", label: "Chủng loại", type: "reference", refTable: "dm_loai_thiet_bi", inheritedFromModel: true },
      { key: "nha_san_xuat_id", label: "Nhà sản xuất", type: "reference", refTable: "dm_nha_san_xuat", inheritedFromModel: true },
      { key: "p_n", label: "P/N (Part number)", type: "text", inheritedFromModel: true },
    ],
  },
  {
    // Toàn bộ trường tra cứu ở layer tài sản đều CHỌN TỪ DANH MỤC (khoá ngoại),
    // không gõ tự do — đảm bảo tính chặt chẽ & đồng bộ dữ liệu.
    title: "Vị trí · Trạng thái · Đơn vị (chọn từ danh mục)",
    cols: [
      { key: "trang_thai_id", label: "Trạng thái tài sản", type: "reference", refTable: "dm_trang_thai_thiet_bi" },
      { key: "vi_tri_id", label: "Vị trí lắp đặt", type: "reference", refTable: "dm_vi_tri" },
      { key: "don_vi_id", label: "Đơn vị quản lý", type: "reference", refTable: "dm_don_vi" },
      { key: "nha_cung_cap_id", label: "Nhà cung cấp", type: "reference", refTable: "dm_nha_cung_cap" },
    ],
  },
  {
    title: "Thời gian & tuổi thọ",
    cols: [
      { key: "ngay_mua", label: "Ngày mua", type: "date" },
      { key: "han_bao_hanh", label: "Hạn bảo hành", type: "date" },
      { key: "nam_san_xuat", label: "Năm sản xuất", type: "number" },
      { key: "nam_dua_vao_khai_thac", label: "Năm đưa vào khai thác", type: "number" },
      { key: "so_nam_su_dung", label: "Số năm sử dụng", type: "number" },
      { key: "ty_le_tuoi_tho", label: "Tỷ lệ tuổi thọ (%)", type: "number" },
    ],
  },
  {
    title: "Tình trạng & ghi chú",
    cols: [
      { key: "tinh_trang_ky_thuat", label: "Tình trạng kỹ thuật", type: "text" },
      { key: "ghi_chu", label: "Ghi chú", type: "textarea" },
    ],
  },
];

// LAYER hệ thống → bảng dm_he_thong (các cột theo giấy phép)
export const HE_THONG_PHYS_GROUPS: PhysGroup[] = [
  {
    title: "Quản lý (chọn từ danh mục)",
    cols: [
      { key: "don_vi_id", label: "Đơn vị quản lý", type: "reference", refTable: "dm_don_vi" },
    ],
  },
  {
    title: "Thông tin hệ thống",
    cols: [
      { key: "kieu_thiet_bi_gp", label: "Kiểu tài sản", type: "text" },
      { key: "nam_sx_theo_gp", label: "Năm sản xuất", type: "text" },
      { key: "noi_san_xuat_gp", label: "Nơi sản xuất", type: "text" },
      { key: "muc_dich_gp", label: "Mục đích sử dụng", type: "textarea" },
      { key: "pham_vi_hoat_dong_gp", label: "Phạm vi hoạt động", type: "textarea" },
      { key: "tinh_nang_ky_thuat", label: "Tính năng kỹ thuật chính", type: "textarea" },
      { key: "dia_diem_dat_gp", label: "Địa điểm đặt", type: "text" },
      { key: "thoi_gian_hoat_dong_gp", label: "Thời gian hoạt động", type: "text" },
      { key: "mo_ta", label: "Ghi chú / mô tả hệ thống", type: "textarea" },
    ],
  },
  {
    title: "Thông tin theo giấy phép",
    cols: [
      { key: "ten_he_thong_theo_gp", label: "Tên hệ thống theo GP", type: "text" },
      { key: "so_san_xuat_gp", label: "Số sản xuất (GP)", type: "text" },
      { key: "thanh_phan_theo_gp", label: "Thành phần theo GP", type: "textarea" },
      { key: "ma_tai_san_bravo", label: "Mã tài sản (Bravo)", type: "text" },
    ],
  },
  {
    title: "Giấy phép & phạm vi",
    cols: [
      { key: "giay_phep_khai_thac", label: "Tên giấy phép khai thác", type: "text" },
      { key: "gp_so", label: "Số giấy phép", type: "text" },
      { key: "gp_ngay_cap", label: "Ngày cấp GP", type: "text" },
      { key: "gp_han", label: "Hạn GP", type: "text" },
      { key: "gp_cu_bai_bo", label: "GP cũ bãi bỏ", type: "text" },
      { key: "ma_dia_chi_kt_gp", label: "Mã địa chỉ KT (GP)", type: "text" },
    ],
  },
];

// Bảng đích + khoá đối chiếu cho từng layer
export const PHYS_TABLE_BY_LAYER: Record<string, { table: string; keyCol: string; groups: PhysGroup[] } | undefined> = {
  tb: { table: "thiet_bi", keyCol: "ma_thiet_bi", groups: THIET_BI_PHYS_GROUPS },
  ht: { table: "dm_he_thong", keyCol: "id", groups: HE_THONG_PHYS_GROUPS },
};

// Giá trị dùng để đối chiếu khoá vật lý theo layer. Với hệ thống, mã trên cây là
// dạng ghép "<mã nhóm>::<id hệ thống>" nên phải tách lấy đúng id (uuid) của
// dm_he_thong; các layer khác dùng nguyên mã.
export function physKeyValue(layer: string, ma: string): string {
  return layer === "ht" ? parseHtSysMa(ma).sysName : ma;
}

export const ALL_PHYS_KEYS_BY_LAYER: Record<string, string[]> = Object.fromEntries(
  Object.entries(PHYS_TABLE_BY_LAYER).map(([layer, cfg]) => [
    layer,
    cfg ? cfg.groups.flatMap((g) => g.cols.map((c) => c.key)) : [],
  ]),
);

// Chuyển giá trị chuỗi trên form về đúng kiểu để ghi vào CSDL.
export function coercePhysValue(type: PhysColType, raw: string): string | number | null {
  const v = (raw ?? "").trim();
  if (v === "") return null;
  if (type === "number") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return v; // text | textarea | date
}

// ---------------------------------------------------------------------------
// Kế thừa từ dm_model — quy tắc CHỈ-ĐỌC
// ---------------------------------------------------------------------------
// Khi tài sản đã gắn `model_id`, các trường có cờ `inheritedFromModel` sẽ do
// trigger `thiet_bi_inherit_model` tự điền theo mẫu. Không cho phép ghi đè ở
// UI để tránh lệch dữ liệu với danh mục Model.
export interface EditabilityContext {
  /** Layer đang edit: `tb` = tài sản. Cờ kế thừa chỉ áp dụng cho layer này. */
  layer: string;
  /** Với layer `tb`: có `model_id` (đã gắn mẫu) hay không. */
  hasModel?: boolean;
}

/** Có được phép sửa cột `c` trong ngữ cảnh hiện tại không? */
export function isFieldEditable(c: PhysCol, ctx: EditabilityContext): boolean {
  if (ctx.layer === "tb" && ctx.hasModel && c.inheritedFromModel) return false;
  return true;
}

/** Lọc payload trước khi ghi vào bảng gốc — bỏ các trường kế thừa khi đã gắn model. */
export function filterPhysPayload(
  cols: PhysCol[],
  payload: Record<string, string | number | null>,
  ctx: EditabilityContext,
): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const c of cols) {
    if (!isFieldEditable(c, ctx)) continue;
    if (c.key in payload) out[c.key] = payload[c.key];
  }
  return out;
}

