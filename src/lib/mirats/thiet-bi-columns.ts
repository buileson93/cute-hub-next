// ============================================================================
// Nguồn dùng chung cho BẢNG tài sản (listview) và XUẤT MẪU nhập liệu.
//
// Trước đây danh sách cột này nằm trong route he-thong.cay.tsx và khai lại tên
// cột nhập liệu (`imp`) bằng tay → dễ lệch với import-config.ts. Nay tách ra
// module riêng để:
//   * route dùng cho listview / bulk-edit,
//   * export-template dùng để biết cột nào xuất được,
//   * test chốt: mọi `imp` phải là một trường hợp lệ trong import-config.
//
// KHÔNG import module server-only ở đây (dùng cả client lẫn test).
// ============================================================================

export type ColKey =
  | "pl" | "nh" | "ht" | "tb" | "tp" | "vtcn" | "loai"
  | "tt" | "bravo" | "serial" | "pn" | "model" | "mau" | "thanhphan"
  | "nsx" | "ncc"
  | "namsx" | "namkt" | "tyle" | "ngaymua" | "baohanh"
  | "vt" | "phanloai" | "noiql" | "ghichu"
  | "dacTinh";

export type TableCol = {
  key: ColKey;
  label: string;
  group: string;
  minW: string;
  type: "cat" | "text";
  /** Cột vật lý trên thiet_bi → cho sửa trực tiếp trong bảng (chế độ chỉnh sửa). */
  editCol?: string;
  editType?: "text" | "number" | "date";
  /** Tên cột khi xuất mẫu nhập liệu hàng loạt (PHẢI là 1 trường của entity `thiet_bi` trong import-config). */
  imp?: string;
  /** Hiển thị mặc định. */
  def?: boolean;
};

