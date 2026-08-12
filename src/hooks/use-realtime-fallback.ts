import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRealtimeStatus } from "./use-realtime-status";

/**
 * Hook tự động kích hoạt polling fallback khi Realtime không khả dụng.
 * @param queryKey QueryKey cần refetch định kỳ
 * @param intervalMs Khoảng thời gian giữa các lần refetch (mặc định 60s)
 */
export function useRealtimeFallback(queryKey: any[], intervalMs: number = 60_000) {
  const qc = useQueryClient();
  const { useFallback } = useRealtimeStatus();

  useEffect(() => {
    if (!useFallback) return;

    const timer = setInterval(() => {
      qc.refetchQueries({ queryKey });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [qc, queryKey, intervalMs, useFallback]);
}
