// ============================================================================
// PhotoUpload.tsx — Upload nhiều tệp (ảnh/tệp bất kỳ) vào bucket
// `form-attachments`, hiển thị preview + nút xoá. Giá trị lưu là mảng
// FormAttachment (JSON) để đưa vào form_submission.data.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, FileText, Image as ImageIcon, Check, Copy as CopyIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  type FormAttachment,
  type UploadStatus,
  removeAttachment,
  signedUrl,
  uploadAttachment,
} from "@/lib/mirats/form-attachments";
import { runQueue } from "@/lib/storage/compress";

const CONCURRENCY = 3;

type Row = {
  key: string;
  name: string;
  size: number;
  status: UploadStatus;
};

function labelOf(s: UploadStatus): string {
  switch (s.phase) {
    case "queued": return "Đang chờ";
    case "hashing": return "Kiểm tra trùng";
    case "compressing": return "Đang nén";
    case "dedup": return "Trùng nội dung – bỏ qua";
    case "uploading": return `Tải lên ${s.progress ?? 0}%`;
    case "done": return "Hoàn tất";
    case "error": return `Lỗi: ${s.message ?? ""}`;
  }
}

function pctOf(s: UploadStatus): number {
  switch (s.phase) {
    case "queued": return 0;
    case "compressing": return 10;
    case "hashing": return 25;
    case "uploading": return 35 + Math.round(((s.progress ?? 0) * 60) / 100);
    case "dedup":
    case "done": return 100;
    case "error": return 100;
  }
}

function colorOf(s: UploadStatus): string {
  if (s.phase === "error") return "bg-rose-500";
  if (s.phase === "done" || s.phase === "dedup") return "bg-emerald-500";
  return "bg-primary";
}

export function PhotoUpload({
  value,
  onChange,
  templateCode,
  draftId,
  fieldKey,
  photoOnly = false,
  disabled = false,
  maxFiles = 10,
}: {
  value: FormAttachment[];
  onChange: (list: FormAttachment[]) => void;
  templateCode: string;
  draftId: string;
  fieldKey: string;
  photoOnly?: boolean;
  disabled?: boolean;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);

  // Sign preview URL cho các attachment ảnh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const a of value) {
        if (!a.type?.startsWith("image/")) continue;
        if (urls[a.path]) { next[a.path] = urls[a.path]; continue; }
        const u = await signedUrl(a.path, 3600);
        if (u) next[a.path] = u;
      }
      if (!cancelled) setUrls(next);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (value.length + files.length > maxFiles) {
      toast.error(`Chỉ đính kèm tối đa ${maxFiles} tệp cho trường này.`);
      return;
    }
    setBusy(true);
    const arr = Array.from(files);
    const initRows: Row[] = arr.map((f, i) => ({
      key: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      size: f.size,
      status: { phase: "queued" },
    }));
    setRows(initRows);

    const results = await runQueue(arr, CONCURRENCY, async (file, i) => {
      if (photoOnly && !file.type.startsWith("image/")) {
        setRows((prev) => prev.map((r, k) => k === i
          ? { ...r, status: { phase: "error", message: "Không phải ảnh" } }
          : r));
        return null;
      }
      try {
        const att = await uploadAttachment(file, {
          templateCode, draftId, fieldKey,
          onStatus: (st) => setRows((prev) => prev.map((r, k) => k === i ? { ...r, status: st } : r)),
        });
        if (att.dedup) toast.success(`"${file.name}" đã tồn tại — dùng lại bản cũ.`);
        return att;
      } catch (e) {
        toast.error(`Upload thất bại: ${(e as Error).message}`);
        return null;
      }
    });

    const next: FormAttachment[] = [...value];
    for (const r of results) if (r) next.push(r);
    onChange(next);
    setBusy(false);
    // Giữ danh sách trạng thái vài giây để người dùng thấy tổng kết, rồi tự xoá.
    setTimeout(() => setRows([]), 4000);
    if (inputRef.current) inputRef.current.value = "";
  };


  const remove = async (att: FormAttachment) => {
    if (!confirm(`Xoá "${att.name}"?`)) return;
    try {
      await removeAttachment(att.path);
    } catch { /* vẫn xoá khỏi list — tệp có thể đã bị dọn */ }
    onChange(value.filter((x) => x.path !== att.path));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef} type="file" hidden multiple
        accept={photoOnly ? "image/*" : undefined}
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button
        type="button" variant="outline" size="sm"
        onClick={pick} disabled={disabled || busy || value.length >= maxFiles}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {photoOnly ? "Thêm ảnh" : "Thêm tệp"} ({value.length}/{maxFiles})
      </Button>

      {rows.length > 0 && (
        <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
          {rows.map((r) => {
            const pct = pctOf(r.status);
            const savings = r.status.compressedSize && r.status.compressedSize < r.size
              ? ` · ${Math.round((1 - r.status.compressedSize / r.size) * 100)}% nhỏ hơn`
              : "";
            return (
              <div key={r.key} className="text-meta">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {r.status.phase === "done" && <Check className="h-3 w-3 text-emerald-600" />}
                  {r.status.phase === "dedup" && <CopyIcon className="h-3 w-3 text-emerald-600" />}
                  {r.status.phase === "error" && <AlertCircle className="h-3 w-3 text-rose-600" />}
                  <span className="truncate flex-1">{r.name}</span>
                  <span className="tabular-nums">{labelOf(r.status)}{savings}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-muted">
                  <div className={`h-full ${colorOf(r.status)} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}


      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((a) => {
            const isImg = a.type?.startsWith("image/");
            const u = urls[a.path];
            return (
              <div key={a.path} className="group relative rounded-md border bg-muted/20 p-1 text-xs">
                {isImg && u ? (
                  <a href={u} target="_blank" rel="noreferrer">
                    <img src={u} alt={a.name} className="h-24 w-full rounded object-cover" />
                  </a>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded bg-muted">
                    {isImg ? <ImageIcon className="h-6 w-6 text-muted-foreground" />
                           : <FileText className="h-6 w-6 text-muted-foreground" />}
                  </div>
                )}
                <p className="mt-1 truncate" title={a.name}>{a.name}</p>
                <p className="text-meta text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</p>
                {!disabled && (
                  <button
                    type="button" onClick={() => remove(a)}
                    className="absolute right-1 top-1 hidden rounded-full bg-rose-600 p-0.5 text-white group-hover:block"
                    aria-label="Xoá"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
