import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { freshChannel } from "@/lib/realtime/channel";
import { toast } from "sonner";

export type Notification = {
  id: string;
  user_id: string;
  loai: string;
  tieu_de: string;
  noi_dung: string | null;
  link: string | null;
  ref_type: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    load();

    let ch: ReturnType<typeof freshChannel> | null = null;
    try {
      ch = freshChannel(`notif:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const n = payload.new as Notification;
            setItems((prev) => [n, ...prev].slice(0, 50));
            toast(n.tieu_de, { description: n.noi_dung ?? undefined });
          },
        )
        .subscribe();
    } catch (e) {
      // Realtime is a non-critical enhancement — never let it crash the page.
      console.warn("Notifications realtime subscribe failed", e);
    }

    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [userId, load]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    const now = new Date().toISOString();
    // Optimistic: cập nhật UI trước, rollback nếu lỗi.
    const snapshot = items;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", id);
    if (error) {
      setItems(snapshot);
      toast.error("Không đánh dấu được thông báo — đã hoàn tác");
    }
  }
  async function markAllRead() {
    if (!userId) return;
    const now = new Date().toISOString();
    const snapshot = items;
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .is("read_at", null)
      .eq("user_id", userId);
    if (error) {
      setItems(snapshot);
      toast.error("Không đánh dấu tất cả được — đã hoàn tác");
    }
  }

  return { items, unread, loading, markRead, markAllRead, reload: load };
}
