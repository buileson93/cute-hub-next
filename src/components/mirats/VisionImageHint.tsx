import { useCallback, useRef, useState } from "react";
import { Loader2, Sparkles, Trash2, Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { analyzeIncidentImages, type IncidentImageHint } from "@/lib/ai/incident-image.functions";

// GĐ3-05 — Vision Image Hint UI
// - Multi upload tối đa 5 ảnh vào bucket `su-co-images/<uid>/<uuid>.<ext>`
// - Sau khi upload xong → hiện gợi ý từ AI
// - Có nút "Áp dụng mô tả" / "Áp dụng phân loại" / "Áp dụng từ khoá" cho từng phần.

const MAX = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";

export interface UploadedImage {
  path: string;      // path trong bucket
  previewUrl: string; // objectURL local để preview
  name: string;
}

type Props = {
  onApplyDescription?: (text: string) => void;
  onApplyCategory?: (cat: "A" | "B" | "C" | "D" | "E") => void;
  onApplyKeywords?: (keywords: string[]) => void;
};

export function VisionImageHint({ onApplyDescription, onApplyCategory, onApplyKeywords }: Props) {
  const { session } = useSession();
  const uid = session?.user?.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hint, setHint] = useState<IncidentImageHint | null>(null);
  const analyze = useServerFn(analyzeIncidentImages);

  const pick = () => fileRef.current?.click();

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !uid) return;
    const remain = MAX - images.length;
    if (remain <= 0) { toast.warning(`Tối đa ${MAX} ảnh`); return; }
    const chosen = Array.from(files).slice(0, remain);
    setUploading(true);
    const uploaded: UploadedImage[] = [];
    try {
      for (const f of chosen) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: quá 5MB`); continue; }
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { compressForUpload } = await import("@/lib/storage/compress");
        const c = await compressForUpload(f);
        const { error } = await supabase.storage.from("su-co-images").upload(path, c.blob, {
          contentType: c.contentType, upsert: false,
        });
        if (error) { toast.error(`Lỗi tải ${f.name}: ${error.message}`); continue; }
        uploaded.push({ path, previewUrl: URL.createObjectURL(f), name: f.name });
      }
      if (uploaded.length > 0) setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [images.length, uid]);

  const removeAt = async (i: number) => {
    const img = images[i];
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    URL.revokeObjectURL(img.previewUrl);
    await supabase.storage.from("su-co-images").remove([img.path]).catch(() => {});
    setHint(null);
  };

  const runAnalyze = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await analyze({ data: { paths: images.map((i) => i.path) } });
      setHint(res);
      if (!res.short_description && !res.keywords.length) {
        toast.info("AI chưa suy đoán được nội dung từ ảnh");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không phân tích được ảnh");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ảnh hiện trường</span>
            <span className="text-xs text-muted-foreground">({images.length}/{MAX})</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={pick}
              disabled={uploading || images.length >= MAX}>
              {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
              Tải ảnh
            </Button>
            <Button type="button" size="sm" onClick={runAnalyze}
              disabled={analyzing || images.length === 0}>
              {analyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Phân tích ảnh
            </Button>
          </div>
        </div>

        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden
          onChange={(e) => onFiles(e.target.files)} />

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((img, i) => (
              <div key={img.path} className="group relative aspect-square overflow-hidden rounded-md border">
                <img src={img.previewUrl} alt={img.name} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Xoá ảnh">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hint && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Gợi ý từ AI
            </div>
            {hint.short_description && (
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="flex-1 text-sm">{hint.short_description}</p>
                <Button type="button" size="sm" variant="ghost"
                  onClick={() => { onApplyDescription?.(hint.short_description); toast.success("Đã áp dụng mô tả"); }}>
                  Áp dụng
                </Button>
              </div>
            )}
            {hint.suggested_category && (
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm">Phân loại nghi ngờ: <Badge variant="secondary">{hint.suggested_category}</Badge></span>
                <Button type="button" size="sm" variant="ghost"
                  onClick={() => { onApplyCategory?.(hint.suggested_category as "A"|"B"|"C"|"D"|"E"); toast.success("Đã áp dụng phân loại"); }}>
                  Áp dụng
                </Button>
              </div>
            )}
            {hint.keywords.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {hint.keywords.map((k) => (<Badge key={k} variant="outline">{k}</Badge>))}
                </div>
                <Button type="button" size="sm" variant="ghost"
                  onClick={() => { onApplyKeywords?.(hint.keywords); toast.success("Đã thêm từ khoá"); }}>
                  Áp dụng
                </Button>
              </div>
            )}
            {!hint.short_description && !hint.suggested_category && hint.keywords.length === 0 && (
              <p className="text-xs text-muted-foreground">AI chưa suy đoán được gì từ ảnh. Thử ảnh rõ hơn.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
