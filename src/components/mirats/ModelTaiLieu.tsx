import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, FileText, Loader2, Download, ExternalLink, Tag, Eye, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Badge } from "@/components/ui/badge";
import { OcrStatusBadge } from "./ocr/OcrStatusBadge";
import { OcrSettings } from "./ocr/OcrSettings";
import { OcrProgressDialog } from "./ocr/OcrProgressDialog";
import { useOcrTask } from "./ocr/useOcrTask";
import { sha256Hex } from "@/lib/storage/compress";
import { ocrRepository } from "@/lib/mirats/document-ocr/repository";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { deviceProfiler } from "@/lib/mirats/document-ocr/device-profiler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { MAX_MB } from "@/lib/mirats/storage-config";

const BUCKET = "model-tai-lieu";

/** Các loại/định nghĩa tài liệu gợi ý (vẫn cho nhập tự do). */
const LOAI_GOI_Y = [
  "Datasheet / Thông số kỹ thuật",
  "Hướng dẫn sử dụng",
  "Hướng dẫn lắp đặt",
  "Sơ đồ đấu nối",
  "Bản vẽ kỹ thuật",
  "Firmware / Phần mềm",
  "Chứng chỉ / CO-CQ",
  "Bảo hành",
  "Khác",
];

type TaiLieuRow = {
  id: string;
  model_id: string;
  loai_tai_lieu: string;
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  kich_thuoc: number | null;
  mo_ta: string | null;
  created_at: string;
  tai_lieu_ocr?: {
    status: string;
    processed_pages: number;
    page_count: number | null;
  } | null;
};

function fmtSize(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ModelTaiLieu({ modelId }: { modelId: string }) {
  const qc = useQueryClient();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const listQ = useQuery({
    queryKey: ["model_tai_lieu", modelId],
    enabled: !!modelId,
    queryFn: async (): Promise<TaiLieuRow[]> => {
      const { data, error } = await supabase
        .from("model_tai_lieu")
        .select("*, tai_lieu_ocr(status, processed_pages, page_count)")
        .eq("model_id", modelId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TaiLieuRow[];
    },
  });

  const rows = listQ.data ?? [];

  const del = useMutation({
    mutationFn: async (row: TaiLieuRow) => {
      await storage.from(row.bucket).remove([row.file_path]);
      const { error } = await supabase.from("model_tai_lieu").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá tài liệu");
      qc.invalidateQueries({ queryKey: ["model_tai_lieu", modelId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" /> Tài liệu ({rows.length})
        </h3>
        {canManage && (
          <UploadDialog
            modelId={modelId}
            onDone={() => qc.invalidateQueries({ queryKey: ["model_tai_lieu", modelId] })}
          />
        )}
      </div>

      {listQ.isLoading ? (
        <div className="text-sm text-muted-foreground">Đang tải…</div>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Chưa có tài liệu. Tải lên datasheet, hướng dẫn, sơ đồ… kèm định nghĩa loại tài liệu.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <DocRow key={r.id} row={r} canManage={canManage} onDelete={() => del.mutate(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function useSignedUrl(bucket: string, path: string, expires = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    storage.from(bucket).createSignedUrl(path, expires).then(({ data }) => {
      if (!cancel) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancel = true; };
  }, [bucket, path, expires]);
  return url;
}

function DocRow({ row, canManage, onDelete }: { row: TaiLieuRow; canManage: boolean; onDelete: () => void }) {
  const url = useSignedUrl(row.bucket, row.file_path);
  const [viewerOpen, setViewerOpen] = useState(false);
  const canDownload = useCanDownloadAttachments();
  return (
    <div className="flex items-center justify-between rounded-md border p-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Tag className="h-3 w-3" /> {row.loai_tai_lieu}
            </Badge>
          </div>
          <div className="mt-0.5 truncate font-medium" title={row.file_name}>{row.file_name}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{fmtSize(row.kich_thuoc)}</span>
            {row.mo_ta && <span className="truncate">· {row.mo_ta}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {url && (
          <>
            <AppTooltip noiDung="Xem trực tiếp trong trình duyệt">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewerOpen(true)}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">Xem</span>
              </Button>
            </AppTooltip>
            <AppTooltip noiDung="Mở trong tab mới">
              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Mở tab mới</span>
                </a>
              </Button>
            </AppTooltip>
            {canDownload && (
              <AppTooltip noiDung="Tải về máy tính">
                <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <a href={url} download={row.file_name}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Tải xuống</span>
                  </a>
                </Button>
              </AppTooltip>
            )}
          </>
        )}
        {canManage && (
          <AppTooltip noiDung="Xoá tài liệu này">
            <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0 text-red-600">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Xoá</span>
            </Button>
          </AppTooltip>
        )}
      </div>
      <DocViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        url={url}
        fileName={row.file_name}
        mimeType={row.mime_type}
      />
    </div>
  );
}

function UploadDialog({ modelId, onDone }: { modelId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loai, setLoai] = useState("");
  const [moTa, setMoTa] = useState("");
  const [busy, setBusy] = useState(false);

  const opts: ComboOption[] = LOAI_GOI_Y.map((v) => ({ value: v, label: v }));
  const reset = () => { setFile(null); setLoai(""); setMoTa(""); };

  async function submit() {
    if (!file) return toast.error("Chưa chọn tệp");
    if (!loai.trim()) return toast.error("Chưa nhập loại/định nghĩa tài liệu");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Tệp vượt quá ${MAX_MB}MB`);

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const filePath = `${modelId}/${crypto.randomUUID()}-${safeName}`;
      const up = await storage.from(BUCKET).upload(filePath, file, {
        cacheControl: "3600", upsert: false, contentType: file.type || undefined,
      });
      if (up.error) throw up.error;

      const { error } = await supabase.from("model_tai_lieu").insert({
        model_id: modelId,
        loai_tai_lieu: loai.trim(),
        bucket: BUCKET,
        file_path: filePath,
        file_name: file.name,
        mime_type: file.type || null,
        kich_thuoc: file.size,
        mo_ta: moTa.trim() || null,
        uploaded_by: u.user?.id ?? null,
      });
      if (error) {
        await storage.from(BUCKET).remove([filePath]);
        throw error;
      }
      toast.success("Đã tải tài liệu lên");
      setOpen(false); reset(); onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải lên thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <AppTooltip noiDung="Tải tài liệu mới lên cho model này">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Upload className="h-4 w-4" />
            <span className="sr-only">Tải tài liệu</span>
          </Button>
        </AppTooltip>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader><DialogTitle>Tải tài liệu cho model</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Loại / định nghĩa tài liệu *</Label>
            <Combobox
              options={opts}
              value={loai}
              onChange={setLoai}
              allowCustom
              placeholder="Chọn hoặc nhập…"
              searchPlaceholder="Tìm / nhập loại tài liệu…"
              emptyText="Nhấn Enter để dùng tên vừa nhập"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Chọn tệp (tối đa {MAX_MB}MB)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-[11px] text-muted-foreground">Hỗ trợ PDF, ảnh, tài liệu văn phòng, firmware…</p>
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả (tuỳ chọn)</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} maxLength={500}
              placeholder="VD: Datasheet phiên bản 2024, ngôn ngữ tiếng Anh…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Huỷ</Button>
          <Button onClick={submit} disabled={busy || !file || !loai.trim()}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Tải lên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
