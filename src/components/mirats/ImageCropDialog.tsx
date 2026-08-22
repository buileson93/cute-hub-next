import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Loader2, ClipboardPaste, Crop as CropIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedBlob, fileToDataUrl, type CropPixels } from "@/lib/mirats/crop-image";

type Aspect = { label: string; value: number | undefined };
const ASPECTS: Aspect[] = [
  { label: "Vuông 1:1", value: 1 },
  { label: "Ngang 16:9", value: 16 / 9 },
  { label: "Dọc 3:4", value: 3 / 4 },
  { label: "Tự do", value: undefined },
];

export interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Nhận File ảnh (WebP) đã cắt. Có thể async — dialog chờ xong rồi đóng. */
  onConfirm: (file: File, description: string) => void | Promise<void>;
  title?: string;
  maxMb?: number;
  /** Hiện ô nhập mô tả (dùng cho thư viện ảnh tài sản). */
  withDescription?: boolean;
  /** Cạnh dài tối đa của ảnh xuất ra (px). */
  outSize?: number;
  confirmLabel?: string;
}

/**
 * Dialog chọn + cắt ảnh dùng chung: hỗ trợ dán clipboard (Ctrl+V), kéo-thả,
 * chọn tệp; zoom + tỉ lệ (mặc định vuông như avatar) và tùy chọn bo tròn.
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Chọn & cắt ảnh",
  maxMb = 5,
  withDescription = false,
  outSize = 800,
  confirmLabel = "Cắt & dùng ảnh",
}: ImageCropDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [origName, setOrigName] = useState("anh.png");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [round, setRound] = useState(false);
  const [areaPx, setAreaPx] = useState<CropPixels | null>(null);
  const [moTa, setMoTa] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const aspect = ASPECTS[aspectIdx].value;

  const reset = useCallback(() => {
    setSrc(null);
    setOrigName("anh.png");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectIdx(0);
    setRound(false);
    setAreaPx(null);
    setMoTa("");
  }, []);

  const loadFile = useCallback(
    async (f: File | null | undefined) => {
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        toast.error("Chỉ nhận tệp ảnh");
        return;
      }
      if (f.size > maxMb * 1024 * 1024) {
        toast.error(`Ảnh vượt quá ${maxMb}MB`);
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(f);
        setSrc(dataUrl);
        setOrigName(f.name || "anh.png");
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } catch {
        toast.error("Không đọc được ảnh");
      }
    },
    [maxMb],
  );

  // Dán ảnh từ clipboard khi dialog mở
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            loadFile(f);
            toast.success("Đã dán ảnh từ clipboard");
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, loadFile]);

  const pasteBtn = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await it.getType(type);
          await loadFile(new File([blob], "clipboard.png", { type }));
          toast.success("Đã dán ảnh từ clipboard");
          return;
        }
      }
      toast.error("Clipboard không có ảnh");
    } catch {
      toast.error("Không truy cập được clipboard — hãy nhấn Ctrl+V");
    }
  }, [loadFile]);

  async function confirm() {
    if (!src || !areaPx) {
      toast.error("Chưa chọn ảnh");
      return;
    }
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, areaPx, {
        outSize,
        mimeType: "image/webp",
        quality: 0.9,
      });
      const base = origName.replace(/\.[^.]+$/, "") || "anh";
      const file = new File([blob], `${base}.webp`, { type: "image/webp" });
      await onConfirm(file, moTa.trim());
      onOpenChange(false);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xử lý ảnh thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Chọn ảnh"
          onChange={(e) => {
            loadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {!src ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              loadFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30",
            )}
          >
            <ClipboardPaste className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Kéo-thả ảnh vào đây, hoặc{" "}
              <span className="font-medium text-foreground">dán (Ctrl+V)</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Chọn tệp
              </Button>
              <Button size="sm" variant="secondary" onClick={pasteBtn}>
                <ClipboardPaste className="mr-2 h-4 w-4" /> Dán từ clipboard
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">JPG/PNG/WebP · tối đa {maxMb}MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={round ? "round" : "rect"}
                showGrid={!round}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: Area, px: Area) => setAreaPx(px)}
              />
            </div>

            <div className="flex items-center gap-2">
              <CropIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                aria-label="Thu phóng"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map((a, i) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={i === aspectIdx ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setAspectIdx(i)}
                >
                  {a.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant={round ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => {
                  setRound((r) => !r);
                  if (!round) setAspectIdx(0);
                }}
              >
                Bo tròn (avatar)
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={reset}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Ảnh khác
              </Button>
            </div>

            {withDescription && (
              <div>
                <Label>Mô tả (tùy chọn)</Label>
                <Textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="VD: ảnh mặt trước, nhãn tài sản…"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={confirm} disabled={busy || !src || !areaPx}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
