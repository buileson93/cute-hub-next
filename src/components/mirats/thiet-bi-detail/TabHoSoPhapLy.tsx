import React from "react";
import { ShieldCheck, Paperclip, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThietBiTepDinhKem } from "@/components/mirats/ThietBiTepDinhKem";
import { ChungChiPanel } from "@/components/mirats/ChungChiPanel";
import { DeviceDetailTabProps } from "./types";
import { useSession } from "@/hooks/use-session";

export default function TabHoSoPhapLy({ 
  tb, ma, sysGpSo, sysName, sysGpHan, roles 
}: DeviceDetailTabProps & { roles?: string[] }) {
  const hasGp = Boolean(sysGpSo);
  const gpLabel = "Giấy phép khai thác";
  const { roles: sessionRoles } = useSession();
  const effectiveRoles = roles || sessionRoles || [];

  return (
    <div className="space-y-6">
      {/* Giấy phép khai thác */}
      <section>
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> 
          Giấy phép & Chứng chỉ
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {hasGp ? (
            <div className="flex items-center justify-between rounded-md border p-4 text-sm bg-card shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold font-mono text-base">{sysGpSo}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Hệ thống: <span className="font-medium text-foreground">{sysName}</span>
                  {sysGpHan && <span> · Hạn: <span className="font-medium text-foreground">{sysGpHan}</span></span>}
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                {gpLabel}
              </Badge>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground bg-muted/20">
              Hệ thống chưa có giấy phép khai thác được ghi nhận.
            </div>
          )}
          
          {/* Kiểm định / Hiệu chuẩn */}
          <ChungChiPanel thietBiId={tb.id} cheDo={tb.che_do_kd_hc as any} roles={effectiveRoles} />
        </div>
      </section>

      {/* Tệp đính kèm */}
      <section>
        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Hồ sơ tài liệu đính kèm
        </h3>
        <ThietBiTepDinhKem maThietBi={ma} />
      </section>
    </div>
  );
}
