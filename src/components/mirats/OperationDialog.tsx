import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { PackageOpen, Wrench, ArrowRightLeft, HardDrive, Info, AlertTriangle, History } from "lucide-react";

import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssetPicker } from "@/components/mirats/AssetPicker";
import { Combobox } from "@/components/mirats/Combobox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import {
  useLapThietBi,
  useThaoTaiSan,
  useThayTheThietBi,
  useDieuChuyen,
  useThietBiDangLap,
  useThietBiChon,
  rankChonDevices
} from "@/lib/mirats/he-thong-thanh-phan";

import { Link } from "@tanstack/react-router";

export type OperationMode = "lap" | "thao" | "thay" | "chuyen";

export interface OperationTarget {
  heThongId: string;
  thanhPhanId: string;
  maThanhPhan: string | null;
  tenThanhPhan: string;
  viTriId?: string | null; // Vị trí lắp đặt (công trình/phòng...)
  loaiYeuCau?: string | null;
}

interface OperationDialogProps {
  mode: OperationMode | null;
  target: OperationTarget | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OperationDialog({ mode, target, onClose, onSuccess }: OperationDialogProps) {
  const open = !!mode && !!target;
  const heThongId = target?.heThongId ?? "";
  
  const { data: dangLapMap } = useThietBiDangLap(heThongId);
  const current = target ? dangLapMap?.get(target.thanhPhanId) ?? null : null;
  
  const { data: allAssets = [] } = useThietBiChon();
  
  const lapMut = useLapThietBi(heThongId);
  const thaoMut = useThaoTaiSan(heThongId);
  const thayMut = useThayTheThietBi(heThongId);
  const chuyenMut = useDieuChuyen(heThongId);
  
  const { data: viTriList = [] } = useQuery({
    queryKey: ["dm-vi-tri-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_vi_tri").select("id, ten, ma").order("ten");
      if (error) throw error;
      return data || [];
    }
  });

  const [pickedAssetId, setPickedAssetId] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [lyDo, setLyDo] = useState("tháo");
  const [lastOpResult, setLastOpResult] = useState<{ type: string; id: string; ma: string } | null>(null);

  // Reset states when mode changes
  useEffect(() => {
    if (open) {
      setPickedAssetId("");
      setDestLocationId("");
      setGhiChu("");
      setLyDo("tháo");
      setLastOpResult(null);
    }
  }, [open, mode, target?.thanhPhanId]);

  
  const isBusy = lapMut.isPending || thaoMut.isPending || thayMut.isPending || chuyenMut.isPending;

  const assetOptions = useMemo(() => {
    if (!target) return [];
    return rankChonDevices(allAssets, target.loaiYeuCau || null).map(a => ({
      value: a.id,
      label: `${a.ma_thiet_bi} · ${a.ten_thiet_bi || ""}`,
      hint: [
        a.ma_serial ? `SN: ${a.ma_serial}` : "",
        a.dangLap ? `Đang lắp: ${a.viTriHienTai || "nơi khác"}` : (a.trang_thai_ten || "rảnh"),
        a.khopLoai ? "" : "khác phân loại"
      ].filter(Boolean).join(" · ")
    }));
  }, [allAssets, target]);

  const locationOptions = useMemo(() => 
    viTriList.map(v => ({ value: v.id, label: v.ten, hint: v.ma || undefined })),
    [viTriList]
  );

