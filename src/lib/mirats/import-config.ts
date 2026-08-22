// ============================================================================
// Cấu hình Nhập/Xuất hàng loạt (client-safe) — học theo mô hình Snipe-IT:
//   * Upsert theo "khóa tự nhiên" (mã) → có thì cập nhật, chưa có thì tạo mới.
//   * Tham chiếu (hệ thống / đơn vị / vị trí…) tra theo mã hoặc tên; một số
//     danh mục nền được tự tạo khi thiếu (create=true).
//   * Xem trước từng dòng (action + lỗi) trước khi ghi vào CSDL.
//
// File này được DÙNG CHUNG bởi UI (client) và server function, nên KHÔNG được
// import bất kỳ module server-only nào ở đây.
// ============================================================================

export type FieldKind = "text" | "int" | "num" | "date" | "ref";

export interface FieldDef {
  /** Tên cột trên file CSV. */
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Tên cột thật trong CSDL (mặc định = key). */
  col?: string;
  /** Với kind="ref": bảng tham chiếu + cách tra + có tự tạo khi thiếu không. */
  ref?: {
    table: string;
    /** Tra theo vai trò: "ma" = cột khóa, "ten" = cột tên (theo thứ tự ưu tiên). */
    by: Array<"ma" | "ten">;
    /** Cột id sẽ ghi vào bảng đích. */
    idCol: string;
    /** Cột CSDL thật đóng vai "ma" (mặc định "ma"). Vd thiet_bi -> "ma_thiet_bi". */
    keyCol?: string;
    /** Cột CSDL thật đóng vai "ten" (mặc định "ten"). Vd thiet_bi -> "ma_serial". */
    nameCol?: string;
    /** Tự tạo bản ghi danh mục khi không tìm thấy (như Snipe-IT). */
    create?: boolean;
    /**
     * "Danh mục nền" quan trọng (nhóm phân loại, nhóm hệ thống): KHÔNG tự tạo
     * ngay khi thiếu. Thay vào đó báo cảnh báo và CHỜ admin xác nhận rõ ràng —
     * tránh vô tình sinh ra một nhóm phân loại mới do gõ sai/thiếu.
     */
    guard?: boolean;
  };
  ghi_chu?: string;
  /**
   * Trường "ảo": KHÔNG phải cột thật trong bảng đích. Vòng ghi generic sẽ BỎ QUA
   * (không đưa vào payload). Dùng cho các cột trợ giúp như "Lắp vào vị trí" — được
   * xử lý bằng logic riêng sau khi ghi bản ghi chính (vd tạo thành phần + lắp tài sản).
   */
  virtual?: boolean;
  /**
   * Trường "hay dùng": có mặt trong MẪU RÚT GỌN (compact). Trường required luôn có
   * trong mẫu rút gọn dù không đánh dấu common.
   */
  common?: boolean;
}

export interface EntityDef {
  id: string;
  label: string;
  table: string;
  /** Cột CSDL dùng để tra upsert. */
  naturalKey: string;
  /** Header CSV tương ứng khóa tự nhiên. */
  keyHeader: string;
  fields: FieldDef[];
  /** Với tài sản: khi khớp được hệ thống thì tự điền các cột phân lớp này. */
  inheritFromRef?: { field: string; map: Record<string, string> };
  note?: string;
}

const CAT_FIELDS = (label: string): FieldDef[] => [
  { key: "ma", label: "Mã", kind: "text", required: true },
  { key: "ten", label: `Tên ${label}`, kind: "text", required: true },
  { key: "mo_ta", label: "Mô tả", kind: "text" },
  { key: "thu_tu", label: "Thứ tự", kind: "int" },
];

/** Ref tới chính bảng danh mục (phân cấp cha–con). Không tự tạo cấp cha. */
const parentRef = (table: string): FieldDef => ({
  key: "cap_cha",
  label: "Cấp cha (mã/tên)",
  kind: "ref",
  ref: { table, by: ["ma", "ten"], idCol: "parent_id", create: false },
  ghi_chu: "Để trống nếu là cấp gốc. Nhập cấp cha TRƯỚC để khớp được.",
});

