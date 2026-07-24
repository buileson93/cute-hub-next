// ============================================================================
// PhotoUpload.tsx — Upload nhiều tệp (ảnh/tệp bất kỳ) vào bucket
// `form-attachments`, hiển thị preview + nút xoá. Giá trị lưu là mảng
// FormAttachment (JSON) để đưa vào form_submission.data.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  type FormAttachment,
  removeAttachment,
  signedUrl,
  uploadAttachment,
} from "@/lib/mirats/form-attachments";

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
  const [progress, setProgress] = useState<Array<{ name: string; pct: number }>>([]);

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
    setProgress(arr.map((f) => ({ name: f.name, pct: 0 })));
    const next: FormAttachment[] = [...value];
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      if (photoOnly && !file.type.startsWith("image/")) {
        toast.error(`"${file.name}" không phải ảnh — bỏ qua.`);
        continue;
      }
      try {
        const att = await uploadAttachment(file, {
          templateCode, draftId, fieldKey,
          onProgress: (pct) => setProgress((prev) => {
            const copy = prev.slice();
            copy[i] = { name: file.name, pct };
            return copy;
          }),
        });
        next.push(att);
      } catch (e) {
        toast.error(`Upload thất bại: ${(e as Error).message}`);
      }
    }
    onChange(next);
    setBusy(false);
    setProgress([]);
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

      {progress.length > 0 && (
        <div className="space-y-1">
          {progress.map((p, i) => (
            <div key={i} className="text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span className="truncate">{p.name}</span><span>{p.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
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
                <p className="text-[10px] text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</p>
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
