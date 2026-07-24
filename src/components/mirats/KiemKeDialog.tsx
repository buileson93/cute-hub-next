import { useRef, useState } from "react";
import { ClipboardCheck, MapPin, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const TINH_TRANG_OPTIONS = [
  "Bình thường",
  "Cần theo dõi",
  "Hư hỏng",
  "Không tìm thấy",
] as const;

export interface KiemKeSubmitInput {
  tinhTrang: string;
  viTriGps: string | null;
  ghiChu: string;
  file: File | null;
}

export interface KiemKeDialogProps {
  thietBi: { maThietBi: string; ten: string };
  canManage: boolean;
  pending?: boolean;
  onSubmit: (input: KiemKeSubmitInput) => void;
}

/**
 * Dialog kiểm kê tài sản ngoài hiện trường: chụp/chọn ảnh, lấy GPS,
 * chọn tình trạng và ghi chú. Thuần trình bày — parent lo upload ảnh + gọi RPC.
 */
export function KiemKeDialog({ thietBi, canManage, pending, onSubmit }: KiemKeDialogProps) {
  const [open, setOpen] = useState(false);
  const [tinhTrang, setTinhTrang] = useState<string>(TINH_TRANG_OPTIONS[0]);
  const [ghiChu, setGhiChu] = useState("");
  const [gps, setGps] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsErr, setGpsErr] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!canManage) return null;

  const reset = () => {
    setTinhTrang(TINH_TRANG_OPTIONS[0]);
    setGhiChu(""); setGps(null); setGpsErr(null);
    setFile(null); setPreview(null);
  };

  const layViTri = () => {
    setGpsErr(null);
    if (!navigator.geolocation) {
      setGpsErr("Tài sản không hỗ trợ định vị");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        setGpsBusy(false);
      },
      (err) => {
        setGpsErr(err?.message || "Không lấy được vị trí");
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = () => {
    onSubmit({ tinhTrang, viTriGps: gps, ghiChu: ghiChu.trim(), file });
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { reset(); setOpen(true); }} disabled={pending}>
        <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Kiểm kê
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kiểm kê tài sản</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{thietBi.ten}</span>
              <span className="text-muted-foreground"> · {thietBi.maThietBi}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kk-tt">Tình trạng</Label>
              <Select value={tinhTrang} onValueChange={setTinhTrang}>
                <SelectTrigger id="kk-tt"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TINH_TRANG_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vị trí hiện tại</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={layViTri} disabled={gpsBusy}>
                  {gpsBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MapPin className="mr-1.5 h-3.5 w-3.5" />}
                  Lấy vị trí
                </Button>
                {gps && <span className="text-sm text-muted-foreground">{gps}</span>}
              </div>
              {gpsErr && <p className="text-xs text-red-600">{gpsErr}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Ảnh hiện trường</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                aria-label="Chọn ảnh"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {preview ? (
                <div className="relative w-fit">
                  <img src={preview} alt="Ảnh kiểm kê" className="h-32 rounded-md border object-cover" />
                  <Button
                    size="icon" variant="destructive"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => onPickFile(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Camera className="mr-1.5 h-3.5 w-3.5" /> Chụp / chọn ảnh
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kk-ghichu">Ghi chú</Label>
              <Textarea id="kk-ghichu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2}
                placeholder="Mô tả tình trạng, vị trí lắp đặt…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button onClick={submit} disabled={pending || !tinhTrang}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Xác nhận kiểm kê
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
