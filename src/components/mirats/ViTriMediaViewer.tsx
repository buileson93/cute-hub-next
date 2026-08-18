import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, Box, Trash2, Loader2, X, Globe, Image as ImageIcon,
  Download, RotateCcw, Layers, MapPin, Map as MapIcon, Clock, Smartphone, FileDown,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PanoViewer } from "./PanoViewer";
import { Model3DViewer } from "./Model3DViewer";
import { CheckinMap } from "./CheckinMap";
import { ZoomableImage } from "./ZoomableImage";
import {
  layViTriGps, dinhDangToaDo, linkGoogleMaps, layThoiGianMayChu, laThietBiDiDong,
  taoCsvCheckin, taiCsv, type ViTriGps, type DiemCheckin,
} from "@/lib/mirats/geo";

const BUCKET = "vi-tri-media";
const URL_TTL = 60 * 60; // 1 giờ

type MediaLoai = "anh" | "pano360" | "model3d";
type MediaRow = {
  id: string;
  vi_tri_ma: string;
  loai: MediaLoai;
  ten_tep: string;
  duong_dan: string;
  mo_ta: string | null;
  kich_thuoc: number | null;
  content_type: string | null;
  created_by: string;
  created_at: string;
  vi_do: number | null;
  kinh_do: number | null;
  do_chinh_xac: number | null;
  chup_luc: string | null;
};
type MediaItem = MediaRow & { url: string };

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
const MODEL_VIEWABLE_EXT = /\.(glb|gltf|usdz)$/i;
const MODEL_RAW_EXT = /\.(ply|obj|las|laz|e57|xyz|fbx|stl)$/i;

function extOf(name: string) {
  const m = name.toLowerCase().match(/\.[^.]+$/);
  return m ? m[0] : "";
}

