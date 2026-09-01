// ============================================================================
// Chuẩn hoá View mode / Edit mode cho toàn bộ khu vực "Hệ thống".
//
// Nguyên tắc:
//  - Mặc định luôn ở VIEW MODE (tra cứu).
//  - Chỉ người có quyền GHI miền `he_thong` mới bật được EDIT MODE.
//  - Khi quyền bị thu hồi trong lúc đang ở Edit mode → tự động rơi về View mode.
//  - Mọi thao tác thay đổi dữ liệu phải đi qua `guard()` (kiểm tra kép ở UI
//    lẫn luồng thực thi), không chỉ dựa vào việc ẩn nút.
// ============================================================================

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useUserPref } from "@/hooks/use-user-pref";
import { useSession } from "@/hooks/use-session";
import { canWrite } from "@/lib/mirats/quyen";

/** Khoá lưu tuỳ chọn chế độ chỉnh sửa (dùng chung toàn khu vực Hệ thống). */
export const HE_THONG_EDIT_MODE_PREF = "he-thong:edit-mode";

/** Thông điệp hiển thị khi người dùng không đủ quyền chỉnh sửa. */
export const LY_DO_KHONG_QUYEN =
  "Vai trò của bạn chỉ được xem: cần quyền sửa dữ liệu Hệ thống kỹ thuật (Admin / Phòng KT) để thực hiện thao tác này.";

/** Thông điệp khi đang ở View mode (có quyền nhưng chưa bật Edit mode). */
export const LY_DO_CHUA_BAT_EDIT =
  "Đang ở chế độ xem. Bấm “Chỉnh sửa” để bật chế độ chỉnh sửa trước khi thay đổi dữ liệu.";

/**
 * Chế độ hiệu lực = mong muốn AND có quyền.
 * Hàm thuần để test được mà không cần render.
 */
export function resolveEditMode(allowEdit: boolean, desired: boolean): boolean {
  return allowEdit && desired;
}

export type GuardKetQua = { ok: true } | { ok: false; lyDo: string };

/**
 * Kiểm tra một thao tác thay đổi dữ liệu có được phép chạy hay không.
 * Hàm thuần, dùng chung cho cả UI guard lẫn guard tại thời điểm thực thi.
 */
export function guardMutation(allowEdit: boolean, editMode: boolean): GuardKetQua {
  if (!allowEdit) return { ok: false, lyDo: LY_DO_KHONG_QUYEN };
  if (!editMode) return { ok: false, lyDo: LY_DO_CHUA_BAT_EDIT };
  return { ok: true };
}

export interface HeThongEditModeApi {
  /** Người dùng có quyền ghi miền `he_thong`. */
  allowEdit: boolean;
  /** Chế độ chỉnh sửa đang bật (đã tính cả quyền). */
  editMode: boolean;
  /** Bật/tắt chế độ; bị chặn khi không có quyền. */
  setEditMode: (v: boolean) => void;
  toggle: () => void;
  /** Nhãn hiển thị trạng thái hiện tại. */
  nhan: "Chế độ xem" | "Đang chỉnh sửa";
  /**
   * Bọc một hành động thay đổi dữ liệu: chỉ chạy khi đủ quyền + đang Edit mode,
   * ngược lại hiển thị toast lý do và không thực thi.
   */
  guard: <T>(hanhDong: () => T) => T | undefined;
}

/** Hook dùng chung cho mọi màn hình trong menu Hệ thống. */
export function useHeThongEditMode(externalEditMode?: boolean): HeThongEditModeApi {
  const { roles } = useSession();
  const allowEdit = canWrite("he_thong", roles);
  const [desired, setDesired] = useUserPref<boolean>(HE_THONG_EDIT_MODE_PREF, false);

  const isExternal = externalEditMode !== undefined;
  const editMode = resolveEditMode(allowEdit, isExternal ? externalEditMode : desired);

  // Quyền bị thu hồi khi đang ở Edit mode → hạ về View mode và báo cho người dùng.
  useEffect(() => {
    if (!allowEdit && desired) {
      setDesired(false);
      toast.info("Đã chuyển về chế độ xem do tài khoản không còn quyền chỉnh sửa.");
    }
  }, [allowEdit, desired, setDesired]);

  const setEditMode = useCallback(
    (v: boolean) => {
      if (isExternal) return;
      if (v && !allowEdit) {
        toast.error(LY_DO_KHONG_QUYEN);
        return;
      }
      setDesired(v);
    },
    [allowEdit, isExternal, setDesired],
  );

  const toggle = useCallback(() => setEditMode(!editMode), [editMode, setEditMode]);

  const guard = useCallback(
    <T,>(hanhDong: () => T): T | undefined => {
      const kq = guardMutation(allowEdit, editMode);
      if (!kq.ok) {
        toast.error(kq.lyDo);
        return undefined;
      }
      return hanhDong();
    },
    [allowEdit, editMode],
  );

  return {
    allowEdit,
    editMode,
    setEditMode,
    toggle,
    nhan: editMode ? "Đang chỉnh sửa" : "Chế độ xem",
    guard,
  };
}
