// ============================================================================
// Chi tiết một THÀNH PHẦN của hệ thống (mô hình 3 lớp) — mở dạng SIDEBAR
// từ cây/list view (giống ngăn "Sửa tài sản / thành phần").
//   - Xem thành phần đang "pin" (lắp) tài sản cụ thể nào (mã + serial).
//   - Nếu chưa có tài sản → hiển thị "Đang chờ để thay thế".
//   - Bật "Chỉnh sửa" để đổi/lắp/tháo tài sản (ghi lịch sử gan_chuc_nang).
// ============================================================================
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  HardDrive, Clock, PackageOpen, Wrench, ArrowRightLeft, History, X,
  Pencil, Plug, Settings2, Save, RefreshCw, ExternalLink, Info,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/mirats/Combobox";
import { LayerSectionHeader } from "@/lib/mirats/layer-vocab";
import { supabase } from "@/integrations/backend/client";
import {
  useThietBiChon, useLapThietBi, useThaoThietBi, useThayTheThietBi, useDieuChuyen,
  useLyLichViTri, useLuuViTri, useThietBiDangLap, rankChonDevices, type ViTriChucNangTree,
  type ThietBiChon,
} from "@/lib/mirats/he-thong-thanh-phan";
import { LyLichThanhPhanPanel, LyLichHeThongPanel } from "@/components/mirats/LyLichLayerPanel";
import { ThaoTaiSanDialog } from "@/components/mirats/ThaoTaiSanDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCan } from "@/hooks/use-permissions";
import { showUndoToast } from "@/components/mirats/UndoToast";

