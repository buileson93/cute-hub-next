// ============================================================================
// view-presets.ts — Định nghĩa các "khung nhìn" (preset) cho bảng tài sản.
//
// View Preset = { id, tên, mô tả, danh sách cột, sắp xếp mặc định, filter mặc định }
// Giúp người dùng chuyển đổi nhanh giữa các góc nhìn khác nhau:
//  • Cơ bản: Cái gì? Ở đâu? Tình trạng thế nào?
//  • Vòng đời: Mua khi nào? Bảo hành bao lâu? Tuổi thọ còn lại?
//  • Cấp phát: Ai giữ? Từ bao giờ?
//  • Nhà cung cấp: NSC / NCC / P/N / Mã Bravo.
// ============================================================================

export type ViewPreset = {
  id: string;
  ten: string;
  moTa: string;
  cot: string[]; // thứ tự + tập cột hiển thị
  sapXep?: { key: string; dir: "asc" | "desc" };
  filterMacDinh?: Record<string, string | string[]>;
};

/**
 * THIET_BI_PRESETS: Danh sách các khung nhìn mặc định.
 * Các ID cột phải khớp với key trong DbDevice (taxonomy) 
 * hoặc key gốc trong database (thiet_bi).
 */
export const THIET_BI_PRESETS: ViewPreset[] = [
  {
    id: "co-ban",
    ten: "Cơ bản",
    moTa: "6 cột cốt lõi: Tên, Serial, Model, Trạng thái, Hệ thống, Đơn vị",
    // Chuyển sang dùng key thực tế (DbDevice/thiet_bi)
    cot: ["ten_thiet_bi", "ma_serial", "model", "trang_thai_id", "he_thong_id", "don_vi_id"],
    sapXep: { key: "ten_thiet_bi", dir: "asc" },
  },
  {
    id: "vong-doi",
    ten: "Vòng đời",
    moTa: "Thông tin mua sắm, bảo hành, tuổi thọ và khai thác",
    cot: ["ten_thiet_bi", "ma_serial", "nam_dua_vao_khai_thac", "nam_san_xuat", "ty_le_tuoi_tho", "trang_thai_id"],
    sapXep: { key: "nam_dua_vao_khai_thac", dir: "desc" },
  },
  {
    id: "cap-phat",
    ten: "Cấp phát",
    moTa: "Thông tin ai đang giữ và tình trạng cấp phát",
    cot: ["ten_thiet_bi", "ma_serial", "trang_thai_id", "trang_thai_cap_phat", "nguoi_giu", "don_vi_giu_id"],
  },
  {
    id: "nha-cc",
    ten: "Nhà cung cấp",
    moTa: "Thông tin NSX, NCC, Part Number và mã tài sản kế toán",
    cot: ["ten_thiet_bi", "ma_serial", "model", "nha_san_xuat_id", "nha_cung_cap_id", "ma_tai_san_bravo", "p_n"],
  },
  {
    id: "day-du",
    ten: "Đầy đủ",
    moTa: "Hiển thị toàn bộ các cột thông tin có sẵn",
    cot: [], // Sẽ được điền toàn bộ allKeys trong logic StandardTable
  },
];
