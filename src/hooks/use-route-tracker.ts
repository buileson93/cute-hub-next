import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

/**
 * Các đường dẫn chi tiết được ghi nhận vào lịch sử "Gần đây".
 * Chỉ ghi khi khớp prefix và có id/mã ở sau (không ghi trang danh sách).
 */
const DETAIL_PREFIXES = [
  "/thiet-bi/",
  "/su-co/",
  "/he-thong/",
  "/bao-tri/",
  "/hong-hoc/",
  "/du-an/",
  "/so-do/",
  "/tickets/",
  "/forms/submissions/",
  "/admin/forms/",
] as const;

function shouldTrack(path: string): boolean {
  return DETAIL_PREFIXES.some((p) => {
    if (!path.startsWith(p)) return false;
    const rest = path.slice(p.length);
    return rest.length > 0 && !rest.includes("/");
  });
}

function readLabel(path: string): string {
  if (typeof document !== "undefined" && document.title) {
    // head() thường đặt "Tên trang — MIRATS" / "... | MIRATS"
    return document.title.replace(/\s*[—|·-]\s*MIRATS.*$/i, "").trim() || path;
  }
  return path;
}

/**
 * Tự động ghi nhận URL đang xem vào bảng `user_recent` (giới hạn 10 mục
 * gần nhất) khi user đăng nhập và đang ở một trang chi tiết.
 */
export function useRouteTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const userId = user?.id ?? null;
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!shouldTrack(path)) return;
    if (lastRef.current === path) return;
    lastRef.current = path;
    // Đợi title được cập nhật bởi route.head()
    const t = setTimeout(() => {
      void supabase.rpc("record_user_recent", { _path: path, _label: readLabel(path) });
    }, 400);
    return () => clearTimeout(t);
  }, [path, userId]);
}
