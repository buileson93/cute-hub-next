// ============================================================================
// TaskComments — Trao đổi trong công việc dự án (bảng du_an_cong_viec_binh_luan).
// Chỉ người tạo mới sửa/xoá được bình luận của mình (theo RLS).
// ============================================================================
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, Send, Trash2 } from "lucide-react";

export type TaskComment = {
  id: string;
  noi_dung: string;
  created_at: string;
  user_id: string;
};

export function TaskComments({
  taskId,
  currentUserId,
  nameOf,
  enabled = true,
}: {
  taskId: string;
  currentUserId: string | null;
  nameOf: (id: string | null) => string;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const {
    data: comments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cv-binh-luan", taskId],
    enabled: enabled && !!taskId,
    queryFn: async (): Promise<TaskComment[]> => {
      const { data, error: err } = await supabase
        .from("du_an_cong_viec_binh_luan")
        .select("id,noi_dung,created_at,user_id")
        .eq("cong_viec_id", taskId)
        .order("created_at", { ascending: true });
      if (err) throw err;
      return data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cv-binh-luan", taskId] });

  const send = useMutation({
    mutationFn: async (value: string) => {
      const text = value.trim();
      if (!text) throw new Error("Nội dung bình luận trống.");
      const { error: err } = await supabase
        .from("du_an_cong_viec_binh_luan")
        .insert({ cong_viec_id: taskId, noi_dung: text });
      if (err) throw err;
    },
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
    onError: (e: Error) => toast.error("Không gửi được: " + e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase
        .from("du_an_cong_viec_binh_luan")
        .delete()
        .eq("id", id);
      if (err) throw err;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("Xoá thất bại: " + e.message),
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Không tải được trao đổi: {(error as Error).message}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-muted-foreground">Chưa có trao đổi nào.</div>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border bg-muted/30 px-3 py-2 group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{nameOf(c.user_id)}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(c.created_at).toLocaleString("vi-VN")}
                  </span>
                  {currentUserId && c.user_id === currentUserId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label="Xoá bình luận"
                      onClick={() => remove.mutate(c.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap mt-1">{c.noi_dung}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!send.isPending) send.mutate(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Viết trao đổi…"
          rows={2}
          className="text-sm"
          aria-label="Nội dung trao đổi"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!draft.trim() || send.isPending}>
            {send.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            )}
            Gửi
          </Button>
        </div>
      </form>
    </div>
  );
}
