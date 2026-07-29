/**
 * Task 35 — Đăng xuất mềm khi refresh token hết hạn / 401 lặp.
 *
 * Mục tiêu: khi supabase trả lỗi phiên hết hạn, xoá session + cache và
 * đưa về /auth một lần duy nhất, không tạo vòng lặp redirect.
 */
import { supabase } from "@/integrations/backend/client";
import { laLoiHetPhien } from "./access";

let dangDangXuat = false;

export function daKhoiDongDangXuat(): boolean {
  return dangDangXuat;
}

/**
 * Gọi khi phát hiện lỗi 401/refresh. An toàn khi gọi nhiều lần: chỉ chạy 1 lần
 * cho tới khi trang được reload.
 */
export async function dangXuatMem(ly_do: string = "het_phien"): Promise<void> {
  if (dangDangXuat) return;
  if (typeof window === "undefined") return;
  dangDangXuat = true;
  try {
    await supabase.auth.signOut().catch(() => {
      /* đã hết phiên rồi thì bỏ qua */
    });
  } finally {
    // Không dùng router để tránh vòng redirect khi lỗi xảy ra trong loader.
    // hash-flag giúp trang /auth biết hiển thị thông báo nhẹ.
    const url = new URL(window.location.href);
    if (url.pathname !== "/auth") {
      window.location.replace(`/auth?het_phien=1&ly_do=${encodeURIComponent(ly_do)}`);
    }
  }
}

/**
 * Cắm listener global: nếu bất kỳ Promise reject nào là lỗi hết phiên → đăng xuất mềm.
 * Gọi một lần ở root.
 */
export function cauHinhBatLoiHetPhien(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (ev: PromiseRejectionEvent) => {
    if (laLoiHetPhien(ev.reason)) {
      void dangXuatMem("promise_rejection");
    }
  };
  window.addEventListener("unhandledrejection", handler);
  return () => window.removeEventListener("unhandledrejection", handler);
}
