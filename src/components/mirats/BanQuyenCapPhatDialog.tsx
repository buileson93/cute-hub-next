// ============================================================================
// BanQuyenCapPhatDialog — cấp phát bản quyền cho tài sản máy tính/máy chủ.
// Hiển thị danh sách máy đang dùng, số ghế còn lại và cho phép thu hồi.
// ============================================================================
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Laptop, Undo2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/backend/client";
import { useCapPhatList, type BanQuyenRow } from "@/lib/mirats/ban-quyen";
import { UserCircle } from "lucide-react";


function useThietBiOptions(search: string = "") {
  return useQuery({
    queryKey: ["ban_quyen", "thiet-bi-options", search],
    queryFn: async () => {
      let query = supabase
        .from("thiet_bi")
        .select(`
          id, ma_thiet_bi, ten_thiet_bi, ma_serial, model_id,
          nhan_vien:nhan_vien_id(ho_ten, don_vi, chuc_vu),
          dm_loai_thiet_bi!inner(ten, la_may_tinh),
          dm_model:model_id(ten, ma)
        `)

        .eq("dm_loai_thiet_bi.la_may_tinh", true)
        .order("ten_thiet_bi")
        .limit(100);

      if (search) {
        query = query.or(`ten_thiet_bi.ilike.%${search}%,ma_thiet_bi.ilike.%${search}%,nhan_vien.ho_ten.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data ?? []).map((r: any) => ({
        value: r.id,
        label: `${r.ten_thiet_bi ?? r.ma_thiet_bi} · ${r.ma_thiet_bi}`,
        subLabel: r.nhan_vien ? `${r.nhan_vien.ho_ten} (${r.nhan_vien.don_vi || 'KĐĐ'})` : "Chưa gán người sử dụng",
        nhanVien: r.nhan_vien,
        hasModel: !!r.model_id,
        hasSerial: !!r.ma_serial
      }));

    },
  });
}

function useBanQuyenOptions() {
  return useQuery({
    queryKey: ["ban_quyen", "options-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen")
        .select("id, ten_phan_mem, ma_ban_quyen, so_ghe")
        .order("ten_phan_mem");
      
      if (error) throw error;
      return (data ?? []).map(r => ({
        value: r.id,
        label: `${r.ten_phan_mem} (${r.ma_ban_quyen})`,
        so_ghe: r.so_ghe
      }));
    }
  });
}

export function BanQuyenCapPhatDialog({
  open,
  onOpenChange,
  banQuyen,
  canManage,
  initialDeviceId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  banQuyen: BanQuyenRow | null;
  canManage: boolean;
  initialDeviceId?: string | null;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: capPhat = [], isLoading } = useCapPhatList(banQuyen?.id ?? null);
  const { data: tbOptions = [], isLoading: loadingTb } = useThietBiOptions(search);
  const { data: bqOptions = [] } = useBanQuyenOptions();
  
  const [selectedBqId, setSelectedBqId] = useState(banQuyen?.id || "");
  const [thietBiId, setThietBiId] = useState(initialDeviceId || "");
  const [nguoiCai, setNguoiCai] = useState("");

  const activeBq = banQuyen || bqOptions.find(o => o.value === selectedBqId);
  const dangDung = capPhat.filter((c) => !c.ngay_thu_hoi);
  const conLai = activeBq?.so_ghe == null ? null : (activeBq as any).so_ghe - dangDung.length;

  const capPhatMut = useMutation({
    mutationFn: async () => {
      const bqId = banQuyen?.id || selectedBqId;
      if (!bqId || !thietBiId) throw new Error("Chưa chọn tài sản hoặc bản quyền");
      
      const selectedTb = tbOptions.find(o => o.value === thietBiId);
      if (!selectedTb?.nhanVien) {
        throw new Error("Tài sản chưa được gán nhân viên phụ trách. Vui lòng cập nhật danh mục trước khi cấp phát.");
      }
      if (!selectedTb.hasModel || !selectedTb.hasSerial) {
        throw new Error("Tài sản thiếu thông tin Model hoặc Số Serial. Vui lòng bổ sung thông tin này.");
      }

      const { error } = await supabase.from("phan_mem_ban_quyen_cap_phat").insert({
        ban_quyen_id: bqId,
        thiet_bi_id: thietBiId,
        nguoi_cai: nguoiCai || null,
      });
      if (error) throw error;
      await import("@/lib/mirats/ban-quyen-detail").then(m => 
        m.logBanQuyenAudit(bqId, "ASSIGN", `Cấp phát bản quyền cho thiết bị ID: ${thietBiId}`)
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      qc.invalidateQueries({ queryKey: ["ban_quyen", "cap-phat-list-unified"] });
      setThietBiId("");
      setNguoiCai("");
      toast.success("Đã cấp phát bản quyền cho tài sản");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không cấp phát được"),
  });

  const thuHoiMut = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen_cap_phat")
        .update({ ngay_thu_hoi: new Date().toISOString().slice(0, 10) })
        .eq("id", id)
        .select("ban_quyen_id, thiet_bi_id")
        .single();
      if (error) throw error;
      if (data) {
        await import("@/lib/mirats/ban-quyen-detail").then(m => 
          m.logBanQuyenAudit(data.ban_quyen_id, "REVOKE", `Thu hồi bản quyền từ thiết bị ID: ${data.thiet_bi_id}`)
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      qc.invalidateQueries({ queryKey: ["ban_quyen", "cap-phat-list-unified"] });
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
            Cấp phát: {activeBq ? (activeBq as any).ten_phan_mem || (activeBq as any).label : "Chọn bản quyền"}
          </DialogTitle>
          <DialogDescription>
            {activeBq ? (
              (activeBq as any).so_ghe == null
                ? "Bản quyền không giới hạn số ghế."
                : `Đã dùng ${dangDung.length}/${(activeBq as any).so_ghe} ghế — còn lại ${conLai}.`
            ) : (
              "Vui lòng chọn bản quyền phần mềm để cấp phát cho thiết bị."
            )}
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="flex flex-col gap-4 rounded-xl border-2 border-primary/10 bg-primary/5 p-4 transition-all hover:border-primary/20">
            {!banQuyen && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 ml-1">Bản quyền phần mềm</label>
                <Combobox
                  className="w-full"
                  value={selectedBqId}
                  onChange={setSelectedBqId}
                  options={bqOptions}
                  placeholder="Chọn bản quyền phần mềm..."
                />
              </div>
            )}
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 ml-1">Tài sản (Máy tính/Máy chủ)</label>
                <Combobox
                  className="w-full"
                  value={thietBiId}
                  onChange={setThietBiId}
                  options={tbOptions}
                  loading={loadingTb}
                  onSearchChange={setSearch}
                  placeholder="Chọn tài sản..."
                  searchPlaceholder="Tìm theo tên hoặc mã tài sản…"
                />
                {thietBiId && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(() => {
                      const tb = tbOptions.find(o => o.value === thietBiId);
                      if (!tb) return null;
                      return (
                        <>
                          <Badge variant={tb.nhanVien ? "outline" : "destructive"} className="gap-1 px-1.5 py-0.5 text-[10px]">
                            {tb.nhanVien ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3" />}
                            Nhân viên: {tb.nhanVien ? tb.nhanVien.ho_ten : "Chưa gán"}
                          </Badge>
                          <Badge variant={tb.hasModel ? "outline" : "destructive"} className="gap-1 px-1.5 py-0.5 text-[10px]">
                            {tb.hasModel ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3" />}
                            Model: {tb.hasModel ? "OK" : "Thiếu"}
                          </Badge>
                          <Badge variant={tb.hasSerial ? "outline" : "destructive"} className="gap-1 px-1.5 py-0.5 text-[10px]">
                            {tb.hasSerial ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3" />}
                            Serial: {tb.hasSerial ? "OK" : "Thiếu"}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="w-full md:w-64 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-primary/70 ml-1">Người cài đặt</label>
                <Input
                  className="w-full bg-background"
                  value={nguoiCai}
                  onChange={(e) => setNguoiCai(e.target.value)}
                  placeholder="Họ tên người cài..."
                />
              </div>
              <Button
                className="shadow-lg shadow-primary/20 h-10 px-6 font-semibold"
                disabled={
                  !thietBiId || 
                  capPhatMut.isPending || 
                  (conLai != null && conLai <= 0) ||
                  !tbOptions.find(o => o.value === thietBiId)?.nhanVien ||
                  !tbOptions.find(o => o.value === thietBiId)?.hasModel ||
                  !tbOptions.find(o => o.value === thietBiId)?.hasSerial
                }
                onClick={() => capPhatMut.mutate()}
              >
                <Plus className="mr-2 h-4 w-4" /> Cấp phát
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto rounded-xl border-2 border-muted/30 bg-muted/5">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Đang tải…</div>
          ) : capPhat.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chưa cấp phát cho tài sản nào</div>
          ) : (
            <ul className="divide-y">
              {capPhat.map((c: any) => (
                <li key={c.id} className="group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-primary/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-5 w-5 text-muted-foreground/70" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.tenThietBi ?? c.maThietBi}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {c.maThietBi} · cài {c.ngay_cai_dat}
                        {c.nguoi_cai ? ` · ${c.nguoi_cai}` : ""}
                      </div>
                      {c.nhanVien && (
                        <div className="text-[10px] text-primary/70 font-medium">
                          👤 {c.nhanVien.hoTen} ({c.nhanVien.donVi || 'KĐĐ'})
                        </div>
                      )}
                    </div>
                  </div>

                  {c.ngay_thu_hoi ? (
                    <Badge variant="secondary">Đã thu hồi {c.ngay_thu_hoi}</Badge>
                  ) : canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                      disabled={thuHoiMut.isPending}
                      onClick={() => thuHoiMut.mutate(c.id)}
                    >
                      <Undo2 className="mr-2 h-4 w-4" /> Thu hồi
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
