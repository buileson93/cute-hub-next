// ============================================================================
// Presentation helper — KHÔNG BAO GIỜ render mã kỹ thuật (UUID) ra giao diện.
// ID vẫn giữ nguyên cho truy vấn/submit/phân quyền; chỉ lớp hiển thị đổi nhãn.
// ============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chuỗi chỉ có ý nghĩa trong CSDL (UUID) — cấm hiển thị cho người dùng. */
export function laMaKyThuat(v: string | null | undefined): boolean {
  const s = (v ?? "").trim();
  return !!s && UUID_RE.test(s);
}

export interface DonViRef {
  id: string;
  ma: string;
  ten: string;
}

/** Nhãn mặc định khi bản ghi liên quan thiếu / đã bị xoá. */
export const DON_VI_FALLBACK = "Chưa xác định";

/**
 * Trả về nhãn nghiệp vụ của đơn vị từ một tham chiếu (id hoặc mã).
 * Thứ tự: Tên đơn vị → Mã đơn vị (nếu có nghĩa) → fallback tiếng Việt.
 */
export function donViLabel(
  ref: string | null | undefined,
  danhSach: readonly DonViRef[] | undefined,
  fallback: string = DON_VI_FALLBACK,
): string {
  const s = (ref ?? "").trim();
  if (!s) return fallback;
  const dv = (danhSach ?? []).find((d) => d.id === s || d.ma === s);
  if (dv?.ten?.trim()) return dv.ten.trim();
  if (dv?.ma?.trim()) return dv.ma.trim();
  return laMaKyThuat(s) ? fallback : s;
}

/** Nhãn đầy đủ "MÃ — Tên" cho trang chi tiết; không lộ UUID. */
export function donViLabelDayDu(
  ref: string | null | undefined,
  danhSach: readonly DonViRef[] | undefined,
  fallback: string = DON_VI_FALLBACK,
): string {
  const s = (ref ?? "").trim();
  const dv = (danhSach ?? []).find((d) => d.id === s || d.ma === s);
  if (dv && dv.ma && dv.ten) return `${dv.ma} — ${dv.ten}`;
  return donViLabel(ref, danhSach, fallback);
}
