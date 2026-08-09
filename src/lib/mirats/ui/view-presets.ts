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
  sapXep?: { key: string; huong: "asc" | "desc" };
  filterMacDinh?: Record<string, string | string[]>;
};

export const THIET_BI_PRESETS: ViewPreset[] = [
  {
    id: "co-ban",
    ten: "Cơ bản",
    moTa: "6 cột cốt lõi: Tên, Serial, Model, Trạng thái, Hệ thống, Vị trí",
    cot: ["ten", "ma_serial", "model", "trang_thai", "he_thong", "vi_tri"],
    sapXep: { key: "ten", huong: "asc" },
  },
  {
    id: "vong-doi",
    ten: "Vòng đời",
    moTa: "Thông tin mua sắm, bảo hành, tuổi thọ và khai thác",
    cot: ["ten", "ma_serial", "ngay_mua", "han_bao_hanh", "ty_le_tuoi_tho", "trang_thai"],
    sapXep: { key: "han_bao_hanh", huong: "asc" },
  },
  {
    id: "cap-phat",
    ten: "Cấp phát",
    moTa: "Thông tin ai đang giữ và tình trạng cấp phát",
    cot: ["ten", "ma_serial", "trang_thai_cap_phat", "nguoi_giu", "ngay_cap_phat", "don_vi_giu"],
  },
  {
    id: "nha-cc",
    ten: "Nhà cung cấp",
    moTa: "Thông tin NSX, NCC, Part Number và mã tài sản kế toán",
    cot: ["ten", "ma_serial", "model", "nsx", "nha_cung_cap", "ma_bravo", "pn"],
  },
  {
    id: "day-du",
    ten: "Đầy đủ",
    moTa: "Hiển thị toàn bộ các cột thông tin có sẵn",
    cot: [], // Sẽ được điền toàn bộ allKeys trong logic StandardTable
  },
];