// Danh mục dùng chung cho form sửa thành phần
function useCatalog<T extends { id: string; ten: string }>(table: "dm_loai_thiet_bi" | "dm_vi_tri" | "dm_trang_thai_thiet_bi") {
  return useQuery({
    queryKey: ["catalog-simple", table],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase.from(table).select("id, ten").order("ten");
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function ThanhPhanChiTietDialog({
  viTri, heThongId, canManage, onOpenDevice, onRecord, onClose,
}: {
  viTri: ViTriChucNangTree;
  heThongId: string;
  canManage: boolean;
  onOpenDevice?: (maThietBi: string) => void;
  onRecord?: (maThietBi: string, ten: string) => void;
  onClose: () => void;
}) {
  // Đọc tài sản đang lắp TỪ CACHE LIVE (đã invalidate sau mọi RPC lắp/tháo/thay),
  // thay vì dùng snapshot `viTri.device` truyền từ prop → không lệch pha sau khi save.
  const { data: dangLapMap } = useThietBiDangLap(heThongId);
  const dev = dangLapMap
    ? (dangLapMap.get(viTri.id)
        ? { thiet_bi_id: dangLapMap.get(viTri.id)!.thiet_bi_id, ma_thiet_bi: dangLapMap.get(viTri.id)!.ma_thiet_bi, ten_thiet_bi: dangLapMap.get(viTri.id)!.ten_thiet_bi, ma_serial: dangLapMap.get(viTri.id)!.ma_serial }
        : null)
    : viTri.device;
  const ngung = viTri.trang_thai === "ngung";
  const [edit, setEdit] = useState(false);
  const [mode, setMode] = useState<null | "lap" | "thay">(null);
  const [editFields, setEditFields] = useState(false);
  // Quyền lắp/tháo/thay tài sản (thu hẹp theo phạm vi của tài khoản con).
  // canManage đã tính đủ quyền theo vai trò tổng; canAssign kiểm tra thêm
  // ma trận role_permission cho module `thiet_bi` (action = update).
  const canAssign = useCan("thiet_bi", "update");
  const canEdit = canManage && canAssign && !ngung;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <Plug className="h-4 w-4 shrink-0 text-sky-600" />
            <span>{viTri.ten}</span>
            {viTri.ma_thanh_phan && (
              <span className="font-mono text-xs font-normal text-muted-foreground">{viTri.ma_thanh_phan}</span>
            )}
            {ngung && <Badge variant="outline" className="border-muted-foreground/40">Đã ngừng</Badge>}
            {!ngung && viTri.bat_buoc && <Badge variant="secondary">Bắt buộc</Badge>}
          </SheetTitle>
          <SheetDescription className="sr-only">Chi tiết vị trí chức năng</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Sửa TRỰC TIẾP các trường thông tin của thành phần → lưu thẳng CSDL */}
          {canManage && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <LayerSectionHeader layer="tp" subtitle="Vai trò / vị trí chức năng (KHÔNG phải tài sản vật lý)" />
                <Button
                  size="sm" variant={editFields ? "secondary" : "outline"} className="h-7"
                  onClick={() => setEditFields((v) => !v)}
                >
                  {editFields
                    ? <><X className="mr-1 h-3.5 w-3.5" /> Đóng</>
                    : <><Settings2 className="mr-1 h-3.5 w-3.5" /> Sửa thành phần</>}
                </Button>
              </div>
              {editFields ? (
                <>
                  <p className="mb-2 rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground">
                    Đang sửa <b>thành phần hệ thống</b> (mã <span className="font-mono">TPHT_…</span>). Để sửa
                    trường của <b>tài sản vật lý</b> đang lắp (bao gồm serial, model, ngày mua…), bấm
                    nút <b>Sửa tài sản</b> ở khối bên dưới.
                  </p>
                  <ThanhPhanFieldsForm heThongId={heThongId} viTri={viTri} onDone={() => setEditFields(false)} />
                </>
              ) : (
                <dl className="space-y-1 text-sm">
                  <FieldRow label="Thành phần hệ thống" value={viTri.ten} />
                  <FieldRow label="Mã thành phần" value={viTri.ma_thanh_phan} mono />
                  {viTri.mo_ta && <FieldRow label="Mô tả" value={viTri.mo_ta} />}
                </dl>
              )}
            </div>
          )}
          {!canManage && viTri.mo_ta && <p className="text-sm text-muted-foreground">{viTri.mo_ta}</p>}



          {/* Tài sản đang được "pin" vào thành phần */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <LayerSectionHeader layer="tb" subtitle="Tài sản vật lý đang lắp (mã TB_…)" />
              {canEdit && (
                <Button
                  size="sm" variant={edit ? "secondary" : "outline"} className="h-7"
                  onClick={() => { setEdit((v) => !v); setMode(null); }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> {edit ? "Xong" : "Lắp / đổi tài sản"}
                </Button>
              )}
              {canManage && !canAssign && (
                <span className="text-[11px] text-muted-foreground">Ngoài phạm vi quyền lắp/tháo</span>
              )}
            </div>

            {dev ? (
              <div className="flex flex-wrap items-center gap-2">
                <HardDrive className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{dev.ten_thiet_bi || dev.ma_thiet_bi}</span>
                <Badge variant="outline" className="gap-1 font-mono font-normal">{dev.ma_thiet_bi}</Badge>
                {dev.ma_serial && (
                  <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                    S/N {dev.ma_serial}
                  </Badge>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {onOpenDevice && (
                    <Button size="sm" variant="ghost" onClick={() => onOpenDevice(dev.ma_thiet_bi)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa tài sản
                    </Button>
                  )}
                  {onRecord && (
                    <Button size="sm" variant="ghost" onClick={() => onRecord(dev.ma_thiet_bi, dev.ten_thiet_bi || dev.ma_thiet_bi)}>
                      <History className="mr-1 h-3.5 w-3.5" /> Lý lịch
                    </Button>
                  )}
                </div>
              </div>

            ) : (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-3 text-sm">
                <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Vị trí trống</div>
                  <div className="text-xs text-muted-foreground">
                    Chưa có tài sản vật lý nào được lắp vào thành phần này
                    {viTri.bat_buoc ? " (thành phần bắt buộc — cần lắp tài sản để hệ thống hoạt động)." : "."}
                  </div>
                  {canEdit && !edit && (
                    <Button size="sm" className="mt-2 h-7" onClick={() => { setEdit(true); setMode("lap"); }}>
                      <PackageOpen className="mr-1 h-3.5 w-3.5" /> Lắp tài sản vào đây
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thao tác thay đổi tài sản — chỉ khi bật Chỉnh sửa */}
          {canEdit && edit && (
            mode ? (
              <ChangeDeviceForm
                heThongId={heThongId}
                viTri={viTri}
                isReplace={mode === "thay"}
                onDone={() => setMode(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {dev ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setMode("thay")}>
                      <Wrench className="mr-1 h-3.5 w-3.5" /> Đổi tài sản khác
                    </Button>
                    <ThaoButton heThongId={heThongId} viTri={viTri} />
                  </>
                ) : (
                  <Button size="sm" onClick={() => setMode("lap")}>
                    <PackageOpen className="mr-1 h-3.5 w-3.5" /> Lắp tài sản
                  </Button>
                )}
              </div>
            )
          )}

          {/* Lịch sử tài sản đã lắp tại vị trí này */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Lịch sử tài sản đã lắp
            </div>
            <ViTriLichSu thanhPhanId={viTri.id} />
          </div>

          {/* Sổ lý lịch thành phần: tách tab Tháo-lắp / Sự cố / Bảo dưỡng-Hỏng hóc + link sổ hệ thống */}
          <SoLyLichThanhPhanSection
            thanhPhanId={viTri.id}
            heThongId={heThongId}
            canEdit={canManage}
          />

        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Trích thông báo lỗi thân thiện từ mọi kiểu error (Error/PostgrestError/plain). */
function errMsg(e: unknown, fallback: string): string {
  if (!e) return fallback;
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const anyErr = e as { message?: unknown; details?: unknown; hint?: unknown };
    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
    if (typeof anyErr.details === "string" && anyErr.details.trim()) return anyErr.details;
    if (typeof anyErr.hint === "string" && anyErr.hint.trim()) return anyErr.hint;
  }
  return fallback;
}

/** Nút Tháo: mở dialog chọn vị trí đích rồi gọi RPC `thao_tai_san_khoi_thanh_phan`.
 *  Sau khi tháo, cho phép hoàn tác 12s = lắp lại đúng tài sản vừa tháo. */
function ThaoButton({ heThongId, viTri }: { heThongId: string; viTri: ViTriChucNangTree }) {
  const [open, setOpen] = useState(false);
  const { data: dangLapMap } = useThietBiDangLap(heThongId);
  const current = dangLapMap?.get(viTri.id) ?? null;
  const lapMut = useLapThietBi(heThongId);

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Tháo
      </Button>
      <ThaoTaiSanDialog
        target={open ? {
          heThongId,
          thanhPhanId: viTri.id,
          maThanhPhan: viTri.ma_thanh_phan ?? null,
          tenThanhPhan: viTri.ten,
          viTriHienTaiId: viTri.vi_tri_id ?? null,
          viTriHienTaiTen: null,
        } : null}
        onClose={() => {
          setOpen(false);
          if (current) {
            const viTriLabel = `${viTri.ma_thanh_phan} · ${viTri.ten}`;
            showUndoToast({
              message: `Đã tháo ${current.ma_thiet_bi} khỏi ${viTriLabel} — hoàn tác trong 12s?`,
              onUndo: () =>
                lapMut.mutateAsync({ thanhPhanId: viTri.id, thietBiId: current.thiet_bi_id, ghiChu: "Hoàn tác thao tác tháo" })
                  .then(() => { toast.success(`Đã hoàn tác — lắp lại ${current.ma_thiet_bi} vào ${viTriLabel}`); })
                  .catch((e) => { toast.error(errMsg(e, "Không hoàn tác được")); throw e; }),
            });
          }
        }}
      />
    </>
  );
}


function ChangeDeviceForm({
  heThongId, viTri, isReplace, onDone,
}: {
  heThongId: string;
  viTri: ViTriChucNangTree;
  isReplace: boolean;
  onDone: () => void;
}) {
  const { data: all = [], isLoading } = useThietBiChon();
  const lapMut = useLapThietBi(heThongId);
  const thayMut = useThayTheThietBi(heThongId);
  const thaoMut = useThaoThietBi(heThongId);
  const chuyenMut = useDieuChuyen(heThongId);
  // Danh sách vị trí kho/xưởng — nơi tài sản CŨ đi về sau khi thay thế.
  const { data: viTriList = [] } = useCatalog<{ id: string; ten: string }>("dm_vi_tri");
  // Tài sản đang lắp tại vị trí — cần biết để gắn audit + hiển thị "sẽ đi về đâu".
  const { data: dangLapMap } = useThietBiDangLap(heThongId);
  const current = dangLapMap?.get(viTri.id) ?? null;

  const [chon, setChon] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [viTriTaiSanCu, setViTriTaiSanCu] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);
  // Hộp thoại xác nhận khi tài sản được chọn đang lắp ở vị trí khác:
  // - "Chuyển sang đây" → dieu_chuyen (đóng vai trò cũ, mở vai trò mới)
  // - "Gán thêm vai trò" → lap_thiet_bi (giữ nguyên vai trò cũ, mở thêm)
  const [swapAsk, setSwapAsk] = useState<ThietBiChon | null>(null);

  const options = useMemo(
    () => rankChonDevices(all, viTri.loai_thiet_bi_yeu_cau).map((r) => ({
      value: r.id,
      label: `${r.ma_thiet_bi}${r.ten_thiet_bi ? " · " + r.ten_thiet_bi : ""}`,
      hint: [
        r.ma_serial ? "SN " + r.ma_serial : "",
        r.khopLoai ? "" : "khác phân loại",
        r.dangLap ? "đang lắp: " + (r.viTriHienTai ?? "nơi khác") : (r.trang_thai_ten ?? "rảnh"),
      ].filter(Boolean).join(" · "),
    })),
    [all, viTri.loai_thiet_bi_yeu_cau],
  );

  const viTriOptions = useMemo(
    () => viTriList
      .filter((v) => v.id !== (viTri.vi_tri_id ?? ""))
      .map((v) => ({ value: v.id, label: v.ten })),
    [viTriList, viTri.vi_tri_id],
  );

  const doLap = async (picked: ThietBiChon) => {
    setDangXuLy(true);
    const viTriLabel = `${viTri.ma_thanh_phan} · ${viTri.ten}`;
    const tbLabel = `${picked.ma_thiet_bi}${picked.ten_thiet_bi ? " · " + picked.ten_thiet_bi : ""}`;
    try {
      if (isReplace) {
        await thayMut.mutateAsync({
          thanhPhanId: viTri.id,
          thietBiMoiId: picked.id,
          ghiChu,
          viTriTaiSanCuId: viTriTaiSanCu || null,
          thietBiCuId: current?.thiet_bi_id ?? null,
          maThietBiCu: current?.ma_thiet_bi ?? null,
          maThietBiMoi: picked.ma_thiet_bi,
          maThanhPhan: viTri.ma_thanh_phan ?? null,
          viTriTuId: viTri.vi_tri_id ?? null,
        });
        const dichTen = viTriList.find((v) => v.id === viTriTaiSanCu)?.ten;
        toast.success(`Đã thay thế bằng ${tbLabel} tại ${viTriLabel}`, {
          description: dichTen
            ? `Tài sản cũ (${current?.ma_thiet_bi ?? "?"}) chuyển về "${dichTen}".`
            : "Tài sản cũ giữ nguyên vị trí (chưa chọn đích).",
        });
      } else {
        await lapMut.mutateAsync({ thanhPhanId: viTri.id, thietBiId: picked.id, ghiChu });
        // Hoàn tác 12s cho thao tác lắp mới (thay thế không hoàn tác tự động
        // để tránh mất bản ghi tài sản cũ vừa bị đóng).
        showUndoToast({
          message: `Đã lắp ${tbLabel} vào ${viTriLabel}`,
          onUndo: () =>
            thaoMut.mutateAsync({ thanhPhanId: viTri.id, lyDo: "hoàn tác lắp" })
              .then(() => { toast.success(`Đã hoàn tác — tháo ${picked.ma_thiet_bi} khỏi ${viTriLabel}`, { description: "Đã đóng bản ghi trong gan_chuc_nang." }); })
              .catch((e) => { toast.error(errMsg(e, "Không hoàn tác được")); throw e; }),
        });
      }
      onDone();
    } catch (e) {
      toast.error(errMsg(e, "Thao tác thất bại"));
    } finally {
      setDangXuLy(false);
    }
  };

  const doChuyen = async (picked: ThietBiChon) => {
    setDangXuLy(true);
    const viTriLabel = `${viTri.ma_thanh_phan} · ${viTri.ten}`;
    try {
      await chuyenMut.mutateAsync({ thietBiId: picked.id, thanhPhanDich: viTri.id, ghiChu });
      toast.success(`Đã chuyển ${picked.ma_thiet_bi} sang ${viTriLabel}`, {
        description: `Đã ghi gan_chuc_nang (điều chuyển) · thiet_bi_id=${picked.id}`,
      });
      onDone();
    } catch (e) {
      toast.error(errMsg(e, "Không chuyển được tài sản"));
    } finally {
      setDangXuLy(false);
    }
  };

  const submit = async () => {
    if (!chon) { toast.error("Chọn tài sản"); return; }
    const picked = all.find((d) => d.id === chon);
    if (!picked) { toast.error("Không tìm thấy tài sản"); return; }
    // Không phải chế độ thay thế + tài sản đang bận nơi khác → hỏi hoán đổi.
    if (!isReplace && picked.dangLap) { setSwapAsk(picked); return; }
    await doLap(picked);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label>{isReplace ? "Thay thế bằng tài sản" : "Lắp tài sản"} ({options.length} tài sản)</Label>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onDone} aria-label="Nút"><X className="h-3.5 w-3.5" /></Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải danh sách tài sản…</p>
      ) : (
        <Combobox
          options={options} value={chon} onChange={setChon}
          placeholder="Chọn tài sản…" searchPlaceholder="Tìm theo mã / tên / serial…"
          emptyText="Không tìm thấy tài sản"
        />
      )}
      {(() => {
        const picked = chon ? all.find((d) => d.id === chon) : null;
        if (!picked || picked.he_thong_id) return null;
        return (
          <div className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50/70 p-2 text-xs text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/10 dark:text-sky-100">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Tài sản <b>{picked.ma_thiet_bi}</b> chưa có hệ thống mặc định.
              Khi lắp, hệ thống sẽ <b>tự điền</b> hệ thống của thành phần
              &ldquo;{viTri.ten}&rdquo; vào tài sản này.
            </span>
          </div>
        );
      })()}
      <p className="text-xs text-muted-foreground">
        Có thể chọn mọi tài sản. Tài sản đúng phân loại và đang rảnh được ưu tiên lên đầu.
        Nếu chọn tài sản đang lắp nơi khác, hệ thống sẽ hỏi bạn <b>giữ nguyên</b> (gán thêm
        vai trò) hay <b>chuyển</b> tài sản sang vị trí này.
      </p>
      {isReplace && current && (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50/60 p-2 dark:border-amber-900/40 dark:bg-amber-900/10">
          <Label className="text-xs">
            Vị trí đích cho tài sản CŨ ({current.ma_thiet_bi}) — kho / xưởng
          </Label>
          <Combobox
            options={viTriOptions}
            value={viTriTaiSanCu}
            onChange={setViTriTaiSanCu}
            placeholder="Chọn kho / xưởng cho tài sản cũ (khuyến nghị)…"
            searchPlaceholder="Tìm vị trí…"
            emptyText="Không có vị trí phù hợp"
          />
          <p className="text-[11px] text-muted-foreground">
            Bỏ trống → tài sản cũ giữ nguyên vị trí. Khuyến nghị chọn <b>kho sửa chữa</b> nếu
            gắn với hỏng hóc.
          </p>
        </div>
      )}
      <div className="space-y-1">
        <Label>Ghi chú (tuỳ chọn)</Label>
        <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDone}>Huỷ</Button>
        <Button size="sm" onClick={submit} disabled={dangXuLy}>
          {isReplace ? "Thay thế" : "Lắp"}
        </Button>
      </div>

      <AlertDialog open={!!swapAsk} onOpenChange={(o) => { if (!o) setSwapAsk(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tài sản đang lắp ở nơi khác</AlertDialogTitle>
            <AlertDialogDescription>
              {swapAsk && (
                <>
                  <b>{swapAsk.ma_thiet_bi}</b>{swapAsk.ten_thiet_bi ? ` · ${swapAsk.ten_thiet_bi}` : ""} hiện đang lắp tại
                  {" "}<b>{swapAsk.viTriHienTai ?? "một vị trí khác"}</b>.
                  <br />
                  Chọn <b>Chuyển</b> để đóng vai trò cũ và mở vai trò mới tại "{viTri.ten}",
                  hoặc <b>Gán thêm vai trò</b> nếu tài sản đảm nhiệm đồng thời nhiều vị trí.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={dangXuLy}>Huỷ</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={dangXuLy}
              onClick={async () => { const p = swapAsk!; setSwapAsk(null); await doLap(p); }}
            >
              Gán thêm vai trò
            </Button>
            <AlertDialogAction
              disabled={dangXuLy}
              onClick={async (ev) => { ev.preventDefault(); const p = swapAsk!; setSwapAsk(null); await doChuyen(p); }}
            >
              Chuyển sang đây
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : ""}>{value}</dd>
    </div>
  );
}

// ---- Sửa TRỰC TIẾP các trường của thành phần hệ thống → lưu thẳng CSDL -------
function ThanhPhanFieldsForm({
  heThongId, viTri, onDone,
}: {
  heThongId: string;
  viTri: ViTriChucNangTree;
  onDone: () => void;
}) {
  const luuMut = useLuuViTri(heThongId);
  const { data: loaiList = [] } = useCatalog<{ id: string; ten: string }>("dm_loai_thiet_bi");
  const { data: viTriList = [] } = useCatalog<{ id: string; ten: string }>("dm_vi_tri");
  const { data: ttList = [] } = useCatalog<{ id: string; ten: string }>("dm_trang_thai_thiet_bi");

  const [ten, setTen] = useState(viTri.ten ?? "");
  const [ma, setMa] = useState(viTri.ma_thanh_phan ?? "");
  const [moTa, setMoTa] = useState(viTri.mo_ta ?? "");
  const [batBuoc, setBatBuoc] = useState(viTri.bat_buoc ?? true);
  const [thuTu, setThuTu] = useState(viTri.thu_tu != null ? String(viTri.thu_tu) : "");
  const [loai, setLoai] = useState(viTri.loai_thiet_bi_yeu_cau ?? "");
  const [viTriId, setViTriId] = useState(viTri.vi_tri_id ?? "");
  const [ttId, setTtId] = useState(viTri.trang_thai_id ?? "");

  const loaiOptions = useMemo(() => loaiList.map((l) => ({ value: l.id, label: l.ten })), [loaiList]);
  const viTriOptions = useMemo(() => viTriList.map((l) => ({ value: l.id, label: l.ten })), [viTriList]);
  const ttOptions = useMemo(() => ttList.map((l) => ({ value: l.id, label: l.ten })), [ttList]);

  const submit = () => {
    if (!ten.trim()) { toast.error("Nhập tên thành phần"); return; }
    // Mã trống → tự sinh (đảm bảo KHÔNG trùng với các mã đã có trong CSDL)
    const doLuu = async () => {
      let maFinal = ma.trim();
      if (!maFinal) {
        try {
          const { sinhMaThanhPhanDuyNhat } = await import("@/lib/mirats/ma-thiet-bi");
          maFinal = await sinhMaThanhPhanDuyNhat();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Không sinh được mã duy nhất");
          return;
        }
      }
      luuMut.mutate(
        {
          id: viTri.id,
          he_thong_id: heThongId,
          ma_thanh_phan: maFinal,
          ten: ten.trim(),
          mo_ta: moTa.trim() || null,
          bat_buoc: batBuoc,
          thu_tu: thuTu.trim() ? Number(thuTu) : null,
          loai_thiet_bi_yeu_cau: loai || null,
          vi_tri_id: viTriId || null,
          trang_thai_id: ttId || null,
        },
        {
          onSuccess: () => { toast.success("Đã lưu thông tin thành phần vào CSDL"); onDone(); },
          onError: (e) => toast.error(e instanceof Error ? e.message : "Lưu thất bại"),
        },
      );
    };
    void doLuu();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Mã</Label>
          <div className="flex items-center gap-1">
            <Input
              value={ma}
              onChange={(e) => setMa(e.target.value)}
              placeholder="TPHT_XXXXXXXX (bỏ trống → tự sinh)"
              className="font-mono"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              title="Sinh mã ngẫu nhiên khác"
              onClick={async () => {
                try {
                  const { sinhMaThanhPhanDuyNhat } = await import("@/lib/mirats/ma-thiet-bi");
                  setMa(await sinhMaThanhPhanDuyNhat());
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Không sinh được mã duy nhất");
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Thành phần hệ thống</Label>
          <Input value={ten} onChange={(e) => setTen(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Chủng loại yêu cầu</Label>
        <Combobox options={loaiOptions} value={loai} onChange={setLoai} placeholder="Không ràng buộc loại" emptyText="Không có loại" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Vị trí lắp đặt</Label>
          <Combobox options={viTriOptions} value={viTriId} onChange={setViTriId} placeholder="Chọn vị trí" emptyText="Không có vị trí" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trạng thái</Label>
          <Combobox options={ttOptions} value={ttId} onChange={setTtId} placeholder="Chọn trạng thái" emptyText="Không có trạng thái" />
        </div>
      </div>
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Thứ tự</Label>
          <Input value={thuTu} onChange={(e) => setThuTu(e.target.value)} inputMode="numeric" placeholder="1" />
        </div>
        <label className="col-span-2 mt-6 flex items-center gap-2 text-sm">
          <Switch checked={batBuoc} onCheckedChange={setBatBuoc} /> Bắt buộc
        </label>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Mô tả</Label>
        <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDone}>Huỷ</Button>
        <Button size="sm" onClick={submit} disabled={luuMut.isPending}>
          <Save className="mr-1 h-3.5 w-3.5" /> Lưu vào CSDL
        </Button>
      </div>
    </div>
  );
}


function ViTriLichSu({ thanhPhanId }: { thanhPhanId: string }) {
  const { data = [], isLoading } = useLyLichViTri(thanhPhanId);
  if (isLoading) return <p className="text-xs text-muted-foreground">Đang tải lý lịch…</p>;
  if (data.length === 0) return <p className="text-xs text-muted-foreground">Chưa có lịch sử lắp đặt.</p>;
  const fmt = (s: string | null) =>
    s
      ? new Date(s).toLocaleString("vi-VN", {
          hour: "2-digit", minute: "2-digit",
          day: "2-digit", month: "2-digit", year: "numeric",
        })
      : "nay";
  return (
    <ol className="space-y-1.5">
      {data.map((r) => (
        <li key={r.gan_id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs">
          <HardDrive className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{r.ma_thiet_bi}</span>
          {r.ma_serial && <span className="text-muted-foreground">SN {r.ma_serial}</span>}
          <span className="text-muted-foreground">· {fmt(r.tu_ngay)} → {fmt(r.den_ngay)}</span>
          <Badge variant={r.den_ngay ? "outline" : "secondary"} className="ml-auto">
            {r.den_ngay ? r.ly_do : "Đang lắp"}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sổ lý lịch thành phần: tabs (Tất cả / Tháo-lắp / Sự cố / Bảo dưỡng-Hỏng hóc)
// + nút mở sổ lý lịch của hệ thống mẹ trong 1 Dialog riêng.
// ─────────────────────────────────────────────────────────────────────────────
function SoLyLichThanhPhanSection({
  thanhPhanId, heThongId, canEdit,
}: {
  thanhPhanId: string;
  heThongId: string;
  canEdit: boolean;
}) {
  const [openHT, setOpenHT] = useState(false);
  const { data: heThong } = useQuery({
    queryKey: ["he-thong-ten", heThongId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_he_thong")
        .select("id, ten, ma")
        .eq("id", heThongId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Sổ lý lịch thành phần
        </div>
        <Button
          size="sm" variant="outline" className="h-7"
          onClick={() => setOpenHT(true)}
          title="Xem sổ lý lịch của hệ thống mẹ"
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Sổ hệ thống
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 @md:grid-cols-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="lap-thao">Tháo–lắp</TabsTrigger>
          <TabsTrigger value="su-co">Sự cố</TabsTrigger>
          <TabsTrigger value="bt">BD/HH</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-3">
          <LyLichThanhPhanPanel thanhPhanId={thanhPhanId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="lap-thao" className="mt-3">
          <LyLichThanhPhanPanel
            thanhPhanId={thanhPhanId}
            canEdit={canEdit}
            filterKinds={["lap", "thao"]}
            empty="Chưa có lịch sử tháo/lắp tài sản."
          />
        </TabsContent>
        <TabsContent value="su-co" className="mt-3">
          <LyLichThanhPhanPanel
            thanhPhanId={thanhPhanId}
            filterKinds={["su_co"]}
            empty="Chưa có sự cố ghi nhận."
          />
        </TabsContent>
        <TabsContent value="bt" className="mt-3">
          <LyLichThanhPhanPanel
            thanhPhanId={thanhPhanId}
            filterKinds={["bao_tri", "hong_hoc"]}
            empty="Chưa có bảo dưỡng / hỏng hóc."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openHT} onOpenChange={setOpenHT}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <History className="h-4 w-4" />
              Sổ lý lịch hệ thống
              {heThong?.ma && (
                <span className="font-mono text-xs text-muted-foreground">{heThong.ma}</span>
              )}
              {heThong?.ten && <span className="text-sm font-normal">· {heThong.ten}</span>}
            </DialogTitle>
            <DialogDescription>
              Gộp toàn bộ sự kiện của hệ thống và các thành phần con.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <LyLichHeThongPanel heThongId={heThongId} canEdit={canEdit} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
