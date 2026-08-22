import { ShieldCheck, Laptop, Calendar, User, History, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCapPhatListUnified } from "@/lib/mirats/ban-quyen";
import { STATUS_CLASS, STATUS_LABEL, trangThaiBanQuyen } from "@/lib/mirats/ban-quyen";
import { useState } from "react";
import { BanQuyenCapPhatDialog } from "./BanQuyenCapPhatDialog";

export function ThietBiBanQuyen({
  thietBiId,
  canManage,
}: {
  thietBiId: string;
  canManage?: boolean;
}) {
  const { data = [], isLoading } = useCapPhatListUnified({ thietBiId });
  const [showAssign, setShowAssign] = useState(false);

  if (isLoading)
    return <div className="p-4 text-sm text-muted-foreground">Đang tải danh sách bản quyền...</div>;

  const current = data.filter((r: any) => !r.ngay_thu_hoi);
  const history = data.filter((r: any) => !!r.ngay_thu_hoi);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Phần mềm & Bản quyền hiện tại
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => setShowAssign(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Cấp phát bản quyền
          </Button>
        )}
      </div>

      {current.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center bg-muted/20">
          <Laptop className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-muted-foreground">Chưa có phần mềm nào được gán cho thiết bị này.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {current.map((item: any) => {
            const status = trangThaiBanQuyen(item.ngayHetHan);
            const tenPhanMem = item.tenPhanMem || item.tenThietBi; // Fix tenThietBi being software name in redundant hook
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="font-bold text-primary group-hover:text-primary/80">
                      {tenPhanMem}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Phiên bản: {item.phienBan || "N/A"}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_CLASS[status]}>
                    {STATUS_LABEL[status]}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono bg-muted/50 p-1.5 rounded border border-dashed">
                    <span className="text-muted-foreground shrink-0 uppercase tracking-tighter text-[10px]">
                      Key:
                    </span>
                    <span className="truncate">{item.licenseKey || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{" "}
                      {new Date(item.ngay_cai_dat).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.nguoi_cai || "Hệ thống"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <History className="h-4 w-4" />
            Lịch sử phần mềm
          </h3>
          <div className="space-y-2">
            {history.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border opacity-70"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.tenPhanMem || item.tenThietBi}</span>
                  <span className="text-muted-foreground">
                    Thu hồi: {new Date(item.ngay_thu_hoi).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Đã thu hồi
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAssign && (
        <BanQuyenCapPhatDialog
          banQuyen={null}
          open={showAssign}
          onOpenChange={setShowAssign}
          canManage={canManage ?? false}
          initialDeviceId={thietBiId}
        />
      )}
    </div>
  );
}