/** Đọc kích thước ảnh để tự nhận diện ảnh 360° (tỉ lệ ~2:1 equirectangular). */
function detectImageLoai(file: File): Promise<MediaLoai> {
  return new Promise((resolve) => {
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(u);
      const ratio = img.width / img.height;
      resolve(ratio > 1.9 && ratio < 2.1 ? "pano360" : "anh");
    };
    img.onerror = () => {
      URL.revokeObjectURL(u);
      resolve("anh");
    };
    img.src = u;
  });
}

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const LOAI_META: Record<MediaLoai, { label: string; Icon: typeof ImageIcon; cls: string }> = {
  anh: { label: "Ảnh", Icon: ImageIcon, cls: "border-border bg-muted text-muted-foreground" },
  pano360: { label: "360°", Icon: Globe, cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  model3d: { label: "3D / LiDAR", Icon: Box, cls: "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

export function ViTriMediaViewer({
  open,
  onOpenChange,
  viTriMa,
  viTriTen,
  donVi,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  viTriMa: string;
  viTriTen: string;
  donVi?: string | null;
}) {
  const qc = useQueryClient();
  const { user } = useSession();
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [view360, setView360] = useState(false);
  const [tab, setTab] = useState<"thu-vien" | "ban-do" | "lich-su">("thu-vien");

  // Chỉ cho phép chụp ảnh check-in trên điện thoại/máy tính bảng có camera.
  const laDiDong = useMemo(() => isMobile && laThietBiDiDong(), [isMobile]);

  const camRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);

  const qkey = ["vi_tri_media", viTriMa];
  const mediaQ = useQuery({
    queryKey: qkey,
    enabled: open && !!viTriMa,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vi_tri_media")
        .select("id,vi_tri_ma,loai,ten_tep,duong_dan,mo_ta,kich_thuoc,content_type,created_by,created_at,vi_do,kinh_do,do_chinh_xac,chup_luc")
        .eq("vi_tri_ma", viTriMa)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as MediaRow[];
      if (rows.length === 0) return [] as MediaItem[];
      const { data: signed } = await storage
        .from(BUCKET)
        .createSignedUrls(rows.map((r) => r.duong_dan), URL_TTL);
      const map = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      return rows.map((r) => ({ ...r, url: map.get(r.duong_dan) ?? "" }));
    },
  });

  const items = useMemo(() => mediaQ.data ?? [], [mediaQ.data]);

  const uploadFiles = async (files: FileList | null, forceLoai?: MediaLoai) => {
    if (!files || files.length === 0 || !user) return;

    // Chỉ cho phép trên di động.
    if (!laDiDong) {
      toast.error("Chỉ chụp ảnh check-in trên điện thoại có camera");
      if (camRef.current) camRef.current.value = "";
      if (modelRef.current) modelRef.current.value = "";
      return;
    }

    setUploading(true);

    // GPS là BẮT BUỘC cho check-in. Lấy ngay đầu luồng (còn trong ngữ cảnh
    // tương tác của người dùng) — nếu không được cấp quyền thì huỷ tải lên.
    let gpsErr = false;
    const gps: ViTriGps | null = await layViTriGps({
      onError: (loi) => {
        gpsErr = true;
        if (loi === "tu-choi") {
          toast.error("Cần cấp quyền vị trí (GPS)", {
            description: "Check-in bắt buộc có toạ độ. Hãy bật quyền vị trí rồi thử lại.",
          });
        } else if (loi === "khong-ho-tro") {
          toast.error("Tài sản không hỗ trợ GPS — không thể check-in");
        } else {
          toast.error("Không lấy được vị trí GPS", {
            description: "Hãy ra nơi thoáng và thử lại.",
          });
        }
      },
    });

    if (gpsErr || !gps) {
      setUploading(false);
      if (camRef.current) camRef.current.value = "";
      if (modelRef.current) modelRef.current.value = "";
      return;
    }

    const dc = gps.do_chinh_xac ? ` (±${Math.round(gps.do_chinh_xac)}m)` : "";
    toast.success(`Đã ghi vị trí GPS${dc}`);

    // Thời điểm chụp lấy theo GIỜ MÁY CHỦ cho chính xác, không tin đồng hồ máy.
    const chupLuc = await layThoiGianMayChu();

    try {
      for (const file of Array.from(files)) {
        const ext = extOf(file.name);
        let loai: MediaLoai;
        if (forceLoai) loai = forceLoai;
        else if (MODEL_VIEWABLE_EXT.test(ext) || MODEL_RAW_EXT.test(ext)) loai = "model3d";
        else if (IMG_EXT.test(ext) || file.type.startsWith("image/")) loai = await detectImageLoai(file);
        else {
          toast.error(`"${file.name}" không được hỗ trợ`);
          continue;
        }
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${viTriMa.replace(/[^\w.\-]+/g, "_")}/${Date.now()}_${safe}`;
        const up = await storage.from(BUCKET).upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (up.error) throw up.error;
        const ins = await supabase.from("vi_tri_media").insert({
          vi_tri_ma: viTriMa,
          don_vi: donVi ?? null,
          loai,
          ten_tep: file.name,
          duong_dan: path,
          kich_thuoc: file.size,
          content_type: file.type || ext.replace(".", ""),
          created_by: user.id,
          vi_do: gps.vi_do,
          kinh_do: gps.kinh_do,
          do_chinh_xac: gps.do_chinh_xac,
          chup_luc: chupLuc,
        });
        if (ins.error) {
          await storage.from(BUCKET).remove([path]);
          throw ins.error;
        }
      }
      toast.success("Đã check-in vị trí");
      qc.invalidateQueries({ queryKey: qkey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải lên được");
    } finally {
      setUploading(false);
      if (camRef.current) camRef.current.value = "";
      if (modelRef.current) modelRef.current.value = "";
    }
  };


  const delM = useMutation({
    mutationFn: async (r: MediaItem) => {
      await storage.from(BUCKET).remove([r.duong_dan]);
      const { error } = await supabase.from("vi_tri_media").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qkey });
      toast.success("Đã xoá");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  const counts = useMemo(() => {
    const c = { anh: 0, pano360: 0, model3d: 0 } as Record<MediaLoai, number>;
    for (const it of items) c[it.loai]++;
    return c;
  }, [items]);

  // Danh sách điểm GPS (ảnh có toạ độ) dùng cho bản đồ, lịch sử & xuất CSV.
  const diemGps = useMemo<DiemCheckin[]>(
    () =>
      items
        .filter((it) => it.vi_do != null && it.kinh_do != null)
        .map((it) => ({
          id: it.id,
          ten_tep: it.ten_tep,
          vi_do: it.vi_do as number,
          kinh_do: it.kinh_do as number,
          do_chinh_xac: it.do_chinh_xac,
          chup_luc: it.chup_luc,
          created_at: it.created_at,
        })),
    [items],
  );

  const xuatCsv = () => {
    if (diemGps.length === 0) {
      toast.info("Chưa có điểm GPS nào để xuất");
      return;
    }
    const csv = taoCsvCheckin(diemGps);
    const ten = `checkin_gps_${viTriMa.replace(/[^\w.\-]+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;
    taiCsv(ten, csv);
    toast.success(`Đã xuất ${diemGps.length} điểm GPS ra CSV`);
  };

  const openItem = (it: MediaItem) => {
    setActive(it);
    setView360(it.loai === "pano360");
  };

  const is3DViewable = (it: MediaItem) => MODEL_VIEWABLE_EXT.test(it.ten_tep);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="truncate">
              <span className="mr-1 font-mono text-xs text-muted-foreground">{viTriMa}</span>
              {viTriTen}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Check-in vị trí: chụp ảnh kèm toạ độ GPS & giờ máy chủ, xem trên bản đồ và xuất CSV.
          </DialogDescription>
        </DialogHeader>

        {/* Thanh chuyển chế độ xem + xuất CSV */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 p-3">
          <div className="flex rounded-lg border bg-card p-0.5">
            {([
              ["thu-vien", "Thư viện", ImageIcon],
              ["ban-do", "Bản đồ", MapIcon],
              ["lich-su", "Lịch sử GPS", Clock],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border",
                  tab === id 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id !== "thu-vien" && diemGps.length > 0 && (
                  <span className={cn(
                    "ml-0.5 rounded-full px-1.5 text-[10px]",
                    tab === id ? "bg-white/20 text-white" : "bg-success/10 text-success"
                  )}>
                    {diemGps.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={xuatCsv} disabled={diemGps.length === 0}>
            <FileDown className="mr-1.5 h-4 w-4" /> Xuất GPS (CSV)
          </Button>

          {uploading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải lên…
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" />{counts.anh}</Badge>
            <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />{counts.pano360}</Badge>
            <Badge variant="outline" className="gap-1"><Box className="h-3 w-3" />{counts.model3d}</Badge>
            <Badge variant="outline" className="gap-1 border-success/40 text-success bg-success/5"><MapPin className="h-3 w-3" />{diemGps.length}</Badge>
          </div>
        </div>

        {/* Thanh check-in (chỉ trên điện thoại, chỉ chụp từ camera, bắt buộc GPS) */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-background p-3">
          {laDiDong ? (
            <>
              <Button size="sm" onClick={() => camRef.current?.click()} disabled={uploading}>
                <Camera className="mr-1.5 h-4 w-4" /> Chụp ảnh check-in
              </Button>
              <Button size="sm" variant="outline" onClick={() => modelRef.current?.click()} disabled={uploading}>
                <Box className="mr-1.5 h-4 w-4" /> Mô hình 3D / LiDAR
              </Button>
              <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                <MapPin className="h-3.5 w-3.5" /> Bắt buộc quyền GPS · giờ máy chủ
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Smartphone className="h-4 w-4" /> Chỉ chụp ảnh check-in trên điện thoại có camera & GPS. Trên máy tính chỉ xem.
            </span>
          )}

          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => uploadFiles(e.target.files)} />
          <input ref={modelRef} type="file" accept=".glb,.gltf,.usdz,.ply,.obj,.las,.laz,.e57,.xyz,.fbx,.stl" multiple className="hidden"
            onChange={(e) => uploadFiles(e.target.files, "model3d")} />
        </div>


        {/* Nội dung */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            {mediaQ.isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Đang tải…</p>
            ) : tab === "ban-do" ? (
              diemGps.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <MapIcon className="h-8 w-8 opacity-40" />
                  <p>Chưa có ảnh nào kèm toạ độ GPS.</p>
                  <p className="text-xs">Chụp ảnh check-in trên điện thoại (bắt buộc GPS) để xuất hiện trên bản đồ.</p>
                </div>
              ) : (
                <CheckinMap
                  diem={diemGps}
                  className="h-[52vh] w-full overflow-hidden rounded-lg border"
                  onChonDiem={(id) => {
                    const it = items.find((x) => x.id === id);
                    if (it) openItem(it);
                  }}
                />
              )
            ) : tab === "lich-su" ? (
              diemGps.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-40" />
                  <p>Chưa có lịch sử GPS.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {diemGps.map((d) => {
                    const it = items.find((x) => x.id === d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => it && openItem(it)}
                        className="flex w-full items-center gap-3 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-accent"
                      >
                        {it && it.loai !== "model3d" ? (
                          <img src={it.url} alt={d.ten_tep} loading="lazy" className="h-12 w-12 shrink-0 rounded object-cover" />
                        ) : (
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-muted">
                            <Box className="h-5 w-5 text-muted-foreground" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{d.ten_tep}</div>
                          <div className="flex items-center gap-1 text-[11px] text-success font-medium">
                            <MapPin className="h-3 w-3" />
                            {dinhDangToaDo(d.vi_do, d.kinh_do)}
                            {d.do_chinh_xac != null && <span className="text-muted-foreground"> · ±{Math.round(d.do_chinh_xac)}m</span>}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(d.chup_luc ?? d.created_at).toLocaleString("vi-VN")}
                          </div>
                        </div>
                        <a
                          href={linkGoogleMaps(d.vi_do, d.kinh_do)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Mở Google Maps"
                        >
                          <MapIcon className="h-4 w-4" />
                        </a>
                      </button>
                    );
                  })}
                </div>
              )
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <Layers className="h-8 w-8 opacity-40" />
                <p>Chưa có hình ảnh cho vị trí này.</p>
                <p className="text-xs">
                  {laDiDong ? "Chụp ảnh check-in" : "Dùng điện thoại để chụp ảnh check-in"} kèm GPS. Hỗ trợ ảnh thường, ảnh 360°
                  (tự nhận diện tỉ lệ 2:1) và mô hình 3D/LiDAR xuất từ Polycam (GLB/USDZ).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {items.map((it) => {
                  const meta = LOAI_META[it.loai];
                  return (
                    <div key={it.id} className="group relative overflow-hidden rounded-lg border bg-card">
                      <button
                        type="button"
                        onClick={() => openItem(it)}
                        className="block aspect-square w-full overflow-hidden bg-muted"
                      >
                        {it.loai === "model3d" ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/10 to-violet-500/5">
                            <Box className="h-8 w-8 text-violet-500/70" />
                          </div>
                        ) : (
                          <img src={it.url} alt={it.ten_tep} loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        )}
                      </button>
                      <span className={cn("absolute left-1.5 top-1.5 flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium", meta.cls)}>
                        <meta.Icon className="h-2.5 w-2.5" />{meta.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => delM.mutate(it)}
                        className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                        title="Xoá"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {it.vi_do != null && it.kinh_do != null && (
                        <span
                          className="absolute bottom-8 left-1.5 flex items-center gap-1 rounded bg-primary/90 px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground"
                          title={dinhDangToaDo(it.vi_do, it.kinh_do) ?? ""}
                        >
                          <MapPin className="h-2.5 w-2.5" /> GPS
                        </span>
                      )}
                      <div className="truncate px-2 py-1 text-[10px] text-muted-foreground">
                        {it.ten_tep} · {fmtSize(it.kich_thuoc)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

      </DialogContent>

      {/* Lightbox / trình xem chi tiết */}
      {active && (
        <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
          <DialogContent className="flex h-[96vh] w-[98vw] max-w-[1700px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[98vw]">
            <DialogHeader className="flex-row items-center justify-between gap-2 border-b p-3">
              <DialogTitle className="truncate text-sm">{active.ten_tep}</DialogTitle>
              <div className="flex items-center gap-1.5">
                {(active.loai === "anh" || active.loai === "pano360") && (
                  <Button size="sm" variant="outline" className="h-8 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary/90" onClick={() => setView360((v) => !v)}>
                    {view360 ? <><ImageIcon className="mr-1.5 h-3.5 w-3.5" />Ảnh phẳng</> : <><Globe className="mr-1.5 h-3.5 w-3.5" />Xem 360°</>}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-8 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary/90" asChild>
                  <a href={active.url} download={active.ten_tep} target="_blank" rel="noreferrer">
                    <Download className="mr-1.5 h-3.5 w-3.5" />Tải về
                  </a>
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActive(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 bg-black">
              {active.loai === "model3d" ? (
                is3DViewable(active) ? (
                  <Model3DViewer url={active.url} className="relative h-full w-full" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/80">
                    <Box className="h-10 w-10 opacity-60" />
                    <p>Định dạng LiDAR "{extOf(active.ten_tep)}" cần phần mềm chuyên dụng để mở.</p>
                    <p className="text-xs text-white/60">Để xem trực tiếp trên web, hãy xuất mô hình sang <b>GLB</b> hoặc <b>USDZ</b> (Polycam hỗ trợ sẵn).</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" asChild>
                      <a href={active.url} download={active.ten_tep}><Download className="mr-1.5 h-4 w-4" />Tải tệp về máy</a>
                    </Button>
                  </div>
                )
              ) : view360 ? (
                <PanoViewer url={active.url} className="relative h-full w-full" />
              ) : (
                <div className="relative flex h-full w-full items-center justify-center">
                  <ZoomableImage src={active.url} alt={active.ten_tep} />
                  {active.loai === "pano360" && (
                    <span className="pointer-events-none absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                      <RotateCcw className="h-3 w-3" /> Bấm "Xem 360°" để xoay toàn cảnh
                    </span>
                  )}
                </div>
              )}
            </div>
            {(active.vi_do != null && active.kinh_do != null) || active.chup_luc ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                {active.vi_do != null && active.kinh_do != null && (
                  <a
                    href={linkGoogleMaps(active.vi_do, active.kinh_do) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-medium text-emerald-600 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {dinhDangToaDo(active.vi_do, active.kinh_do)}
                    {active.do_chinh_xac != null && (
                      <span className="text-muted-foreground"> · ±{Math.round(active.do_chinh_xac)}m</span>
                    )}
                  </a>
                )}
                {active.chup_luc && (
                  <span>Chụp lúc: {new Date(active.chup_luc).toLocaleString("vi-VN")}</span>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
