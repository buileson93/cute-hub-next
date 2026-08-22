// ============================================================================
// fail-action.ts — Logic THUẦN: từ hạng mục "KHÔNG ĐẠT" tạo SỰ CỐ / theo dõi.
//
// Khi 1 hạng mục kiểm tra có kết quả "khong_dat" (kèm hành động khắc phục), có
// thể phát sinh 1 SỰ CỐ để theo dõi. Nhưng đây phải là HÀNH ĐỘNG XÁC NHẬN RIÊNG:
//   • KHÔNG tự tạo khi lưu phiếu — người dùng bấm nút "Tạo sự cố" cho từng mục.
//   • IDEMPOTENT — mỗi item_result chỉ sinh TỐI ĐA 1 sự cố (khoá bằng su_co_id).
//   • Có AUDIT — RPC ghi audit_log ai tạo, từ item nào.
//
// Module này chỉ dựng dữ liệu & quyết định "có nên/được tạo không". Việc ghi DB
// (idempotent + audit) do RPC `tao_su_co_tu_ket_qua` đảm nhiệm.
//
// KHÔNG phụ thuộc React/Supabase → test được, dùng chung server/client.
// ============================================================================

import type { KetQua } from "./checklist";

/** Hình dạng tối thiểu của 1 kết quả hạng mục cần cho quyết định. */
export type FailItemResult = {
  id: string;
  submission_id: string;
  item_code: string;
  ten: string;
  ket_qua: KetQua | null;
  gia_tri_so?: number | null;
  don_vi?: string | null;
  tieu_chuan?: string | null;
  ghi_chu?: string | null;
  hanh_dong?: string | null;
  /** Đã tạo sự cố cho hạng mục này chưa (khoá idempotent). */
  su_co_id?: string | null;
};

const isBlank = (v: unknown): boolean => v == null || (typeof v === "string" && v.trim() === "");

/** Hạng mục có ĐỦ ĐIỀU KIỆN để phát sinh sự cố: không đạt + có hành động. */
export function isActionableFail(item: FailItemResult): boolean {
  return item.ket_qua === "khong_dat" && !isBlank(item.hanh_dong);
}

/** Đã tạo sự cố cho hạng mục này rồi? (idempotent guard phía client) */
export function alreadyHasIncident(item: FailItemResult): boolean {
  return !isBlank(item.su_co_id);
}

/** Có nên hiển thị nút "Tạo sự cố" cho hạng mục này không? */
export function canCreateIncident(item: FailItemResult): boolean {
  return isActionableFail(item) && !alreadyHasIncident(item);
}

/** Ngữ cảnh phiếu để điền thông tin sự cố. */
export type SubmissionContext = {
  thiet_bi_id?: string | null;
  he_thong_id?: string | null;
  he_thong?: string | null;
  thiet_bi?: string | null;
  don_vi?: string | null;
  ngay?: string | null; // YYYY-MM-DD; mặc định hôm nay ở RPC
};

/** Payload dựng sẵn cho việc tạo sự cố (RPC nhận và ghi). */
export type SuCoDraft = {
  hien_tuong: string;
  bien_phap_xu_ly: string | null;
  thiet_bi_id: string | null;
  he_thong_id: string | null;
  he_thong: string | null;
  thiet_bi: string | null;
  don_vi: string | null;
  ngay_phat_hien: string | null;
  muc_do: string;
  trang_thai: string;
};

/**
 * Dựng mô tả hiện tượng từ hạng mục không đạt: tên + giá trị đo/tiêu chuẩn +
 * ghi chú. Đây là dữ liệu THUẦN, RPC dùng để INSERT.
 */
export function buildSuCoDraft(item: FailItemResult, ctx: SubmissionContext): SuCoDraft {
  const parts: string[] = [`Bảo dưỡng: hạng mục "${item.ten}" KHÔNG ĐẠT`];
  if (item.gia_tri_so != null) {
    parts.push(`Giá trị đo: ${item.gia_tri_so}${item.don_vi ? " " + item.don_vi : ""}`);
  }
  if (!isBlank(item.tieu_chuan)) parts.push(`Tiêu chuẩn: ${item.tieu_chuan}`);
  if (!isBlank(item.ghi_chu)) parts.push(`Ghi chú: ${item.ghi_chu}`);

  return {
    hien_tuong: parts.join(". "),
    bien_phap_xu_ly: isBlank(item.hanh_dong) ? null : String(item.hanh_dong).trim(),
    thiet_bi_id: ctx.thiet_bi_id ?? null,
    he_thong_id: ctx.he_thong_id ?? null,
    he_thong: ctx.he_thong ?? null,
    thiet_bi: ctx.thiet_bi ?? null,
    don_vi: ctx.don_vi ?? null,
    ngay_phat_hien: ctx.ngay ?? null,
    muc_do: "Trung bình",
    trang_thai: "Mới",
  };
}
