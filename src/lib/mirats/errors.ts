// Chuẩn hoá thông điệp lỗi từ Supabase/PostgREST cho toast.
// - PostgrestError không phải instance Error → `e.message` vẫn có nhưng
//   `e instanceof Error === false` khiến toast rơi về fallback vô nghĩa.
// - Khi 42501 (permission denied) và không có phiên → phiên đã hết → soft signout
//   để user login lại thay vì loop "Lưu thất bại".
import { supabase } from "@/integrations/backend/client";
import { dangXuatMem } from "@/lib/mirats/auth/soft-signout";

interface LoiCoTruongMessage {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

function laObject(v: unknown): v is LoiCoTruongMessage {
  return !!v && typeof v === "object";
}

/**
 * Trả về text hiển thị cho toast từ bất kỳ nguồn lỗi nào (Error, PostgrestError,
 * chuỗi, object lạ). `fallback` dùng khi không rút được thông tin.
 */
export function thongDiepLoi(loi: unknown, fallback: string): string {
  if (typeof loi === "string" && loi.trim()) return loi;
  if (loi instanceof Error && loi.message) return loi.message;
  if (laObject(loi)) {
    const parts = [loi.message, loi.hint, loi.details].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    if (parts.length) return parts.join(" — ");
  }
  return fallback;
}

/**
 * Nếu lỗi là "permission denied" (42501) trong khi client không có phiên hợp lệ,
 * kích hoạt soft signout để user đăng nhập lại. Trả về `true` nếu đã kick.
 */
export async function kickNeuHetPhien(loi: unknown): Promise<boolean> {
  if (!laObject(loi)) return false;
  const isPermDenied =
    loi.code === "42501" ||
    (typeof loi.message === "string" && loi.message.toLowerCase().includes("permission denied"));
  if (!isPermDenied) return false;
  // `getSession()` chỉ đọc phiên đang cache trong trình duyệt; khi refresh token
  // đã bị thu hồi, nó vẫn có thể trả về session cũ khiến request tiếp tục đi với
  // token hỏng/role anon. `getUser()` gọi backend auth để xác thực lại thật sự.
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return false; // có phiên thật → là lỗi quyền, để nguyên
  await dangXuatMem("permission_denied_no_session");
  return true;
}
