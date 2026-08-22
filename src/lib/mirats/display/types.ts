// ============================================================================
// Task 27 — Kiểu dữ liệu cho display registry.
// Registry là NGUỒN DUY NHẤT quyết định: mỗi thực thể hiển thị field nào, nhãn
// gì, thứ tự ra sao, field nào là highlight, field nào là badge trạng thái.
// Dùng lại ở hover popup, sidebar, header chi tiết, thẻ tóm tắt…
// ============================================================================

import type { Domain as TrangThaiDomain } from "@/lib/mirats/trang-thai";

/** Các thực thể có mặt trong registry. */
export type EntityLoai =
  | "thiet_bi"
  | "su_co"
  | "van_de"
  | "cong_viec"
  | "hong_hoc"
  | "ban_giao"
  | "giay_phep"
  | "vat_tu"
  | "dm_model";

/** Kiểu định dạng của một trường hiển thị. */
export type FieldLoai =
  | "text" // chuỗi thô
  | "status" // trạng thái theo trang-thai.ts (cần `domain`)
  | "date" // ISO/Date → dd/MM/yyyy
  | "datetime" // ISO/Date → dd/MM/yyyy HH:mm
  | "vnd" // số → format tiền
  | "so" // số → nhóm nghìn
  | "expiring"; // ngày hết hạn → "còn X ngày" / "quá hạn X ngày"

export interface FieldView {
  /** Tên cột trong CSDL / khoá trong bản ghi. */
  key: string;
  /** Nhãn hiển thị cho người dùng. */
  nhan: string;
  loai: FieldLoai;
  /** Trường quan trọng — ưu tiên vị trí đầu, đậm hơn. */
  highlight?: boolean;
  /** Bắt buộc khi loai='status'. */
  domain?: TrangThaiDomain;
}

export interface EntityView {
  /** Nhãn khái niệm hiển thị (VD "Tài sản"). */
  ten: string;
  /** Tiêu đề chính lấy từ row. */
  tieuDe: (row: Record<string, unknown>) => string;
  /** Dòng phụ dưới tiêu đề (mã, đơn vị, ...). */
  phu?: (row: Record<string, unknown>) => string;
  /** Trường trạng thái để render badge — dùng chung `StatusBadge` (Task 25). */
  badgeTrangThai?: { domain: TrangThaiDomain; key: string };
  /** 2–4 field then chốt, hiển thị đậm/đầu tiên trong hover / card. */
  highlight: FieldView[];
  /** Toàn bộ trường hiển thị đầy đủ ở drawer / chi tiết. */
  chiTiet: FieldView[];
}

/** Kết quả `renderField` — mọi UI dùng chung struct này. */
export interface RenderedField {
  nhan: string;
  giaTri: string;
  highlight: boolean;
  /** Với `expiring`: âm = quá hạn, dương = còn lại, null = không có ngày. */
  soNgay?: number | null;
}
