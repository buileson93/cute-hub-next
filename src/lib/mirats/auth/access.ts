/**
 * Task 35 — Quyết định truy cập route thuần logic (không phụ thuộc React).
 *
 * Đầu vào: trạng thái phiên hiện tại + route đích.
 * Đầu ra: hành động UI nên thực hiện (cho vào / chuyển tới login / chờ duyệt / lỗi).
 *
 * Việc tách pure-logic để test bằng vitest không cần jsdom + supabase.
 */

export type TrangThaiPhien =
  | { kieu: "dang_tai" }
  | { kieu: "chua_dang_nhap" }
  | { kieu: "da_dang_nhap"; is_active_user: boolean };

export type QuyetDinhTruyCap =
  | { hanh_dong: "cho"; ly_do: "dang_tai" }
  | { hanh_dong: "chuyen_huong"; toi: "/auth" | "/pending"; ly_do: string }
  | { hanh_dong: "cho_phep" };

/** Route công khai không cần đăng nhập */
const ROUTE_CONG_KHAI = new Set<string>([
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/pending",
]);

export function laRouteCongKhai(path: string): boolean {
  if (ROUTE_CONG_KHAI.has(path)) return true;
  if (path.startsWith("/api/public/")) return true;
  if (path.startsWith("/q/")) return true; // QR public
  if (path.startsWith("/.well-known/")) return true;
  return false;
}

export function decideAccess(
  phien: TrangThaiPhien,
  path: string,
): QuyetDinhTruyCap {
  const congKhai = laRouteCongKhai(path);

  if (phien.kieu === "dang_tai") {
    // Route công khai render ngay, không cần chờ.
    if (congKhai) return { hanh_dong: "cho_phep" };
    return { hanh_dong: "cho", ly_do: "dang_tai" };
  }

  if (phien.kieu === "chua_dang_nhap") {
    if (congKhai) return { hanh_dong: "cho_phep" };
    return { hanh_dong: "chuyen_huong", toi: "/auth", ly_do: "chua_dang_nhap" };
  }

  // Đã đăng nhập
  if (!phien.is_active_user) {
    // Đang trên /pending thì hiển thị màn chặn; các route khác chuyển về /pending.
    if (path === "/pending") return { hanh_dong: "cho_phep" };
    // Cho phép ở /auth để đăng xuất/đổi tài khoản.
    if (path === "/auth") return { hanh_dong: "cho_phep" };
    return { hanh_dong: "chuyen_huong", toi: "/pending", ly_do: "chua_duyet" };
  }

  // Đã đăng nhập + active: nếu đang ở /auth thì đưa vào trang chính,
  // các route khác cho phép.
  if (path === "/auth") {
    return { hanh_dong: "chuyen_huong", toi: "/pending", ly_do: "da_dang_nhap_roi" };
  }
  return { hanh_dong: "cho_phep" };
}

/**
 * Nhận diện lỗi từ supabase-js/PostgREST là do phiên hết hạn (JWT expired / refresh fail).
 * QUAN TRỌNG: KHÔNG kick soft-signout khi chỉ có HTTP 401 hoặc lỗi RLS (permission denied),
 * vì các lỗi này có thể do GRANT/RLS/policy — không phải phiên hết hạn.
 * Chỉ nhận diện các tín hiệu JWT/refresh rõ ràng để tránh vòng lặp /auth cho MỌI role.
 */
export function laLoiHetPhien(loi: unknown): boolean {
  if (!loi || typeof loi !== "object") return false;
  const anyLoi = loi as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  // Chỉ các mã supabase/gotrue chỉ định phiên: PGRST301/302 = JWT invalid/expired.
  if (anyLoi.code === "PGRST301" || anyLoi.code === "PGRST302") return true;
  if (anyLoi.name === "AuthSessionMissingError") return true;
  const msg = (anyLoi.message ?? "").toLowerCase();
  if (msg.includes("jwt expired")) return true;
  if (msg.includes("jwt is invalid") || msg.includes("invalid jwt")) return true;
  if (msg.includes("invalid refresh token")) return true;
  if (msg.includes("refresh token not found")) return true;
  if (msg.includes("session_not_found")) return true;
  if (msg.includes("session missing")) return true;
  // KHÔNG match `status === 401` trần — 401 có thể do RLS/GRANT, để lớp query xử lý retry.
  return false;
}

