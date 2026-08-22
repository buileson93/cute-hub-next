// ============================================================================
// Kiểu dữ liệu + hàm thuần cho apply/rollback lô nhập (khớp shape JSON của các
// RPC apply_import_batch / preview_rollback_import_batch / rollback_import_batch).
// Tách riêng để test được không cần DB và tái dùng ở UI.
// ============================================================================

export type ApplyResult = {
  ok: boolean;
  created: number;
  updated: number;
  retired: number;
  kept: number;
};

export type RollbackPreviewItem = {
  item_id: string;
  row_index: number;
  action: string;
  target_table: string | null;
  target_id: string | null;
  can_rollback: boolean;
  reason: string | null;
};

export type RollbackPreview = {
  total: number;
  can: number;
  cannot: number;
  items: RollbackPreviewItem[];
};

export type RollbackResult = {
  ok: boolean;
  rolled: number;
  blocked: number;
  blocked_list: Array<{
    item_id: string;
    row_index: number;
    action: string;
    reason: string | null;
  }>;
};

export type RollbackSummary = {
  total: number;
  canCount: number;
  cannotCount: number;
  /** Có ít nhất một dòng bị chặn (record có lịch sử / không còn tồn tại). */
  hasBlocked: boolean;
  /** True khi có thể hoàn tác ít nhất một dòng. */
  canProceed: boolean;
  blocked: RollbackPreviewItem[];
};

/** Tổng hợp kết quả preview để hiển thị và quyết định cho phép hoàn tác. */
export function summarizeRollbackPreview(
  preview: RollbackPreview | null | undefined,
): RollbackSummary {
  const items = preview?.items ?? [];
  const blocked = items.filter((i) => !i.can_rollback);
  const canCount = items.filter((i) => i.can_rollback).length;
  return {
    total: preview?.total ?? items.length,
    canCount: preview?.can ?? canCount,
    cannotCount: preview?.cannot ?? blocked.length,
    hasBlocked: blocked.length > 0,
    canProceed: canCount > 0,
    blocked,
  };
}

/** Nhãn tiếng Việt gọn cho từng loại hành động. */
export function actionLabel(action: string): string {
  switch (action) {
    case "create":
      return "Tạo mới";
    case "update":
      return "Cập nhật";
    case "retire":
      return "Ngừng dùng";
    case "keep":
      return "Giữ nguyên";
    default:
      return action;
  }
}
