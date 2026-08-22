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
  ten?: string;
  label?: string; // Tương thích ngược
  moTa?: string;
  columns?: string[]; // Ưu tiên trường này
  cot?: string[]; // Tương thích ngược
  visibleKeys?: string[]; // Tương thích ngược
  orderKeys?: string[];
  sapXep?: { key: string; dir: "asc" | "desc" };
  filterMacDinh?: Record<string, string | string[]>;
};

/**
 * THIET_BI_PRESETS: Danh sách các khung nhìn mặc định.
 * Cột phải khớp với ID cột khai báo trong StandardTable (trang Danh mục thiết bị).
 */
export const THIET_BI_PRESETS: ViewPreset[] = [
  {
    id: "co-ban",
    ten: "Cơ bản",
    moTa: "6 cột cốt lõi: Tên, Serial, Model, Trạng thái, Hệ thống, Đơn vị",
    columns: ["tb", "serial", "mau", "tt", "ht", "dv"],
    sapXep: { key: "tb", dir: "asc" },
  },
  {
    id: "vong-doi",
    ten: "Vòng đời",
    moTa: "Thông tin mua sắm, bảo hành, tuổi thọ và khai thác",
    columns: ["tb", "serial", "namkt", "namsx", "tuoitho", "tt"],
    sapXep: { key: "namkt", dir: "desc" },
  },
  {
    id: "cap-phat",
    ten: "Cấp phát",
    moTa: "Thông tin ai đang giữ và tình trạng cấp phát",
    columns: ["tb", "serial", "tt", "capphat", "nguoigiu", "dv"],
  },
  {
    id: "nha-cc",
    ten: "Nhà cung cấp",
    moTa: "Thông tin NSX, NCC, Part Number và mã tài sản kế toán",
    columns: ["tb", "serial", "mau", "nsx", "ncc", "bravo", "pn"],
  },
  {
    id: "day-du",
    ten: "Đầy đủ",
    moTa: "Hiển thị toàn bộ các cột thông tin có sẵn",
    columns: [], // Sẽ được điền toàn bộ allKeys trong logic StandardTable
  },
];
