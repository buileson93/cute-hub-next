// ============================================================================
// TaskChecklist — Danh mục việc nhỏ của một công việc dự án (dữ liệu thật).
// Bảng: du_an_cong_viec_checklist. RLS: theo can_edit_cong_viec.
// ============================================================================
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { checklistProgress } from "@/lib/mirats/projects/task-metrics";

export type ChecklistItem = {
  id: string;
  noi_dung: string;
  hoan_thanh: boolean;
  thu_tu: number;
};

export function useTaskChecklist(taskId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["cv-checklist", taskId],
    enabled: enabled && !!taskId,
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("du_an_cong_viec_checklist")
        .select("id,noi_dung,hoan_thanh,thu_tu")
        .eq("cong_viec_id", taskId)
        .order("thu_tu")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function TaskChecklist({
  taskId,
  canEdit,
  enabled = true,
}: {
  taskId: string;
  canEdit: boolean;
  enabled?: boolean;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const { data: items = [], isLoading, isError, error, refetch } = useTaskChecklist(taskId, enabled);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cv-checklist", taskId] });

  const add = useMutation({
    mutationFn: async (noiDung: string) => {
      const value = noiDung.trim();
      if (!value) throw new Error("Nội dung checklist không được để trống.");
      const { error: err } = await supabase.from("du_an_cong_viec_checklist").insert({
        cong_viec_id: taskId,
        noi_dung: value,
        thu_tu: items.length,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error: err } = await supabase
        .from("du_an_cong_viec_checklist")
        .update({ hoan_thanh: !item.hoan_thanh })
        .eq("id", item.id);
      if (err) throw err;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("Không cập nhật được: " + e.message),
  });

  const rename = useMutation({
    mutationFn: async ({ item, value }: { item: ChecklistItem; value: string }) => {
      const next = value.trim();
      if (!next) throw new Error("Nội dung checklist không được để trống.");
      if (next === item.noi_dung) return;
      const { error: err } = await supabase
        .from("du_an_cong_viec_checklist")
        .update({ noi_dung: next })
        .eq("id", item.id);
      if (err) throw err;
    },
    onSuccess: invalidate,
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error: err } = await supabase
        .from("du_an_cong_viec_checklist")
        .delete()
        .eq("id", item.id);
      if (err) throw err;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("Xoá thất bại: " + e.message),
  });

  const percent = checklistProgress(items);

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Không tải được checklist: {(error as Error).message}
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-1.5 flex-1" />
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {items.filter((i) => i.hoan_thanh).length}/{items.length} · {percent}%
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">Chưa có mục checklist nào.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 group">
              <Checkbox
                checked={item.hoan_thanh}
                disabled={!canEdit || toggle.isPending}
                onCheckedChange={() => toggle.mutate(item)}
                aria-label={`Đánh dấu hoàn thành: ${item.noi_dung}`}
              />
              {canEdit ? (
                <Input
                  defaultValue={item.noi_dung}
                  onBlur={(e) => rename.mutate({ item, value: e.target.value })}
                  className="h-9 text-sm border-transparent hover:border-border focus-visible:border-input px-2"
                  aria-label="Nội dung checklist"
                />
              ) : (
                <span className={item.hoan_thanh ? "text-sm line-through text-muted-foreground" : "text-sm"}>
                  {item.noi_dung}
                </span>
              )}
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Xoá mục ${item.noi_dung}`}
                  onClick={() => remove.mutate(item)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!add.isPending) add.mutate(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Thêm mục checklist…"
            className="h-9 text-sm"
            aria-label="Nội dung mục checklist mới"
          />
          <Button type="submit" size="sm" disabled={!draft.trim() || add.isPending}>
            {add.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="sr-only">Thêm mục checklist</span>
          </Button>
        </form>
      )}
    </div>
  );
}
