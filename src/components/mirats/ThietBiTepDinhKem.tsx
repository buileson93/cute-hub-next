import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, FileText, ImageIcon, Loader2, Download, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropDialog } from "@/components/mirats/ImageCropDialog";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const BUCKET = { hinh_anh: "thiet-bi-hinh-anh", tai_lieu: "thiet-bi-tai-lieu" } as const;
const MAX_MB = 20;

type TepRow = {
  id: string;
  thiet_bi_id: string;
  loai: "hinh_anh" | "tai_lieu";
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  kich_thuoc: number | null;
  mo_ta: string | null;
  created_at: string;
};

function fmtSize(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ThietBiTepDinhKem({ maThietBi }: { maThietBi: string }) {
  const qc = useQueryClient();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  // Resolve maThietBi -> uuid
  const tbQ = useQuery({
    queryKey: ["thiet_bi_by_ma", maThietBi],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi").select("id").eq("ma_thiet_bi", maThietBi).maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
  const tbId = tbQ.data ?? null;

  const listQ = useQuery({
    queryKey: ["thiet_bi_tep", tbId],
    enabled: !!tbId,
    queryFn: async (): Promise<TepRow[]> => {
      const { data, error } = await supabase
        .from("thiet_bi_tep_dinh_kem")
        .select("*")
        .eq("thiet_bi_id", tbId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TepRow[];
    },
  });

  const rows = listQ.data ?? [];
  const images = rows.filter((r) => r.loai === "hinh_anh");
  const docs = rows.filter((r) => r.loai === "tai_lieu");

  const del = useMutation({
    mutationFn: async (row: TepRow) => {
      const { error: se } = await storage.from(row.bucket).remove([row.file_path]);
      if (se) throw se;
      const { error } = await supabase.from("thiet_bi_tep_dinh_kem").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa tệp");
      qc.invalidateQueries({ queryKey: ["thiet_bi_tep", tbId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (tbQ.isLoading) return <div className="text-sm text-muted-foreground">Đang tải…</div>;
  if (!tbId) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Tài sản này chưa có bản ghi trong cơ sở dữ liệu, chưa thể đính kèm tệp.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <ImageUploadDialog thietBiId={tbId} onDone={() => qc.invalidateQueries({ queryKey: ["thiet_bi_tep", tbId] })} />
          <UploadDialog thietBiId={tbId} loai="tai_lieu" onDone={() => qc.invalidateQueries({ queryKey: ["thiet_bi_tep", tbId] })} />
        </div>
      )}

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="h-4 w-4" /> Hình ảnh ({images.length})
        </h3>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có hình ảnh.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((r) => (
              <ImageTile key={r.id} row={r} canManage={canManage} onDelete={() => del.mutate(r)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" /> Tài liệu ({docs.length})
        </h3>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có tài liệu.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((r) => (
              <DocRow key={r.id} row={r} canManage={canManage} onDelete={() => del.mutate(r)} />
            ))}
          </div>
        )}
      </section>
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

function ImageTile({ row, canManage, onDelete }: { row: TepRow; canManage: boolean; onDelete: () => void }) {
  const url = useSignedUrl(row.bucket, row.file_path);
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={row.file_name} className="h-full w-full object-cover" />
          </a>
        ) : (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        )}
        {canManage && (
          <Button size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7 opacity-90"
            onClick={onDelete} aria-label="Xoá">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <CardContent className="p-2">
        <div className="truncate text-xs font-medium" title={row.file_name}>{row.file_name}</div>
        {row.mo_ta && <div className="truncate text-xs text-muted-foreground">{row.mo_ta}</div>}
        <div className="text-[10px] text-muted-foreground">{fmtSize(row.kich_thuoc)}</div>
      </CardContent>
    </Card>
  );
}

function DocRow({ row, canManage, onDelete }: { row: TepRow; canManage: boolean; onDelete: () => void }) {
  const url = useSignedUrl(row.bucket, row.file_path);
  const [viewerOpen, setViewerOpen] = useState(false);
  const canDownload = useCanDownloadAttachments();
  return (
    <div className="flex items-center justify-between rounded-md border p-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0">
          <div className="truncate font-medium" title={row.file_name}>{row.file_name}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">{row.mime_type ?? "PDF"}</Badge>
            <span>{fmtSize(row.kich_thuoc)}</span>
            {row.mo_ta && <span className="truncate">· {row.mo_ta}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {url && (
          <>
            <Button size="sm" variant="ghost" title="Xem" onClick={() => setViewerOpen(true)}><Eye className="h-4 w-4" /></Button>
            <Button asChild size="sm" variant="ghost"><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            {canDownload && (
              <Button asChild size="sm" variant="ghost" title="Tải xuống"><a href={url} download={row.file_name}><Download className="h-4 w-4" /></a></Button>
            )}
          </>
        )}
        {canManage && (
          <Button size="icon" variant="ghost" onClick={onDelete} className="text-red-600" aria-label="Xoá">
            <Trash2 className="h-4 w-4" />
          </Button>
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

const IMG_BUCKET = BUCKET.hinh_anh;

/**
 * Tải ảnh tài sản: dán nhanh từ clipboard (Ctrl+V), kéo-thả, chọn tệp,
 * rồi cắt/zoom theo tỉ lệ (mặc định vuông như avatar) trước khi lưu.
 */
function ImageUploadDialog({ thietBiId, onDone }: { thietBiId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);

  async function handleConfirm(file: File, moTa: string) {
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]+/g, "_") || "anh-thiet-bi";
    const filePath = `${thietBiId}/${crypto.randomUUID()}-${base}.webp`;
    const up = await storage.from(IMG_BUCKET).upload(filePath, file, {
      cacheControl: "3600", upsert: false, contentType: "image/webp",
    });
    if (up.error) throw up.error;
    const { error } = await supabase.from("thiet_bi_tep_dinh_kem").insert({
      thiet_bi_id: thietBiId, loai: "hinh_anh", bucket: IMG_BUCKET,
      file_path: filePath, file_name: file.name, mime_type: "image/webp",
      kich_thuoc: file.size, mo_ta: moTa || null,
    });
    if (error) { await storage.from(IMG_BUCKET).remove([filePath]); throw error; }
    toast.success("Đã tải ảnh lên");
    onDone();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ImageIcon className="mr-2 h-4 w-4" /> Tải ảnh lên
      </Button>
      <ImageCropDialog
        open={open}
        onOpenChange={setOpen}
        title="Tải ảnh tài sản"
        maxMb={MAX_MB}
        withDescription
        outSize={800}
        confirmLabel="Cắt & tải lên"
        onConfirm={handleConfirm}
      />
    </>
  );
}


function UploadDialog({
  thietBiId, loai, onDone,
}: { thietBiId: string; loai: "hinh_anh" | "tai_lieu"; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [moTa, setMoTa] = useState("");
  const [busy, setBusy] = useState(false);

  const accept = loai === "hinh_anh" ? "image/*" : "application/pdf";
  const label = loai === "hinh_anh" ? "Tải ảnh lên" : "Tải PDF lên";
  const bucket = BUCKET[loai];

  const reset = () => { setFile(null); setMoTa(""); };

  async function submit() {
    if (!file) return toast.error("Chưa chọn tệp");
    if (loai === "tai_lieu" && file.type !== "application/pdf") return toast.error("Chỉ nhận file PDF");
    if (loai === "hinh_anh" && !file.type.startsWith("image/")) return toast.error("Chỉ nhận ảnh");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Tệp vượt quá ${MAX_MB}MB`);

    setBusy(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const filePath = `${thietBiId}/${crypto.randomUUID()}-${safeName}`;
      const up = await storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (up.error) throw up.error;

      const { error } = await supabase.from("thiet_bi_tep_dinh_kem").insert({
        thiet_bi_id: thietBiId,
        loai, bucket, file_path: filePath,
        file_name: file.name,
        mime_type: file.type || null,
        kich_thuoc: file.size,
        mo_ta: moTa.trim() || null,
      });
      if (error) {
        // rollback storage
        await storage.from(bucket).remove([filePath]);
        throw error;
      }
      toast.success("Đã tải lên");
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
        <Button size="sm" variant="outline">
          <Upload className="mr-2 h-4 w-4" />{label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Chọn tệp ({loai === "hinh_anh" ? "JPG/PNG/WebP" : "PDF"}, tối đa {MAX_MB}MB)</Label>
            <Input type="file" accept={accept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label>Mô tả (tùy chọn)</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} maxLength={500}
              placeholder="VD: Datasheet nhà sản xuất, ảnh mặt trước…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Hủy</Button>
          <Button onClick={submit} disabled={busy || !file}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Tải lên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
