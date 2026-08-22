import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

/**
 * Subscribe realtime cho các bảng cấu trúc hệ thống kỹ thuật.
 * Bất kỳ INSERT/UPDATE/DELETE nào cũng invalidate các query cây/mindmap/bảng
 * để giao diện đồng bộ ngay không cần reload.
 *
 * Dùng ở các trang Hệ thống (cây / mindmap / bảng thành phần).
 *
 * Ghi log client-side khi subscribe gặp sự cố để dễ truy vết khi tab Bảng
 * không load được (kèm route hiện tại + tên channel duy nhất).
 */
export function useRealtimeTaxonomy() {
  const qc = useQueryClient();
  // Giữ tên channel duy nhất cho mỗi lần mount — không đổi giữa các render.
  const channelNameRef = useRef<string>(`rt:taxonomy:${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const channelName = channelNameRef.current;
    const route = typeof window !== "undefined" ? window.location.pathname : "(ssr)";

    const keys = [
      ["vi-tri-chuc-nang-all"],
      ["thanh-phan-toan-cuc"],
      ["net-all-thanh-phan"],
      ["net-inline-inner"],
      ["thanh_phan_cua_he_thong"],
      ["db_taxonomy"],
      ["cay_node_edit"],
      ["operations_data"],
      ["he_thong_thanh_phan:count"],
    ] as const;
    const bust = () => {
      for (const k of keys) qc.invalidateQueries({ queryKey: k as unknown as readonly unknown[] });
    };

    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "he_thong_thanh_phan" },
          bust,
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "gan_chuc_nang" }, bust)
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_he_thong" }, bust)
        .on("postgres_changes", { event: "*", schema: "public", table: "thiet_bi" }, bust)
        .on("postgres_changes", { event: "*", schema: "public", table: "cay_node_edit" }, bust)
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.warn("[realtime-taxonomy] subscribe status", {
              status,
              channel: channelName,
              route,
              error: err?.message ?? String(err ?? ""),
            });
          }
        });
    } catch (e) {
      console.error("[realtime-taxonomy] subscribe threw", {
        channel: channelName,
        route,
        error: e instanceof Error ? e.message : String(e),
      });
      // Không throw ra ngoài — để trang vẫn render, chỉ mất tính năng realtime.
    }

    return () => {
      // Unsubscribe an toàn khi unmount — nuốt mọi lỗi để không leak vào React.
      try {
        if (ch) supabase.removeChannel(ch);
      } catch (e) {
        console.warn("[realtime-taxonomy] removeChannel failed", {
          channel: channelName,
          route,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };
  }, [qc]);
}