/** Danh mục nền: khung chung (mã/tên/mô tả/thứ tự) + trường mở rộng riêng từng bảng. */
export const CATALOG_TABLES: Array<{ table: string; label: string; extra?: FieldDef[] }> = [
  { table: "dm_don_vi", label: "Đơn vị", extra: [parentRef("dm_don_vi")] },
  { table: "dm_vi_tri", label: "Vị trí", extra: [parentRef("dm_vi_tri")] },
  {
    table: "dm_nha_san_xuat",
    label: "Nhà sản xuất",
    extra: [
      { key: "trang_web", label: "Trang web", kind: "text" },
      { key: "xuat_xu", label: "Xuất xứ", kind: "text" },
      { key: "ghi_chu", label: "Ghi chú", kind: "text" },
    ],
  },
  { table: "dm_nha_cung_cap", label: "Nhà cung cấp" },
  { table: "dm_loai_thiet_bi", label: "Chủng loại" },
  { table: "dm_phan_loai", label: "Phân loại (Nhóm 1/2/3)" },
  {
    table: "dm_nhom_he_thong",
    label: "Nhóm hệ thống (VHF/VCCS…)",
    extra: [
      {
        key: "phan_loai",
        label: "Phân loại (Nhóm 1/2/3)",
        kind: "ref",
        ref: {
          table: "dm_phan_loai",
          by: ["ma", "ten"],
          idCol: "phan_loai_id",
          create: true,
          guard: true,
        },
      },
    ],
  },

  { table: "dm_trang_thai_thiet_bi", label: "Trạng thái tài sản" },
];

