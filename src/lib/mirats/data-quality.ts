// ============================================================================
// Phân loại chất lượng dữ liệu nhập (Data Quality) — HÀM THUẦN, dễ test.
//
// Nhận tín hiệu đã tính sẵn cho MỘT dòng staging (import_item) và xếp nó vào
// một trong các nhóm review mà "Trung tâm rà soát" hiển thị:
//   * unprocessed  — batch chưa xử lý (an toàn, chỉ chờ apply)
//   * possible_dup — có thể trùng (nhiều ứng viên / tên gần giống)
//   * serial_dup   — trùng serial (serial+model+nhà sản xuất)
//   * fk_conflict  — tham chiếu / text không map được sang khóa ngoại
//   * missing      — thiếu trường bắt buộc
//   * near_catalog — danh mục nền gần trùng (guard) — chờ xác nhận
//
// Nguyên tắc: KHÔNG tự sửa. Mọi khả năng trùng đều needs_review; chỉ khớp chắc
// chắn (id / mã unique / serial unique / alias) mới auto_safe.
//
// File client-safe: không import module server-only.
// ============================================================================

import type { MatchResult } from "@/lib/mirats/entity-resolve";

export type ReviewCategory =
  | "unprocessed"
  | "possible_dup"
  | "serial_dup"
  | "fk_conflict"
  | "missing"
  | "near_catalog";

export type ReviewSeverity = "auto_safe" | "needs_review" | "error";

export const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  unprocessed: "Chưa xử lý",
  possible_dup: "Có thể trùng",
  serial_dup: "Trùng serial",
  fk_conflict: "Xung đột tham chiếu",
  missing: "Thiếu dữ liệu",
  near_catalog: "Danh mục gần trùng",
};

export const SEVERITY_LABELS: Record<ReviewSeverity, string> = {
  auto_safe: "An toàn",
  needs_review: "Cần rà soát",
  error: "Lỗi",
};

/** Tín hiệu đã tính sẵn cho một dòng staging. */
export interface ItemSignals {
  /** Key các trường bắt buộc đang để trống. */
  missingRequired: string[];
  /** Key các trường tham chiếu có giá trị nhưng không map được sang khóa ngoại. */
  unresolvedRefs: string[];
  /** Entity là danh mục nền quan trọng (guard). */
  isCatalogGuard: boolean;
  /** Kết quả đối chiếu theo khóa tự nhiên. */
  match: MatchResult;
}

export interface Classification {
  category: ReviewCategory;
  severity: ReviewSeverity;
  reason: string;
}

/**
 * Xếp nhóm một dòng staging theo thứ tự ưu tiên (lỗi nặng trước):
 * thiếu bắt buộc → trùng serial → xung đột FK → có thể trùng / danh mục gần
 * trùng → chưa xử lý (an toàn).
 */
export function classifyItem(s: ItemSignals): Classification {
  // 1) Thiếu trường bắt buộc → lỗi, phải bổ sung trước khi ghi.
  if (s.missingRequired.length > 0) {
    return {
      category: "missing",
      severity: "error",
      reason: `Thiếu trường bắt buộc: ${s.missingRequired.join(", ")}`,
    };
  }

  // 2) Trùng serial (serial + model + nhà sản xuất).
  if (s.match.kind === "serial_model_mfr") {
    const needsReview = s.match.decision !== "resolved";
    return {
      category: "serial_dup",
      severity: needsReview ? "needs_review" : "auto_safe",
      reason: needsReview
        ? "Serial khớp nhiều bản ghi — cần xác nhận cập nhật/gộp"
        : "Serial khớp duy nhất một bản ghi hiện có",
    };
  }

  // 3) Tham chiếu / text không map được sang khóa ngoại.
  if (s.unresolvedRefs.length > 0) {
    return {
      category: "fk_conflict",
      severity: "needs_review",
      reason: `Không map được tham chiếu: ${s.unresolvedRefs.join(", ")}`,
    };
  }

  // 4) Có thể trùng (nhiều ứng viên / tên gần giống / tin cậy thấp).
  if (s.match.decision === "needs_review") {
    if (s.isCatalogGuard) {
      return {
        category: "near_catalog",
        severity: "needs_review",
        reason: s.match.reason || "Danh mục nền gần trùng — chờ xác nhận, không tự tạo",
      };
    }
    return {
      category: "possible_dup",
      severity: "needs_review",
      reason: s.match.reason || "Có ứng viên gần giống — cần xác nhận",
    };
  }

  // 5) Còn lại: an toàn (tạo mới hoặc cập nhật theo khớp chắc chắn).
  return {
    category: "unprocessed",
    severity: "auto_safe",
    reason:
      s.match.decision === "resolved"
        ? "Khớp chắc chắn — cập nhật bản ghi hiện có"
        : "Không trùng — tạo mới an toàn",
  };
}

export interface ReviewMetrics {
  total: number;
  autoSafe: number;
  needsReview: number;
  errors: number;
  autoSafeRate: number;
  needsReviewRate: number;
  errorRate: number;
  byCategory: Record<ReviewCategory, number>;
}

const EMPTY_BY_CATEGORY = (): Record<ReviewCategory, number> => ({
  unprocessed: 0,
  possible_dup: 0,
  serial_dup: 0,
  fk_conflict: 0,
  missing: 0,
  near_catalog: 0,
});

/** Tổng hợp số liệu review từ danh sách phân loại. */
export function summarizeReview(items: Classification[]): ReviewMetrics {
  const byCategory = EMPTY_BY_CATEGORY();
  let autoSafe = 0;
  let needsReview = 0;
  let errors = 0;
  for (const it of items) {
    byCategory[it.category] += 1;
    if (it.severity === "auto_safe") autoSafe += 1;
    else if (it.severity === "needs_review") needsReview += 1;
    else errors += 1;
  }
  const total = items.length;
  const rate = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 1000);
  return {
    total,
    autoSafe,
    needsReview,
    errors,
    autoSafeRate: rate(autoSafe),
    needsReviewRate: rate(needsReview),
    errorRate: rate(errors),
    byCategory,
  };
}
