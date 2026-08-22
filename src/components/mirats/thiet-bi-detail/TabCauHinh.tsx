import React from "react";
import { Cpu, Activity, ShieldCheck, PackageCheck, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KheLinhKienPanel } from "@/components/mirats/KheLinhKienPanel";
import { ThietBiBanQuyen } from "@/components/mirats/ThietBiBanQuyen";
import { DeviceDetailTabProps } from "./types";
import { Badge } from "@/components/ui/badge";

export default function TabCauHinh({
  tb,
  ma,
  canManage,
  canEdit,
  vaiTroList,
  TelemetryPanel,
  AllocationPanel,
  donViTenMap,
}: DeviceDetailTabProps & { TelemetryPanel?: any; AllocationPanel?: any; donViTenMap?: any }) {
  return (
    <Tabs defaultValue="linhkien" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1 bg-muted/30 p-1 rounded-2xl">
        <TabsTrigger value="linhkien" className="text-xs py-1.5">
          <Cpu className="mr-1 h-3 w-3" /> Linh kiện
        </TabsTrigger>
        <TabsTrigger value="vaitro" className="text-xs py-1.5">
          <Layers className="mr-1 h-3 w-3" /> Vai trò ({vaiTroList.length})
        </TabsTrigger>
        <TabsTrigger value="dodac" className="text-xs py-1.5">
          <Activity className="mr-1 h-3 w-3" /> Đo đạc
        </TabsTrigger>
        <TabsTrigger value="banquyen" className="text-xs py-1.5">
          <ShieldCheck className="mr-1 h-3 w-3" /> Phần mềm
        </TabsTrigger>
        <TabsTrigger value="capphat" className="text-xs py-1.5">
          <PackageCheck className="mr-1 h-3 w-3" /> Cấp phát
        </TabsTrigger>
      </TabsList>

      <TabsContent value="linhkien" className="mt-4">
        <KheLinhKienPanel thietBiId={tb.id} canManage={canEdit} />
      </TabsContent>

      <TabsContent value="vaitro" className="mt-4">
        <div className="space-y-3">
          {vaiTroList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tài sản chưa được lắp vào thành phần hệ thống nào.
            </p>
          ) : (
            vaiTroList.map((r) => (
              <div
                key={r.gan_id}
                className="flex items-center justify-between rounded-2xl border p-4 bg-card shadow-sm ring-1 ring-border/50"
              >
                <div>
                  <div className="font-bold text-[13px] text-foreground">{r.ten_thanh_phan}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {r.ma_thanh_phan} {r.ten_he_thong ? `· ${r.ten_he_thong}` : ""}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  Đang đảm nhận
                </Badge>
              </div>
            ))
          )}
          {vaiTroList.length >= 2 && (
            <div className="rounded-2xl border border-amber-200/50 bg-amber-500/5 p-4 text-[13px] text-amber-700 dark:text-amber-400 flex items-start gap-3 ring-1 ring-amber-500/20">
              <span className="shrink-0 text-base">⚠</span>
              <span>
                <strong>Đa vai trò:</strong> Tài sản này đang phục vụ song song cho{" "}
                {vaiTroList.length} thành phần khác nhau. Hãy cẩn trọng khi thay thế hoặc sửa chữa.
              </span>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="dodac" className="mt-4">
        {TelemetryPanel ? (
          <TelemetryPanel thietBiId={tb.id} canManage={canEdit} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground italic">
            Component TelemetryPanel chưa sẵn sàng.
          </p>
        )}
      </TabsContent>

      <TabsContent value="banquyen" className="mt-4">
        <ThietBiBanQuyen thietBiId={tb.id} canManage={canEdit} />
      </TabsContent>

      <TabsContent value="capphat" className="mt-4">
        {AllocationPanel ? (
          <AllocationPanel thietBiId={tb.id} donViTenMap={donViTenMap} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground italic">
            Component AllocationPanel chưa sẵn sàng.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