  const handleSubmit = async () => {
    if (!target || !mode) return;
    const tpLabel = `${target.maThanhPhan ? target.maThanhPhan + " · " : ""}${target.tenThanhPhan}`;
    
    try {
      if (mode === "lap") {
        if (!pickedAssetId) { toast.error("Vui lòng chọn tài sản"); return; }
        const asset = allAssets.find(a => a.id === pickedAssetId);
        const ganId = await lapMut.mutateAsync({ 
          thanhPhanId: target.thanhPhanId, 
          thietBiId: pickedAssetId, 
          ghiChu 
        });
        setLastOpResult({ type: "lap", id: pickedAssetId, ma: asset?.ma_thiet_bi || "" });
        toast.success(`Đã lắp ${asset?.ma_thiet_bi} vào ${tpLabel}`, {
          description: "Đã tạo bản ghi lịch sử tháo lắp."
        });

      } 
      else if (mode === "thao") {
        if (!current) { toast.error("Không có tài sản để tháo"); return; }
        if (!destLocationId) { toast.error("Vui lòng chọn vị trí đích (kho/xưởng)"); return; }
        
        await thaoMut.mutateAsync({
          ganId: current.gan_id,
          newViTriId: destLocationId,
          lyDo,
          ghiChu,
          thanhPhanId: target.thanhPhanId,
          thietBiId: current.thiet_bi_id,
          maThietBi: current.ma_thiet_bi,
          maThanhPhan: target.maThanhPhan
        });
        setLastOpResult({ type: "thao", id: current.thiet_bi_id, ma: current.ma_thiet_bi });
        toast.success(`Đã tháo ${current.ma_thiet_bi} khỏi ${tpLabel}`);

      }
      else if (mode === "thay") {
        if (!pickedAssetId) { toast.error("Vui lòng chọn tài sản mới"); return; }
        if (!destLocationId) { toast.error("Vui lòng chọn vị trí đích cho tài sản cũ"); return; }
        
        const asset = allAssets.find(a => a.id === pickedAssetId);
        await thayMut.mutateAsync({
          thanhPhanId: target.thanhPhanId,
          thietBiMoiId: pickedAssetId,
          ghiChu,
          viTriTaiSanCuId: destLocationId,
          thietBiCuId: current?.thiet_bi_id,
          maThietBiCu: current?.ma_thiet_bi,
          maThietBiMoi: asset?.ma_thiet_bi,
          maThanhPhan: target.maThanhPhan
        });
        setLastOpResult({ type: "thay", id: pickedAssetId, ma: asset?.ma_thiet_bi || "" });
        toast.success(`Đã thay thế tài sản tại ${tpLabel}`);

      }
      else if (mode === "chuyen") {
        if (!pickedAssetId) { toast.error("Vui lòng chọn tài sản"); return; }
        const asset = allAssets.find(a => a.id === pickedAssetId);
        await chuyenMut.mutateAsync({
          thietBiId: pickedAssetId,
          thanhPhanDich: target.thanhPhanId,
          ghiChu
        });
        setLastOpResult({ type: "chuyen", id: pickedAssetId, ma: asset?.ma_thiet_bi || "" });
        toast.success(`Đã điều chuyển ${asset?.ma_thiet_bi} sang ${tpLabel}`);
      }
      
      onSuccess?.();
      
      // Post-operation links
      const targetId = mode === "thao" ? current?.thiet_bi_id : pickedAssetId;
      const targetMa = mode === "thao" ? current?.ma_thiet_bi : allAssets.find(a => a.id === pickedAssetId)?.ma_thiet_bi;

      if (targetId) {
        toast(`Thao tác thành công`, {
          description: (
            <div className="flex flex-col gap-1 mt-1 text-xs">
              <p className="text-muted-foreground">Lịch sử lắp đặt đã được ghi nhận.</p>
              <Link 
                to="/thiet-bi/$maThietBi" 
                params={{ maThietBi: targetMa || "" }}
                className="flex items-center gap-1 text-primary hover:underline mt-1"
              >
                <History className="h-3 w-3" /> Xem lý lịch tài sản {targetMa}
              </Link>
            </div>
          )
        });
      }


      onClose();


    } catch (e: any) {
      toast.error(e.message || "Thao tác thất bại");
    }
  };

  const titles: Record<OperationMode, string> = {
    lap: "Lắp tài sản vào thành phần",
    thao: "Tháo tài sản khỏi thành phần",
    thay: "Thay thế tài sản",
    chuyen: "Điều chuyển tài sản"
  };

  const icons: Record<OperationMode, any> = {
    lap: PackageOpen,
    thao: ArrowRightLeft,
    thay: Wrench,
    chuyen: ArrowRightLeft
  };

  const Icon = icons[mode || "lap"];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={mode ? titles[mode] : ""}
      className="max-w-md"
    >
      <div className="space-y-4 py-2">
        <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thành phần:</span>
            <span className="font-medium">{target?.maThanhPhan} · {target?.tenThanhPhan}</span>
          </div>
          {current && (
            <div className="flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Tài sản hiện tại:</span>
              <span className="font-mono">{current.ma_thiet_bi}</span>
            </div>
          )}
        </div>

        {(mode === "lap" || mode === "thay" || mode === "chuyen") && (
          <div className="space-y-2">
            <Label className="text-xs">{mode === "thay" ? "Tài sản mới" : "Tài sản"}</Label>
            <Combobox
              options={assetOptions}
              value={pickedAssetId}
              onChange={setPickedAssetId}
              placeholder="Chọn tài sản..."
              searchPlaceholder="Tìm mã / tên / serial..."
            />
          </div>
        )}

        {(mode === "thao" || mode === "thay") && (
          <div className="space-y-2">
            <Label className="text-xs">Vị trí đích cho tài sản {mode === "thay" ? "cũ" : ""}</Label>
            <Combobox
              options={locationOptions}
              value={destLocationId}
              onChange={setDestLocationId}
              placeholder="Chọn kho / xưởng..."
            />
          </div>
        )}

        {mode === "thao" && (
          <div className="space-y-2">
            <Label className="text-xs">Lý do tháo</Label>
            <Combobox
              options={[
                { value: "tháo", label: "Tháo (thu hồi về kho)" },
                { value: "điều chuyển", label: "Điều chuyển" },
                { value: "sự cố", label: "Tháo do sự cố" },
                { value: "bảo dưỡng", label: "Tháo để bảo dưỡng" },
              ]}
              value={lyDo}
              onChange={setLyDo}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Ghi chú</Label>
          <Textarea 
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Nhập ghi chú nếu có..."
            rows={2}
            className="text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isBusy}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isBusy}>
            {isBusy ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
