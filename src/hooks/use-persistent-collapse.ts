import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

// GĐ1-03 — nhớ trạng thái đóng/mở của Collapsible per-form.
// Ưu tiên đồng bộ theo user qua `user_layout_prefs` (đồng bộ đa thiết bị),
// đồng thời cache vào localStorage để hiển thị tức thì và fallback khi guest.
//
// Key convention:
//   - localStorage: `mirats:form:<form-id>:<section-id>` = "open" | "closed"
//   - user_layout_prefs.key: `collapse:<form-id>:<section-id>`, value: boolean
export function usePersistentCollapse(formId: string, sectionId: string, defaultOpen = false) {
  const storageKey = `mirats:form:${formId}:${sectionId}`;
  const prefKey = `collapse:${formId}:${sectionId}`;
  const session = useSession();
  const userId = session?.user?.id ?? null;
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedFromServer = useRef(false);

  // 1) Đọc nhanh từ localStorage khi mount / đổi key.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v === "open") setOpen(true);
      else if (v === "closed") setOpen(false);
    } catch {
      /* ignore */
    }
    hydratedFromServer.current = false;
  }, [storageKey]);

  // 2) Nếu đã đăng nhập, đồng bộ giá trị từ server (ghi đè local nếu khác).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_layout_prefs")
        .select("value")
        .eq("user_id", userId)
        .eq("key", prefKey)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const v = data.value as unknown;
      if (typeof v === "boolean") {
        hydratedFromServer.current = true;
        setOpen(v);
        try {
          window.localStorage.setItem(storageKey, v ? "open" : "closed");
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, prefKey, storageKey]);

  const setOpenPersist = useCallback(
    (next: boolean) => {
      setOpen(next);
      try {
        window.localStorage.setItem(storageKey, next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      if (!userId) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void supabase
          .from("user_layout_prefs")
          .upsert(
            { user_id: userId, key: prefKey, value: next as never },
            { onConflict: "user_id,key" },
          );
      }, 400);
    },
    [storageKey, prefKey, userId],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return [open, setOpenPersist] as const;
}
