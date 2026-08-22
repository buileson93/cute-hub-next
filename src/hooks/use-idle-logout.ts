// Task: tự động đăng xuất sau N mili-giây không tương tác.
// Mặc định 3 giờ. Bất kỳ hoạt động chuột / phím / cảm ứng / focus / cuộn
// đều reset đồng hồ. Kèm cross-tab sync qua BroadcastChannel + localStorage
// để 1 tab tương tác thì các tab còn lại cũng được coi là "còn thức".
//
// Nguồn timestamp: `mirats:last-activity` (xem src/lib/mirats/auth/activity.ts).
// Timestamp được reset ở 3 nơi:
//   1. Đăng nhập thành công (server confirm) — trong routes/auth.tsx
//   2. Sự kiện SIGNED_IN / TOKEN_REFRESHED từ Supabase — trong hook này
//   3. Tương tác của user — trong hook này
// Nhờ đó không còn cảnh "đăng nhập xong thì bị đá ra" vì đọc phải timestamp
// cũ của phiên trước.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/backend/client";
import { dangXuatMem } from "@/lib/mirats/auth/soft-signout";
import {
  ACTIVITY_STORAGE_KEY,
  markActivityNow,
  readLastActivity,
} from "@/lib/mirats/auth/activity";

const CHANNEL_NAME = "mirats-activity";
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "focus",
  "visibilitychange",
] as const;

export function useIdleLogout(enabled: boolean, timeoutMs: number = 3 * 60 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const bc = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    bcRef.current = bc;

    const logout = () => {
      void dangXuatMem("idle_timeout");
    };

    const schedule = (remaining: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, Math.max(1000, remaining));
    };

    const scheduleFromStorage = () => {
      const last = readLastActivity();
      const elapsed = last ? Date.now() - last : timeoutMs;
      schedule(timeoutMs - Math.max(0, Math.min(elapsed, timeoutMs)));
    };

    const localActivity = () => {
      markActivityNow();
      bc?.postMessage({ ts: Date.now() });
      schedule(timeoutMs);
    };

    // Mount lần đầu: dựa trên timestamp hiện có. Nếu chưa có (phiên vừa bắt
    // đầu), auth listener bên dưới sẽ được gọi ngay với INITIAL_SESSION và
    // set timestamp mới; ở đây chỉ khởi timer thô theo giá trị đang có.
    scheduleFromStorage();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, localActivity, { passive: true });
    }

    const onBcMessage = (ev: MessageEvent<{ ts: number }>) => {
      if (ev.data?.ts) schedule(timeoutMs);
    };
    bc?.addEventListener("message", onBcMessage);

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === ACTIVITY_STORAGE_KEY && ev.newValue) schedule(timeoutMs);
    };
    window.addEventListener("storage", onStorage);

    // Server confirm: mỗi lần Supabase báo có session mới hoặc token vừa
    // refresh, coi như user vừa hoạt động → reset đồng hồ. Xử lý cả
    // INITIAL_SESSION để tránh dùng timestamp cũ của phiên trước.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        markActivityNow();
        schedule(timeoutMs);
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, localActivity);
      }
      window.removeEventListener("storage", onStorage);
      bc?.removeEventListener("message", onBcMessage);
      bc?.close();
      sub.subscription.unsubscribe();
    };
  }, [enabled, timeoutMs]);
}
