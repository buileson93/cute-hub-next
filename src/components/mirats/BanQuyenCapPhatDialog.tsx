// ============================================================================
// BanQuyenCapPhatDialog — cấp phát bản quyền cho tài sản máy tính/máy chủ.
// Hiển thị danh sách máy đang dùng, số ghế còn lại và cho phép thu hồi.
// ============================================================================
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Laptop, Undo2, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/backend/client";
import { useCapPhatList, type BanQuyenRow } from "@/lib/mirats/ban-quyen";

function useThietBiOptions() {
  return useQuery({
    queryKey: ["ban_quyen", "thiet-bi-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, dm_loai_thiet_bi(ten, la_may_tinh)")
        .order("ten_thiet_bi")
        .limit(2000);
      if (error) throw error;
      type Raw = {
        id: string;
        ma_thiet_bi: string;
        ten_thiet_bi: string | null;
        dm_loai_thiet_bi: { ten: string; la_may_tinh: boolean } | null;
      };
      const rows = (data ?? []) as unknown as Raw[];
      const may = rows.filter((r) => r.dm_loai_thiet_bi?.la_may_tinh);
      const source = may.length > 0 ? may : rows;
      return source.map((r) => ({
        value: r.id,
        label: `${r.ten_thiet_bi ?? r.ma_thiet_bi} · ${r.ma_thiet_bi}`,
      }));
    },
  });
}

export function BanQuyenCapPhatDialog({
  open,
  onOpenChange,
  banQuyen,
  canManage,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  banQuyen: BanQuyenRow | null;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const { data: capPhat = [], isLoading } = useCapPhatList(banQuyen?.id ?? null);
  const { data: tbOptions = [], isLoading: loadingTb } = useThietBiOptions();
  const [thietBiId, setThietBiId] = useState("");
  const [nguoiCai, setNguoiCai] = useState("");

  const dangDung = capPhat.filter((c) => !c.ngay_thu_hoi);
  const conLai = banQuyen?.so_ghe == null ? null : banQuyen.so_ghe - dangDung.length;

  const capPhatMut = useMutation({
    mutationFn: async () => {
      if (!banQuyen || !thietBiId) throw new Error("Chưa chọn tài sản");
      const { error } = await supabase.from("phan_mem_ban_quyen_cap_phat").insert({
        ban_quyen_id: banQuyen.id,
        thiet_bi_id: thietBiId,
        nguoi_cai: nguoiCai || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      setThietBiId("");
      setNguoiCai("");
      toast.success("Đã cấp phát bản quyền cho tài sản");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không cấp phát được"),
  });

  const thuHoiMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("phan_mem_ban_quyen_cap_phat")
        .update({ ngay_thu_hoi: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      toast.success("Đã thu hồi ghế bản quyền");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thu hồi được"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Cấp phát: {banQuyen?.ten_phan_mem ?? "—"}
          </DialogTitle>
          <DialogDescription>
            {banQuyen?.so_ghe == null
              ? "Bản quyền không giới hạn số ghế."
              : `Đã dùng ${dangDung.length}/${banQuyen.so_ghe} ghế — còn lại ${conLai}.`}
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center">
            <Combobox
              className="flex-1"
              value={thietBiId}
              onChange={setThietBiId}
              options={tbOptions}
              loading={loadingTb}
              placeholder="Chọn máy tính/máy chủ"
              searchPlaceholder="Tìm theo tên hoặc mã tài sản…"
            />
            <Input
              className="sm:w-48"
              value={nguoiCai}
              onChange={(e) => setNguoiCai(e.target.value)}
              placeholder="Người cài đặt"
            />
            <Button
              size="sm"
              disabled={!thietBiId || capPhatMut.isPending || (conLai != null && conLai <= 0)}
              onClick={() => capPhatMut.mutate()}
            >
              <Plus className="mr-1 h-4 w-4" /> Cấp phát
            </Button>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Đang tải…</div>
          ) : capPhat.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa cấp phát cho tài sản nào</div>
          ) : (
            <ul className="divide-y">
              {capPhat.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.tenThietBi ?? c.maThietBi}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {c.maThietBi} · cài {c.ngay_cai_dat}
                      {c.nguoi_cai ? ` · ${c.nguoi_cai}` : ""}
                    </div>
                  </div>
                  {c.ngay_thu_hoi ? (
                    <Badge variant="secondary">Đã thu hồi {c.ngay_thu_hoi}</Badge>
                  ) : canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={thuHoiMut.isPending}
                      onClick={() => thuHoiMut.mutate(c.id)}
                    >
                      <Undo2 className="mr-1 h-3.5 w-3.5" /> Thu hồi
                    </Button>
                  ) : (
                    <Badge variant="secondary">Đang dùng</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}