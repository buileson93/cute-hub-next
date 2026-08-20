/**
 * @file action-patterns.ts
 * @description Định nghĩa các mẫu hành động chuẩn và phân cấp nút bấm (Button Hierarchy) của MIRATS.
 */

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * Mẫu hành động chuẩn (Action Patterns)
 * Giúp đồng bộ hóa trải nghiệm người dùng trên toàn hệ thống.
 */
export const ACTION_PATTERNS = {
  /** Hành động chính duy nhất của trang hoặc vùng (ví dụ: Thêm tài sản, Lưu). */
  PRIMARY: 'default' as ButtonVariant,
  
  /** Hành động phụ hoặc thoát (ví dụ: Hủy, Quay lại, Đóng). */
  SECONDARY: 'outline' as ButtonVariant,
  
  /** Công cụ trong thanh công cụ hoặc icon-only (ví dụ: Tìm kiếm, Xuất Excel, Cài đặt). */
  UTILITY: 'ghost' as ButtonVariant,
  
  /** Hành động thao tác trên từng dòng của bảng (ví dụ: Sửa, Xoá, Xem chi tiết). */
  ROW_ACTION: 'ghost' as ButtonVariant,
  
  /** Hành động hàng loạt trên nhiều dòng được chọn. */
  BULK_ACTION: 'outline' as ButtonVariant,
  
  /** Xóa vĩnh viễn (Yêu cầu đi kèm ConfirmDialog). */
  DANGER: 'destructive' as ButtonVariant,
} as const;

/**
 * Quy tắc "Duy nhất Nút chính" (One-Default Rule):
 * 1. Mỗi khung nhìn (Page, Dialog, Section) chỉ được có DUY NHẤT MỘT nút variant="default".
 * 2. Ưu tiên: default (chính) > outline (phụ) > ghost (công cụ) > link (điều hướng text).
 */