export const TABLE_COLS: TableCol[] = [
  // Cấu trúc phân lớp (chỉ đọc)
  { key: "pl", label: "Phân loại", group: "Cấu trúc", minW: "min-w-[120px]", type: "cat", def: true },
  { key: "nh", label: "Nhóm hệ thống", group: "Cấu trúc", minW: "min-w-[150px]", type: "cat", def: true },
  { key: "ht", label: "Hệ thống", group: "Cấu trúc", minW: "min-w-[220px]", type: "text", def: true },
  { key: "tb", label: "Tài sản", group: "Cấu trúc", minW: "min-w-[200px]", type: "text", def: true },
  { key: "tp", label: "Tài sản con", group: "Cấu trúc", minW: "min-w-[180px]", type: "text", def: true },
  { key: "vtcn", label: "Thành phần hệ thống", group: "Cấu trúc", minW: "min-w-[170px]", type: "cat", def: true },
  { key: "loai", label: "Chủng loại", group: "Cấu trúc", minW: "min-w-[150px]", type: "cat", def: true },
  // Định danh & kỹ thuật (sửa trực tiếp)
  { key: "tt", label: "Trạng thái", group: "Định danh & kỹ thuật", minW: "", type: "cat", imp: "trang_thai", def: true },
  { key: "serial", label: "Số serial", group: "Định danh & kỹ thuật", minW: "min-w-[120px]", type: "text", editCol: "ma_serial", editType: "text", imp: "ma_serial", def: true },
  { key: "model", label: "Model", group: "Định danh & kỹ thuật", minW: "min-w-[120px]", type: "text", editCol: "model", editType: "text", imp: "model", def: true },
  { key: "mau", label: "Model", group: "Định danh & kỹ thuật", minW: "min-w-[170px]", type: "text", def: true },
  { key: "pn", label: "P/N", group: "Định danh & kỹ thuật", minW: "min-w-[110px]", type: "text", editCol: "p_n", editType: "text", imp: "p_n" },
  { key: "bravo", label: "Mã tài sản Bravo", group: "Định danh & kỹ thuật", minW: "min-w-[130px]", type: "text", editCol: "ma_tai_san_bravo", editType: "text", imp: "ma_tai_san_bravo" },
  { key: "thanhphan", label: "Thành phần", group: "Định danh & kỹ thuật", minW: "min-w-[140px]", type: "text", editCol: "thanh_phan", editType: "text", imp: "thanh_phan" },
  // Nhà sản xuất / cung cấp (đọc — quản lý qua danh mục)
  { key: "nsx", label: "Nhà sản xuất", group: "Nhà SX / cung cấp", minW: "min-w-[140px]", type: "cat", imp: "nha_san_xuat" },
  { key: "ncc", label: "Nhà cung cấp", group: "Nhà SX / cung cấp", minW: "min-w-[140px]", type: "cat", imp: "nha_cung_cap" },
  // Thời gian & tuổi thọ (sửa trực tiếp)
  { key: "namsx", label: "Năm sản xuất", group: "Thời gian & tuổi thọ", minW: "", type: "text", editCol: "nam_san_xuat", editType: "number", imp: "nam_san_xuat" },
  { key: "namkt", label: "Năm khai thác", group: "Thời gian & tuổi thọ", minW: "", type: "text", editCol: "nam_dua_vao_khai_thac", editType: "number", imp: "nam_dua_vao_khai_thac" },
  { key: "tyle", label: "Tỷ lệ tuổi thọ (%)", group: "Thời gian & tuổi thọ", minW: "", type: "text", editCol: "ty_le_tuoi_tho", editType: "number", imp: "ty_le_tuoi_tho" },
  { key: "ngaymua", label: "Ngày mua", group: "Thời gian & tuổi thọ", minW: "min-w-[120px]", type: "text", editCol: "ngay_mua", editType: "date", imp: "ngay_mua" },
  { key: "baohanh", label: "Hạn bảo hành", group: "Thời gian & tuổi thọ", minW: "min-w-[120px]", type: "text", editCol: "han_bao_hanh", editType: "date", imp: "han_bao_hanh" },
  // Quản lý & vị trí (sửa trực tiếp)
  { key: "vt", label: "Vị trí", group: "Quản lý & vị trí", minW: "min-w-[120px]", type: "cat", editCol: "vi_tri", editType: "text", imp: "vi_tri", def: true },
  { key: "phanloai", label: "Phân loại (TB)", group: "Quản lý & vị trí", minW: "min-w-[120px]", type: "text", editCol: "phan_loai", editType: "text", imp: "phan_loai" },
  { key: "noiql", label: "Nơi quản lý", group: "Quản lý & vị trí", minW: "min-w-[130px]", type: "text", editCol: "noi_quan_ly", editType: "text", imp: "noi_quan_ly" },
  { key: "ghichu", label: "Ghi chú", group: "Quản lý & vị trí", minW: "min-w-[160px]", type: "text", editCol: "ghi_chu", editType: "text", imp: "ghi_chu" },
  // Nhãn tài sản (đa trị, kế thừa từ Mẫu qua v_thiet_bi_dac_tinh — hiển thị chip, không sửa trực tiếp).
  { key: "dacTinh", label: "Nhãn tài sản", group: "Nhãn tài sản", minW: "min-w-[220px]", type: "text" },
];

export const TABLE_COL_GROUPS: string[] = Array.from(new Set(TABLE_COLS.map((c) => c.group)));

/**
 * Header cố định luôn có mặt khi xuất model (khóa + tên + hệ thống),
 * đứng trước các cột `imp` đang hiển thị.
 */
export const DEVICE_EXPORT_FIXED_HEADERS = ["ma_thiet_bi", "ten_thiet_bi", "he_thong"] as const;

/** Toàn bộ tên cột (CSV) có thể xuất ra ở model = header cố định + mọi `imp`. */
export function deviceExportHeaderKeys(): string[] {
  const out = new Set<string>(DEVICE_EXPORT_FIXED_HEADERS);
  for (const c of TABLE_COLS) if (c.imp) out.add(c.imp);
  return [...out];
}