export const ENTITIES: EntityDef[] = [
  {
    id: "thiet_bi",
    label: "Tài sản",
    table: "thiet_bi",
    naturalKey: "ma_thiet_bi",
    keyHeader: "ma_thiet_bi",
    note: "Khóa upsert = mã tài sản. Thứ tự quan hệ: Phân loại → Nhóm hệ thống → Hệ thống → Chủng loại → Nhà sản xuất → Mẫu → Nhà cung cấp → Đơn vị/Vị trí → Tài sản. Khớp Hệ thống theo mã/tên (kế thừa Phân loại + Nhóm hệ thống từ hệ thống). Mẫu KHÔNG tự tạo từ tên nếu chưa có sẵn — hãy nhập Model trước. Cột bắt đầu bằng x_ ghi vào thuộc tính mở rộng. Điền 'Lắp vào vị trí' để TỰ tìm/tạo thành phần trong Hệ thống và lắp tài sản vào (không cần khai sheet Thành phần riêng).",
    inheritFromRef: {
      field: "he_thong",
      map: {
        phan_loai_id: "phan_loai_id",
        nhom_he_thong_id: "nhom_he_thong_id",
        don_vi_id: "don_vi_id",
      },
    },
    fields: [
      { key: "ma_thiet_bi", label: "Mã tài sản", kind: "text", required: true, common: true },
      { key: "ma_tai_san_bravo", label: "Mã tài sản Bravo", kind: "text" },
      { key: "ten_thiet_bi", label: "Tên tài sản", kind: "text", required: true, common: true },
      {
        key: "he_thong",
        label: "Hệ thống",
        kind: "ref",
        common: true,
        ref: { table: "dm_he_thong", by: ["ma", "ten"], idCol: "he_thong_id" },
      },
      {
        key: "lap_vi_tri",
        label: "Lắp vào vị trí (thành phần)",
        kind: "text",
        virtual: true,
        common: true,
        ghi_chu:
          "Tên/mã vị trí chức năng TRONG hệ thống ở cột 'Hệ thống'. Có thì lắp vào, chưa có thì TỰ tạo thành phần (TP-…) rồi lắp tài sản vào (gan_chuc_nang). Để trống = không đổi lắp đặt.",
      },
      {
        key: "don_vi",
        label: "Đơn vị",
        kind: "ref",
        common: true,
        ref: { table: "dm_don_vi", by: ["ma", "ten"], idCol: "don_vi_id", create: true },
      },
      {
        key: "trang_thai",
        label: "Trạng thái",
        kind: "ref",
        common: true,
        ref: {
          table: "dm_trang_thai_thiet_bi",
          by: ["ma", "ten"],
          idCol: "trang_thai_id",
          create: true,
        },
      },
      {
        key: "vi_tri_ref",
        label: "Vị trí (danh mục)",
        kind: "ref",
        ref: { table: "dm_vi_tri", by: ["ma", "ten"], idCol: "vi_tri_id", create: true },
      },
      { key: "ma_serial", label: "Số serial", kind: "text", common: true },
      {
        key: "model",
        label: "Model",
        kind: "ref",
        common: true,
        // create:true → nếu model chưa có trong danh mục sẽ TỰ tạo dm_model mới
        // (chỉ với ma/ten), giúp INSERT tài sản không vi phạm ràng buộc model_id
        // NOT NULL. NSX/loại có thể bổ sung sau ở /danh-muc/model.
        ref: { table: "dm_model", by: ["ma", "ten"], idCol: "model_id", create: true },
      },
      {
        key: "loai_thiet_bi",
        label: "Chủng loại",
        kind: "ref",
        ref: {
          table: "dm_loai_thiet_bi",
          by: ["ma", "ten"],
          idCol: "loai_thiet_bi_id",
          create: true,
        },
      },
      { key: "p_n", label: "P/N", kind: "text" },
      { key: "nam_san_xuat", label: "Năm sản xuất", kind: "int" },
      { key: "nam_dua_vao_khai_thac", label: "Năm khai thác", kind: "int" },
      {
        key: "nha_san_xuat",
        label: "Nhà sản xuất",
        kind: "ref",
        ref: {
          table: "dm_nha_san_xuat",
          by: ["ma", "ten"],
          idCol: "nha_san_xuat_id",
          create: true,
        },
      },
      {
        key: "nha_cung_cap",
        label: "Nhà cung cấp",
        kind: "ref",
        ref: {
          table: "dm_nha_cung_cap",
          by: ["ma", "ten"],
          idCol: "nha_cung_cap_id",
          create: true,
        },
      },
      { key: "vi_tri", label: "Vị trí (mô tả)", kind: "text" },
      { key: "ngay_mua", label: "Ngày mua", kind: "date" },
      { key: "han_bao_hanh", label: "Hạn bảo hành", kind: "date" },
      { key: "phan_loai", label: "Phân loại", kind: "text" },
      { key: "noi_quan_ly", label: "Nơi quản lý", kind: "text" },
      { key: "thanh_phan", label: "Thành phần", kind: "text" },
      { key: "giay_phep_khai_thac", label: "Giấy phép khai thác", kind: "text" },
      { key: "giay_phep_tan_so", label: "Giấy phép tần số", kind: "text" },
      { key: "ty_le_tuoi_tho", label: "Tỷ lệ tuổi thọ (%)", kind: "num" },
      { key: "ghi_chu", label: "Ghi chú", kind: "text", common: true },
    ],
  },
  {
    id: "dm_he_thong",
    label: "Hệ thống",
    table: "dm_he_thong",
    naturalKey: "ma",
    keyHeader: "ma",
    // Hệ thống kế thừa Phân loại/Lĩnh vực từ Nhóm hệ thống cha khi không tự khai
    // — nhờ vậy hệ thống luôn nằm đúng nhánh phân loại của nhóm, không rơi vào
    // mục "chưa phân loại" trên sơ đồ.
    inheritFromRef: { field: "nhom_he_thong", map: { phan_loai_id: "phan_loai_id" } },
    note: "Khóa upsert = mã hệ thống. Nhập Phân loại (Nhóm 1/2/3) và Nhóm hệ thống (VHF/VCCS…) trước. Đơn vị được tự tạo khi thiếu.",
    fields: [
      { key: "ma", label: "Mã hệ thống", kind: "text", required: true },
      { key: "ten", label: "Tên hệ thống", kind: "text", required: true, common: true },
      { key: "ma_tai_san_bravo", label: "Mã tài sản Bravo", kind: "text" },
      {
        key: "phan_loai",
        label: "Phân loại (Nhóm 1/2/3)",
        kind: "ref",
        common: true,
        ref: {
          table: "dm_phan_loai",
          by: ["ma", "ten"],
          idCol: "phan_loai_id",
          create: true,
          guard: true,
        },
      },
      {
        key: "nhom_he_thong",
        label: "Nhóm hệ thống",
        kind: "ref",
        common: true,
        ref: {
          table: "dm_nhom_he_thong",
          by: ["ma", "ten"],
          idCol: "nhom_he_thong_id",
          create: true,
          guard: true,
        },
      },
      {
        key: "don_vi",
        label: "Đơn vị",
        kind: "ref",
        common: true,
        ref: { table: "dm_don_vi", by: ["ma", "ten"], idCol: "don_vi_id", create: true },
      },
      { key: "mo_ta", label: "Mô tả", kind: "text", common: true },
      { key: "gp_so", label: "Số giấy phép", kind: "text" },
      { key: "gp_ngay_cap", label: "Ngày cấp GP", kind: "text" },
      { key: "gp_han", label: "Hạn GP", kind: "text" },
      { key: "ten_he_thong_theo_gp", label: "Tên HT theo GP", kind: "text" },
      { key: "nam_sx_theo_gp", label: "Năm SX theo GP", kind: "text" },
      { key: "kieu_thiet_bi_gp", label: "Kiểu tài sản (GP)", kind: "text" },
      { key: "so_san_xuat_gp", label: "Số sản xuất (GP)", kind: "text" },
      { key: "noi_san_xuat_gp", label: "Nơi sản xuất (GP)", kind: "text" },
      { key: "muc_dich_gp", label: "Mục đích (GP)", kind: "text" },
      { key: "pham_vi_hoat_dong_gp", label: "Phạm vi hoạt động (GP)", kind: "text" },
      { key: "ma_dia_chi_kt_gp", label: "Mã địa chỉ KT (GP)", kind: "text" },
      { key: "dia_diem_dat_gp", label: "Địa điểm đặt (GP)", kind: "text" },
      { key: "thoi_gian_hoat_dong_gp", label: "Thời gian hoạt động (GP)", kind: "text" },
      { key: "gp_cu_bai_bo", label: "GP cũ bãi bỏ", kind: "text" },
      { key: "thanh_phan_theo_gp", label: "Thành phần theo GP", kind: "text" },
      { key: "thu_tu", label: "Thứ tự", kind: "int" },
    ],
  },
  {
    id: "dm_model",
    label: "Model",
    table: "dm_model",
    naturalKey: "ma",
    keyHeader: "ma",
    note: "Khóa upsert = mã mẫu. Cột hinh_anh nhận URL ảnh (có thể nhập hàng loạt ảnh cho nhiều mẫu). Nhà sản xuất/Chủng loại tra theo mã/tên và tự tạo khi thiếu.",
    fields: [
      { key: "ma", label: "Mã mẫu", kind: "text", required: true },
      { key: "ten", label: "Tên mẫu", kind: "text", required: true },
      { key: "p_n", label: "P/N", kind: "text" },
      {
        key: "nha_san_xuat",
        label: "Nhà sản xuất",
        kind: "ref",
        ref: {
          table: "dm_nha_san_xuat",
          by: ["ma", "ten"],
          idCol: "nha_san_xuat_id",
          create: true,
        },
      },
      {
        key: "loai_thiet_bi",
        label: "Chủng loại",
        kind: "ref",
        ref: {
          table: "dm_loai_thiet_bi",
          by: ["ma", "ten"],
          idCol: "loai_thiet_bi_id",
          create: true,
        },
      },
      {
        key: "hinh_anh",
        label: "Ảnh (URL)",
        kind: "text",
        ghi_chu: "URL ảnh mẫu — nhập hàng loạt ảnh qua cột này",
      },
      { key: "mo_ta", label: "Mô tả", kind: "text" },
      { key: "thu_tu", label: "Thứ tự", kind: "int" },
    ],
  },
  {
    id: "giay_phep_khai_thac",
    label: "Giấy phép khai thác",
    table: "giay_phep_khai_thac",
    naturalKey: "gp_so",
    keyHeader: "gp_so",
    note: "Khóa upsert = số giấy phép. Có thể liên kết hệ thống theo mã/tên (không tự tạo hệ thống).",
    fields: [
      { key: "gp_so", label: "Số giấy phép", kind: "text", required: true },
      {
        key: "he_thong",
        label: "Hệ thống (liên kết)",
        kind: "ref",
        ref: { table: "dm_he_thong", by: ["ma", "ten"], idCol: "he_thong_id" },
      },
      { key: "don_vi", label: "Đơn vị", kind: "text" },
      { key: "tram", label: "Trạm", kind: "text" },
      { key: "ten_he_thong_theo_gp", label: "Tên HT theo GP", kind: "text" },
      { key: "nam_sx_gp", label: "Năm SX theo GP", kind: "text" },
      { key: "gp_ngay", label: "Ngày cấp", kind: "text" },
      { key: "gp_han", label: "Hạn", kind: "text" },
      { key: "gp_cu", label: "GP cũ bãi bỏ", kind: "text" },
      { key: "kieu_thiet_bi", label: "Kiểu tài sản", kind: "text" },
      { key: "so_san_xuat", label: "Số sản xuất", kind: "text" },
      { key: "noi_san_xuat", label: "Nơi sản xuất", kind: "text" },
      { key: "muc_dich", label: "Mục đích", kind: "text" },
      { key: "pham_vi", label: "Phạm vi hoạt động", kind: "text" },
      { key: "ma_dia_chi", label: "Mã địa chỉ KT", kind: "text" },
      { key: "dia_diem", label: "Địa điểm đặt", kind: "text" },
      { key: "thoi_gian", label: "Thời gian hoạt động", kind: "text" },
      { key: "thanh_phan_theo_gp", label: "Thành phần theo GP", kind: "text" },
    ],
  },
  {
    id: "he_thong_thanh_phan",
    label: "Thành phần hệ thống",
    table: "he_thong_thanh_phan",
    naturalKey: "ma_thanh_phan",
    keyHeader: "ma_thanh_phan",
    note: "Khai THÀNH PHẦN HỆ THỐNG (không có serial). Khóa upsert = mã thành phần trong phạm vi một hệ thống — nhập đúng cột 'Hệ thống'. Gán tài sản cụ thể là thao tác riêng qua giao diện (Lắp/Thay), KHÔNG nhập ở đây.",
    fields: [
      { key: "ma_thanh_phan", label: "Mã thành phần", kind: "text", required: true },
      {
        key: "he_thong",
        label: "Hệ thống (liên kết)",
        kind: "ref",
        required: true,
        ref: { table: "dm_he_thong", by: ["ma", "ten"], idCol: "he_thong_id" },
      },
      { key: "ten", label: "Thành phần hệ thống", kind: "text", required: true },
      {
        key: "loai_yeu_cau",
        label: "Chủng loại yêu cầu",
        kind: "ref",
        ref: {
          table: "dm_loai_thiet_bi",
          by: ["ma", "ten"],
          idCol: "loai_thiet_bi_yeu_cau",
          create: true,
        },
      },
      { key: "bat_buoc", label: "Bắt buộc (true/false)", kind: "text" },
      { key: "thu_tu", label: "Thứ tự", kind: "int" },
      { key: "trang_thai", label: "Trạng thái (hoat_dong/ngung)", kind: "text" },
      { key: "hieu_luc_tu", label: "Hiệu lực từ", kind: "date" },
      { key: "hieu_luc_den", label: "Hiệu lực đến", kind: "date" },
      { key: "mo_ta", label: "Mô tả", kind: "text" },
    ],
  },
  {
    id: "thiet_bi_khe_linh_kien",
    label: "Khe linh kiện (trong tài sản)",
    table: "thiet_bi_khe_linh_kien",
    naturalKey: "ma_khe",
    keyHeader: "ma_khe",
    note: "Khai KHE LINH KIỆN (không có serial). Khóa upsert = mã khe trong phạm vi một tài sản cha — nhập đúng cột 'Tài sản cha'. Gán linh kiện cụ thể là thao tác riêng qua giao diện (Lắp/Thay), KHÔNG nhập ở đây.",
    fields: [
      { key: "ma_khe", label: "Mã khe", kind: "text", required: true },
      {
        key: "thiet_bi",
        label: "Tài sản cha (liên kết)",
        kind: "ref",
        required: true,
        ref: {
          table: "thiet_bi",
          by: ["ma", "ten"],
          keyCol: "ma_thiet_bi",
          nameCol: "ma_serial",
          idCol: "thiet_bi_id",
        },
      },
      { key: "ten", label: "Tên khe", kind: "text", required: true },
      {
        key: "loai_yeu_cau",
        label: "Loại linh kiện yêu cầu",
        kind: "ref",
        ref: {
          table: "dm_loai_thiet_bi",
          by: ["ma", "ten"],
          idCol: "loai_thiet_bi_yeu_cau",
          create: true,
        },
      },
      { key: "bat_buoc", label: "Bắt buộc (true/false)", kind: "text" },
      { key: "thu_tu", label: "Thứ tự", kind: "int" },
      { key: "trang_thai", label: "Trạng thái (hoat_dong/ngung)", kind: "text" },
      { key: "hieu_luc_tu", label: "Hiệu lực từ", kind: "date" },
      { key: "hieu_luc_den", label: "Hiệu lực đến", kind: "date" },
      { key: "mo_ta", label: "Mô tả", kind: "text" },
    ],
  },
  {
    id: "vat_tu",
    label: "Vật tư",
    table: "vat_tu",
    naturalKey: "ma_vat_tu",
    keyHeader: "ma_vat_tu",
    note: "Khóa upsert = mã vật tư. Bỏ trống mã → tự sinh từ tên. Trường 'loai' bắt buộc ∈ {DU_PHONG, TIEU_HAO}. Đơn vị/NCC/Model tra theo mã hoặc tên; đơn vị tự tạo khi thiếu.",
    fields: [
      { key: "ma_vat_tu", label: "Mã vật tư", kind: "text", common: true },
      { key: "ten", label: "Tên vật tư", kind: "text", required: true, common: true },
      {
        key: "loai",
        label: "Loại (DU_PHONG/TIEU_HAO)",
        kind: "text",
        required: true,
        common: true,
      },
      { key: "don_vi_tinh", label: "Đơn vị tính", kind: "text", required: true, common: true },
      { key: "don_gia", label: "Đơn giá", kind: "num", required: true },
      { key: "muc_ton_toi_thieu", label: "Tồn tối thiểu", kind: "num", required: true },
      {
        key: "don_vi",
        label: "Đơn vị (dm_don_vi)",
        kind: "ref",
        common: true,
        ref: { table: "dm_don_vi", by: ["ma", "ten"], idCol: "don_vi_id", create: true },
      },
      {
        key: "nha_cung_cap",
        label: "Nhà cung cấp",
        kind: "ref",
        ref: {
          table: "dm_nha_cung_cap",
          by: ["ma", "ten"],
          idCol: "nha_cung_cap_id",
          create: true,
        },
      },
      {
        key: "model",
        label: "Model",
        kind: "ref",
        ref: { table: "dm_model", by: ["ma", "ten"], idCol: "model_id", create: true },
      },
      { key: "ghi_chu", label: "Ghi chú", kind: "text" },
    ],
  },
  {
    id: "nhan_vien",
    label: "Nhân viên",
    table: "nhan_vien",
    naturalKey: "ma_nhan_vien",
    keyHeader: "ma_nhan_vien",
    note: "Khóa upsert = mã nhân viên. Đơn vị và chức vụ hiện lưu dưới dạng text tự do (chưa có ràng buộc danh mục).",
    fields: [
      { key: "ma_nhan_vien", label: "Mã nhân viên", kind: "text", required: true, common: true },
      { key: "ho_ten", label: "Họ tên", kind: "text", required: true, common: true },
      { key: "don_vi", label: "Đơn vị", kind: "text", common: true },
      { key: "chuc_vu", label: "Chức vụ", kind: "text", common: true },
      { key: "email", label: "Email", kind: "text", common: true },
      { key: "dien_thoai", label: "Điện thoại", kind: "text" },
    ],
  },
  {
    id: "chung_chi",
    label: "Chứng chỉ tài sản",
    table: "chung_chi_thiet_bi",
    naturalKey: "so_giay_chung_nhan",
    keyHeader: "so_giay_chung_nhan",
    note: "Khóa upsert = số giấy chứng nhận. Trường 'thiet_bi' BẮT BUỘC — nhập mã tài sản (ưu tiên) hoặc số serial để khớp thiet_bi_id.",
    fields: [
      { key: "so_giay_chung_nhan", label: "Số GCN", kind: "text", required: true, common: true },
      {
        key: "thiet_bi",
        label: "Tài sản (mã/serial)",
        kind: "ref",
        required: true,
        common: true,
        ref: {
          table: "thiet_bi",
          by: ["ma", "ten"],
          keyCol: "ma_thiet_bi",
          nameCol: "ma_serial",
          idCol: "thiet_bi_id",
        },
      },
      { key: "loai", label: "Loại chứng chỉ", kind: "text", required: true, common: true },
      { key: "ngay_bat_dau", label: "Ngày cấp", kind: "date", common: true },
      { key: "ngay_het_han", label: "Ngày hết hạn", kind: "date", common: true },
      { key: "ghi_chu", label: "Ghi chú", kind: "text" },
    ],
  },
  {
    id: "bao_tri",
    label: "Lịch sử bảo trì",
    table: "bao_tri",
    naturalKey: "ma_bao_tri",
    keyHeader: "ma_bao_tri",
    note: "Khóa upsert = mã bảo trì. Cột 'thiet_bi' (text) là mã tài sản — bắt buộc. 'ngay_bat_dau' bắt buộc. Các cột snapshot tự sinh ở server (bỏ trống).",
    fields: [
      { key: "ma_bao_tri", label: "Mã bảo trì", kind: "text", required: true, common: true },
      { key: "thiet_bi", label: "Mã tài sản", kind: "text", required: true, common: true },
      { key: "he_thong", label: "Hệ thống (tên)", kind: "text", common: true },
      { key: "don_vi", label: "Đơn vị (tên)", kind: "text" },
      { key: "loai_bao_tri", label: "Loại bảo trì", kind: "text", common: true },
      { key: "ke_hoach", label: "Kế hoạch", kind: "text" },
      { key: "ngay_bat_dau", label: "Ngày bắt đầu", kind: "date", required: true, common: true },
      { key: "ngay_hoan_thanh", label: "Ngày hoàn thành", kind: "date", common: true },
      { key: "mo_ta_cong_viec", label: "Mô tả công việc", kind: "text" },
      { key: "ket_qua", label: "Kết quả", kind: "text" },
      { key: "chi_phi", label: "Chi phí", kind: "num" },
      { key: "don_vi_thuc_hien", label: "Đơn vị thực hiện", kind: "text" },
      { key: "trang_thai", label: "Trạng thái", kind: "text", common: true },
      { key: "file_bien_ban", label: "File biên bản (URL)", kind: "text" },
    ],
  },
];

