import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";

/**
 * useUserPref — nhớ tùy biến giao diện theo từng user (đồng bộ qua bảng
 * `user_layout_prefs`). Fallback về localStorage khi chưa đăng nhập.
 *
 * - Đọc lần đầu: query từ DB (staleTime cao).
 * - Ghi: optimistic + debounce 500ms upsert.
 */
export function useUserPref<T>(key: string, defaultValue: T) {
  const session = useSession();
  const userId = session?.user?.id ?? null;
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lsKey = `mirats:pref:${key}`;

  const { data } = useQuery({
    queryKey: ["user-pref", userId ?? "guest", key],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<T> => {
      if (!userId) {
        try {
          const raw = typeof window !== "undefined" ? window.localStorage.getItem(lsKey) : null;
          return raw ? (JSON.parse(raw) as T) : defaultValue;
        } catch {
          return defaultValue;
        }
      }
      const { data, error } = await supabase
        .from("user_layout_prefs")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (error) return defaultValue;
      return (data?.value as T) ?? defaultValue;
    },
  });

  const [local, setLocal] = useState<T>(data ?? defaultValue);
  useEffect(() => { if (data !== undefined) setLocal(data); }, [data]);

  const setPref = useCallback((next: T | ((prev: T) => T)) => {
    setLocal((prev) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      qc.setQueryData(["user-pref", userId ?? "guest", key], value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (userId) {
          await supabase
            .from("user_layout_prefs")
            .upsert(
              { user_id: userId, key, value: value as never },
              { onConflict: "user_id,key" },
            );
        } else {
          try { window.localStorage.setItem(lsKey, JSON.stringify(value)); } catch { /* ignore */ }
        }
      }, 500);
      return value;
    });
  }, [key, lsKey, qc, userId]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return [local, setPref] as const;
}

/** Xoá toàn bộ prefs của user hiện tại (Khôi phục mặc định). */
export async function resetUserPrefs() {
  const { error } = await supabase.rpc("reset_user_layout_prefs");
  if (error) throw error;
}
