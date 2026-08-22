// ============================================================================
// Kiểm tra tính hợp lệ cho SỰ CỐ (su_co) — hàm THUẦN (pure), không phụ thuộc
// React/Supabase, để dễ kiểm thử và dùng chung client/server.
//
// Nguyên tắc (đồng bộ với trigger CSDL `validate_su_co`):
//   1. Khoá ngoại: có text tài sản/hệ thống nhưng KHÔNG map được id → cảnh báo
//      (không đoán — chỉ khớp mã chính xác mới được coi là map).
//   2. Không cho KHÔI PHỤC TRƯỚC ngày phát hiện (thoi_diem_khac_phuc <
//      ngay_phat_hien) — dữ liệu vô lý.
//   3. Thời gian gián đoạn (downtime) không âm.
//   4. NGUỒN THỜI GIAN DUY NHẤT: downtime luôn tính bằng `computeDowntimeMinutes`
//      từ (ngay_phat_hien → thoi_diem_khac_phuc) — tránh mỗi nơi tính một kiểu.
// ============================================================================

/** Chuyển "YYYY-MM-DD" (ngày phát hiện) sang mốc đầu ngày (UTC ms). */
function detectionStartMs(ngayPhatHien: string | null | undefined): number | null {
  const v = (ngayPhatHien ?? "").trim();
  if (!v) return null;
  // Chỉ nhận phần ngày để mốc so sánh là 00:00 ngày phát hiện.
  const d = new Date(`${v.slice(0, 10)}T00:00:00Z`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function restoreMs(thoiDiemKhacPhuc: string | null | undefined): number | null {
  const v = (thoiDiemKhacPhuc ?? "").trim();
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * NGUỒN THỜI GIAN DUY NHẤT để tính thời gian gián đoạn (phút).
 * - Thiếu 1 trong 2 mốc → null (chưa xác định).
 * - Không bao giờ trả số âm (khôi phục trước phát hiện → 0, và bị chặn ở validate).
 */
export function computeDowntimeMinutes(
  ngayPhatHien: string | null | undefined,
  thoiDiemKhacPhuc: string | null | undefined,
): number | null {
  const start = detectionStartMs(ngayPhatHien);
  const end = restoreMs(thoiDiemKhacPhuc);
  if (start == null || end == null) return null;
  const mins = Math.round((end - start) / 60000);
  return mins < 0 ? 0 : mins;
}

export type SuCoValidationCode =
  | "restored_before_detected"
  | "negative_downtime"
  | "missing_thiet_bi_fk"
  | "missing_he_thong_fk";

export interface SuCoValidationIssue {
  code: SuCoValidationCode;
  field: string;
  message: string;
}

export interface SuCoTimeInput {
  ngay_phat_hien?: string | null;
  thoi_diem_khac_phuc?: string | null;
  thoi_gian_gian_doan?: number | null;
}

export interface SuCoFkInput {
  thiet_bi?: string | null;
  thiet_bi_id?: string | null;
  he_thong?: string | null;
  he_thong_id?: string | null;
}

/** Kiểm tra các mốc thời gian của sự cố. */
export function validateSuCoTimes(input: SuCoTimeInput): SuCoValidationIssue[] {
  const issues: SuCoValidationIssue[] = [];

  const start = detectionStartMs(input.ngay_phat_hien);
  const end = restoreMs(input.thoi_diem_khac_phuc);
  if (start != null && end != null && end < start) {
    issues.push({
      code: "restored_before_detected",
      field: "thoi_diem_khac_phuc",
      message: "Thời điểm khắc phục không thể trước ngày phát hiện",
    });
  }

  if (typeof input.thoi_gian_gian_doan === "number" && input.thoi_gian_gian_doan < 0) {
    issues.push({
      code: "negative_downtime",
      field: "thoi_gian_gian_doan",
      message: "Thời gian gián đoạn không thể âm",
    });
  }

  return issues;
}

/**
 * Kiểm tra khoá ngoại: có text nhưng chưa map được id → cảnh báo (cần backfill
 * bằng khớp mã chính xác, KHÔNG đoán).
 */
export function validateSuCoFk(input: SuCoFkInput): SuCoValidationIssue[] {
  const issues: SuCoValidationIssue[] = [];
  const tb = (input.thiet_bi ?? "").trim();
  const ht = (input.he_thong ?? "").trim();

  if (tb && !(input.thiet_bi_id ?? "").trim()) {
    issues.push({
      code: "missing_thiet_bi_fk",
      field: "thiet_bi_id",
      message: `Tài sản "${tb}" chưa liên kết được tới CSDL (không khớp mã chính xác)`,
    });
  }
  if (ht && !(input.he_thong_id ?? "").trim()) {
    issues.push({
      code: "missing_he_thong_fk",
      field: "he_thong_id",
      message: `Hệ thống "${ht}" chưa liên kết được tới CSDL`,
    });
  }
  return issues;
}

/** Gộp toàn bộ kiểm tra cho một bản ghi sự cố. */
export function validateSuCo(input: SuCoTimeInput & SuCoFkInput): SuCoValidationIssue[] {
  return [...validateSuCoFk(input), ...validateSuCoTimes(input)];
}