/** Lấy định nghĩa 1 danh mục nền theo tên bảng. */
export function catalogEntity(table: string): EntityDef {
  const meta = CATALOG_TABLES.find((c) => c.table === table);
  const label = meta?.label ?? table;
  return {
    id: table,
    label,
    table,
    naturalKey: "ma",
    keyHeader: "ma",
    note: "Khóa upsert = mã (có thì cập nhật, chưa có thì tạo). Cột để trống = giữ nguyên. Với danh mục phân cấp, nhập cấp cha trước.",
    fields: [...CAT_FIELDS(label), ...(meta?.extra ?? [])],
  };
}

export function findEntity(id: string, catTable?: string): EntityDef | null {
  if (id === "danh_muc") return catalogEntity(catTable ?? "dm_don_vi");
  return ENTITIES.find((e) => e.id === id) ?? null;
}

/** Lấy entity theo id (ném lỗi nếu không có) — dùng làm NGUỒN SỰ THẬT cho xuất mẫu. */
export function entityById(id: string): EntityDef {
  const e = ENTITIES.find((x) => x.id === id);
  if (!e) throw new Error(`Không có entity "${id}" trong import-config`);
  return e;
}

/** Bản đồ key → FieldDef của một entity (tra nhanh label/kind/required). */
export function fieldMap(ent: EntityDef): Record<string, FieldDef> {
  const m: Record<string, FieldDef> = {};
  for (const f of ent.fields) m[f.key] = f;
  return m;
}

