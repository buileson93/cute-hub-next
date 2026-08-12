import { useEffect, useState } from "react";
import { supabase } from "@/integrations/backend/client";

export type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Hook để theo dõi trạng thái kết nối Realtime toàn cục.
 * Trả về status và một cờ báo hiệu có nên dùng polling fallback hay không.
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const channel = supabase.channel("realtime-healthcheck");

    channel
      .subscribe((newStatus) => {
        if (newStatus === "SUBSCRIBED") {
          setStatus("connected");
          setUseFallback(false);
        } else if (newStatus === "CLOSED") {
          setStatus("disconnected");
          setUseFallback(true);
        } else if (newStatus === "CHANNEL_ERROR") {
          setStatus("error");
          setUseFallback(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { status, useFallback };
}
