// ============================================================================
// Nút đính kèm tệp 1 chạm cho công việc dự án.
// - Bấm biểu tượng kẹp giấy → chọn tệp → tải thẳng lên kho `du-an-cong-viec`
//   theo đường dẫn <cong_viec_id>/<uuid>-<tên tệp> (RLS storage bám theo đó).
// - Badge số tệp mở menu tải xuống bằng signed URL.
// ============================================================================
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/backend/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BUCKET = "du-an-cong-viec";
const MAX_BYTES = 50 * 1024 * 1024;

export type TaskAttachment = {
  id: string;
  cong_viec_id: string;
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  kich_thuoc: number | null;
  created_at: string;
};

/** Đường dẫn lưu trữ an toàn: thư mục đầu tiên luôn là id công việc (khớp policy). */
export function buildAttachmentPath(taskId: string, fileName: string): string {
  const safe = fileName
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .slice(-80);
  return `${taskId}/${crypto.randomUUID()}-${safe}`;
}

/** Dung lượng đọc được cho người dùng. */
export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function TaskAttachmentButton({
  taskId,
  taskName,
  canEdit,
  className,
}: {
  taskId: string;
  taskName: string;
  canEdit: boolean;
  className?: string;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ["du-an-cong-viec-tep", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("du_an_cong_viec_tep")
        .select("*")
        .eq("cong_viec_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TaskAttachment[];
    },
    staleTime: 30_000,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BYTES) throw new Error("Tệp vượt quá 50MB");
      const path = buildAttachmentPath(taskId, file.name);
      const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { error } = await supabase.from("du_an_cong_viec_tep").insert({
        cong_viec_id: taskId,
        bucket: BUCKET,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        kich_thuoc: file.size,
      });
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã đính kèm tệp vào công việc");
      qc.invalidateQueries({ queryKey: ["du-an-cong-viec-tep", taskId] });
    },
    onError: (e: Error) => toast.error("Không tải được tệp: " + e.message),
    onSettled: () => setBusy(false),
  });

  const remove = useMutation({
    mutationFn: async (f: TaskAttachment) => {
      const { error } = await supabase.from("du_an_cong_viec_tep").delete().eq("id", f.id);
      if (error) throw error;
      await supabase.storage.from(f.bucket).remove([f.file_path]);
    },
    onSuccess: () => {
      toast.success("Đã xoá tệp đính kèm");
      qc.invalidateQueries({ queryKey: ["du-an-cong-viec-tep", taskId] });
    },
    onError: (e: Error) => toast.error("Không xoá được tệp: " + e.message),
  });

  async function openFile(f: TaskAttachment) {
    const { data, error } = await supabase.storage
      .from(f.bucket)
      .createSignedUrl(f.file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Không tạo được liên kết tải: " + (error?.message ?? "không rõ"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const count = files?.length ?? 0;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          upload.mutate(file);
        }}
      />

      {canEdit ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              aria-label={`Đính kèm tệp cho công việc ${taskName}`}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đính kèm tệp (1 chạm)</TooltipContent>
        </Tooltip>
      ) : null}

      {count > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px] font-medium text-muted-foreground"
              aria-label={`${count} tệp đính kèm của công việc ${taskName}`}
            >
              {count}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">Tệp đính kèm</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoading ? (
              <DropdownMenuItem disabled>Đang tải…</DropdownMenuItem>
            ) : (
              files?.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  className="flex items-center gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    void openFile(f);
                  }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-xs">{f.file_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(f.kich_thuoc)}
                  </span>
                  {canEdit ? (
                    <button
                      type="button"
                      aria-label={`Xoá tệp ${f.file_name}`}
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(f);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </span>
  );
}