/** Tập hợp key hợp lệ (tên cột CSV) của một entity. */
export function fieldKeySet(ent: EntityDef): Set<string> {
  return new Set(ent.fields.map((f) => f.key));
}

/** Header CSV cho một entity (dùng cho xuất mẫu). */
export function csvHeaders(ent: EntityDef): string[] {
  return ent.fields.map((f) => f.key);
}

/**
 * Trường cho MẪU RÚT GỌN (compact): required + đánh dấu common. Nếu entity chưa
 * đánh dấu common nào (vd danh mục nền vốn đã ít cột) → trả về TẤT CẢ trường để
 * không làm mất cột. Cột kỹ thuật do lớp xuất tự thêm, không tính ở đây.
 */
export function compactFields(ent: EntityDef): FieldDef[] {
  const picked = ent.fields.filter((f) => f.required || f.common);
  return picked.length > 0 ? picked : ent.fields;
}

/* ------------------------------ CSV helpers ------------------------------ */

/** Bọc giá trị theo chuẩn CSV. */
export function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(","));
  return "\ufeff" + lines.join("\r\n");
}

/** Parser CSV nhỏ gọn, hỗ trợ dấu ngoặc kép và xuống dòng trong ô. */
export function parseCsv(text: string): { headers: string[]; rows: Array<Record<string, string>> } {
  const src = text.replace(/^\ufeff/, "");
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x !== "")) records.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((x) => x !== "")) records.push(row);
  }
  if (records.length === 0) return { headers: [], rows: [] };
  // Làm sạch mỗi ô: gộp xuống dòng/tab/khoảng trắng thừa về 1 dấu cách, cắt đầu–cuối.
  const cleanCell = (s: string) => (s ?? "").replace(/\s+/g, " ").trim();
  const headers = records[0].map((h) => cleanCell(h));
  const rows = records.slice(1).map((rec) => {
    const o: Record<string, string> = {};
    headers.forEach((h, idx) => {
      o[h] = cleanCell(rec[idx] ?? "");
    });
    return o;
  });
  return { headers, rows };
}

/** Chuẩn hoá không dấu để so khớp tên. */
export function noAccent(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
