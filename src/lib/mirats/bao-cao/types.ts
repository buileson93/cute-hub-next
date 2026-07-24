// ============================================================================
// bao-cao/types.ts — Kiểu dữ liệu thuần cho tầng xuất báo cáo.
// Tầng "build dữ liệu" trả về các cấu trúc dưới đây; tầng "route xuất"
// chuyển thành PDF/Excel. Tách bạch để có thể test không cần I/O.
// ============================================================================

export type LoaiBaoCao =
  | "ly_lich_thiet_bi"
  | "bao_duong_ky"
  | "sap_het_han";

export interface BaoCaoMeta {
  loai: LoaiBaoCao;
  tieu_de: string;
  tao_luc: string;      // ISO string
  ky_bat_dau?: string;  // ISO
  ky_ket_thuc?: string; // ISO
  don_vi?: string | null;
  ghi_chu?: string | null;
}

export interface BaoCaoCot {
  key: string;
  nhan: string;
  /** Kiểu định dạng khi xuất: mặc định 'text'. */
  kieu?: "text" | "so" | "ngay" | "trang_thai";
  /** Rộng gợi ý (excel). */
  rong?: number;
}

export interface BaoCaoBang {
  ma: string;
  ten: string;
  cot: BaoCaoCot[];
  hang: Array<Record<string, unknown>>;
  /** Dòng tóm tắt (VD: tổng, trung bình) đặt cuối bảng. */
  tom_tat?: Record<string, unknown> | null;
}

export interface BaoCaoData {
  meta: BaoCaoMeta;
  bang: BaoCaoBang[];
  /** Số liệu tổng hợp toàn báo cáo. */
  kpi?: Array<{ ma: string; nhan: string; gia_tri: string | number }>;
}

/** Nguồn dữ liệu thô đầu vào cho các builder. Giữ đơn giản để test. */
export interface NguonBaoCao {
  thiet_bi?: Array<{
    id: string;
    ma: string;
    ten: string;
    don_vi?: string | null;
    he_thong?: string | null;
    ngay_dua_vao?: string | null;
    ngay_kiem_ke_ke_tiep?: string | null;
    trang_thai?: string | null;
  }>;
  bao_tri?: Array<{
    id: string;
    thiet_bi_id?: string | null;
    thiet_bi_ma?: string | null;
    thiet_bi_ten?: string | null;
    ngay_thuc_hien?: string | null;
    ngay_ke_tiep?: string | null;
    ket_qua?: string | null;
    trang_thai_duyet?: string | null;
    nguoi_thuc_hien?: string | null;
  }>;
  su_co?: Array<{
    id: string;
    thiet_bi_id?: string | null;
    thiet_bi_ma?: string | null;
    mo_ta?: string | null;
    thoi_diem?: string | null;
    mtr_phut?: number | null;
    trang_thai?: string | null;
  }>;
  giay_phep?: Array<{
    id: string;
    so_gp?: string | null;
    ten_gp?: string | null;
    han_gp?: string | null;
    he_thong?: string | null;
    don_vi?: string | null;
  }>;
}
