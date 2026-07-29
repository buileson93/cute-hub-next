// ============================================================================
// Dialog xác nhận THÁO tài sản khỏi thành phần hệ thống.
// - Bắt buộc chọn `dm_vi_tri` đích (kho/xưởng…) trước khi gọi RPC
//   `thao_tai_san_khoi_thanh_phan(p_gan_id, p_new_vi_tri_id, ...)`.
// - Ghi audit `thao_tai_san` qua `log_app_event` (do hook đảm nhận).
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft, PackageMinus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/backend/client";
import { useThaoTaiSan, useThietBiDangLap } from "@/lib/mirats/he-thong-thanh-phan";

export interface ThaoTaiSanTarget {
  heThongId: string;
  thanhPhanId: string;
  maThanhPhan: string | null;
  tenThanhPhan: string;
  /** Vị trí HIỆN TẠI của thành phần (nguồn để hiển thị "từ đâu"). */
  viTriHienTaiId?: string | null;
  viTriHienTaiTen?: string | null;
}

function useDmViTri() {
  return useQuery({
    queryKey: ["dm-vi-tri-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_vi_tri").select("id, ten, ma").order("ten");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; ten: string; ma: string | null }>;
    },
  });
}

export function ThaoTaiSanDialog({
  target, onClose,
}: {
  target: ThaoTaiSanTarget | null;
  onClose: () => void;
}) {
  const open = !!target;
  const { data: dangLapMap } = useThietBiDangLap(target?.heThongId ?? "");
  const cur = target ? dangLapMap?.get(target.thanhPhanId) ?? null : null;
  const { data: viTriList = [] } = useDmViTri();
  const thaoMut = useThaoTaiSan(target?.heThongId ?? "");

  const [viTriId, setViTriId] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [lyDo, setLyDo] = useState<"tháo" | "điều chuyển" | "sự cố" | "bảo dưỡng">("tháo");

  // Reset khi mở
  useEffect(() => {
    if (open) { setViTriId(""); setGhiChu(""); setLyDo("tháo"); }
  }, [open, target?.thanhPhanId]);

  const options = useMemo(
    () => viTriList
      .filter((v) => v.id !== (target?.viTriHienTaiId ?? ""))
      .map((v) => ({ value: v.id, label: v.ten, hint: v.ma ?? undefined })),
    [viTriList, target?.viTriHienTaiId],
  );

  if (!target) return null;

  const submit = () => {
    if (!cur) { toast.error("Không có tài sản đang lắp tại thành phần này"); return; }
    if (!viTriId) { toast.error("Chọn vị trí đích cho tài sản (kho / xưởng...)"); return; }
    const tenViTri = viTriList.find((v) => v.id === viTriId)?.ten ?? "";
    const tpLabel = `${target.maThanhPhan ?? ""} · ${target.tenThanhPhan}`;
    thaoMut.mutate({
      ganId: cur.gan_id,
      newViTriId: viTriId,
      lyDo,
      ghiChu: ghiChu.trim() || undefined,
      thanhPhanId: target.thanhPhanId,
      thietBiId: cur.thiet_bi_id,
      viTriTuId: target.viTriHienTaiId ?? null,
      maThietBi: cur.ma_thiet_bi,
      maThanhPhan: target.maThanhPhan,
    }, {
      onSuccess: () => {
        toast.success(`Đã tháo ${cur.ma_thiet_bi} khỏi ${tpLabel}`, {
          description: `Chuyển tài sản về vị trí "${tenViTri}". Đã ghi audit (gan_id=${cur.gan_id.slice(0, 8)}…).`,
        });
        onClose();
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không tháo được tài sản"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="h-4 w-4 text-amber-600" />
            Tháo tài sản khỏi thành phần
          </DialogTitle>
          <DialogDescription>
            Chọn vị trí đích (kho, xưởng, khu vực…) mà tài sản sẽ chuyển về sau khi tháo. Vị trí này
            sẽ được ghi vào <span className="font-mono">thiet_bi.vi_tri_id</span> và nhật ký audit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <div><span className="text-muted-foreground">Thành phần:</span> <b>{target.maThanhPhan}</b> · {target.tenThanhPhan}</div>
            {cur ? (
              <div className="mt-1">
                <span className="text-muted-foreground">Tài sản đang lắp:</span>{" "}
                <b className="font-mono">{cur.ma_thiet_bi}</b>
                {cur.ten_thiet_bi ? ` · ${cur.ten_thiet_bi}` : ""}
                {cur.ma_serial ? ` · SN ${cur.ma_serial}` : ""}
              </div>
            ) : (
              <div className="mt-1 text-amber-600">Chưa có tài sản đang lắp tại thành phần này.</div>
            )}
            {target.viTriHienTaiTen && (
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <span>Vị trí hiện tại:</span> <b className="text-foreground">{target.viTriHienTaiTen}</b>
                <ArrowRightLeft className="mx-1 h-3 w-3" />
                <span>đích mới ↓</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Vị trí đích (bắt buộc)</Label>
            <Combobox
              options={options}
              value={viTriId}
              onChange={setViTriId}
              placeholder="Chọn kho / xưởng / khu vực…"
              searchPlaceholder="Tìm vị trí…"
              emptyText="Không có vị trí phù hợp"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Lý do</Label>
            <Combobox
              options={[
                { value: "tháo", label: "Tháo (thu hồi về kho)" },
                { value: "điều chuyển", label: "Điều chuyển" },
                { value: "sự cố", label: "Tháo do sự cố" },
                { value: "bảo dưỡng", label: "Tháo để bảo dưỡng" },
              ]}
              value={lyDo}
              onChange={(v) => setLyDo(v as typeof lyDo)}
              placeholder="Chọn lý do"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: chuyển về kho BDKT-QNH chờ bảo dưỡng"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={submit} disabled={!cur || !viTriId || thaoMut.isPending}>
            {thaoMut.isPending ? "Đang tháo…" : "Xác nhận tháo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
