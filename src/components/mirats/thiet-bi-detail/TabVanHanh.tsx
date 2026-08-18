import React, { useState } from "react";
import { Clock, Wrench, AlertTriangle, History, ArrowLeftRight, Check, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DeviceDetailTabProps } from "./types";

export default function TabVanHanh({ 
  timeline, baoTri, suCo, hongHoc, banGiao, canEdit
}: DeviceDetailTabProps) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1 bg-primary/5 p-1 border-primary/10 border">
        <TabsTrigger value="timeline" className="text-xs py-1.5">
          <Clock className="mr-1 h-3 w-3" /> Timeline ({timeline.length})
        </TabsTrigger>
        <TabsTrigger value="baotri" className="text-xs py-1.5">
          <Wrench className="mr-1 h-3 w-3" /> Bảo dưỡng ({baoTri.length})
        </TabsTrigger>
        <TabsTrigger value="suco" className="text-xs py-1.5">
          <AlertTriangle className="mr-1 h-3 w-3" /> Sự cố ({suCo.length})
        </TabsTrigger>
        <TabsTrigger value="thaythe" className="text-xs py-1.5">
          <History className="mr-1 h-3 w-3" /> Thay thế ({hongHoc.length})
        </TabsTrigger>
        <TabsTrigger value="bangiao" className="text-xs py-1.5">
          <ArrowLeftRight className="mr-1 h-3 w-3" /> Bàn giao ({banGiao.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="timeline" className="mt-4">
        {timeline.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có sự kiện lịch sử nào.</p>
        ) : (
          <Timeline items={timeline} />
        )}
      </TabsContent>

      <TabsContent value="baotri" className="mt-4 space-y-2">
        {baoTri.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có phiếu bảo dưỡng.</p>}
        {baoTri.map((e) => (
          <EventRow key={e.ma_bao_tri || e.id} title={e.mo_ta_cong_viec || e.loai_bao_tri} date={e.ngay_bat_dau} label={e.loai_bao_tri} desc={e.ket_qua ?? ""} tag={e.trang_thai} />
        ))}
      </TabsContent>

      <TabsContent value="suco" className="mt-4 space-y-2">
        {suCo.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Không có sự cố ghi nhận.</p>}
        {suCo.map((e) => (
          <EventRow key={e.ma_su_co || e.id} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-destructive/10 text-destructive border-destructive/20" />
        ))}
      </TabsContent>

      <TabsContent value="thaythe" className="mt-4 space-y-2">
        {hongHoc.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc / thay thế.</p>}
        {hongHoc.map((e) => (
          <EventRow key={e.ma_hong_hoc || e.id} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-warning/10 text-warning border-warning/20" />
        ))}
      </TabsContent>

      <TabsContent value="bangiao" className="mt-4 space-y-2">
        {banGiao.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
        {banGiao.map((e) => (
          <EventRow key={e.ma_ban_giao || e.id} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-info/10 text-info border-info/20" />
        ))}
      </TabsContent>
    </Tabs>
  );
}

function Timeline({ items }: { items: any[] }) {
  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {items.map((it, i) => {
        const Icon = it.kind === 'bt' ? Wrench : it.kind === 'sc' ? AlertTriangle : it.kind === 'hh' ? History : ArrowLeftRight;
        const color = it.kind === 'bt' ? 'bg-primary' : it.kind === 'sc' ? 'bg-destructive' : it.kind === 'hh' ? 'bg-warning' : 'bg-info';
        const iconColor = it.kind === 'hh' || it.kind === 'sc' ? 'text-foreground' : 'text-primary-foreground';
        return (
          <li key={i} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background shadow-sm ${color}`}>
              <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{it.at}</span>
                <Badge variant="outline">{it.kind === 'bt' ? 'Bảo dưỡng' : it.kind === 'sc' ? 'Sự cố' : it.kind === 'hh' ? 'Hỏng hóc' : 'Bàn giao'}</Badge>
              </div>
              <div className="mt-1 font-medium">{it.title}</div>
              {it.desc && <div className="mt-0.5 text-muted-foreground">{it.desc}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}


function EventRow({ title, date, label, desc, tag, tone }: any) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {tag && <Badge variant="secondary" className={`text-[10px] h-4 ${tone}`}>{tag}</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{date || "—"}</span>
          <span>·</span>
          <span>{label}</span>
          {desc && <span>·</span>}
          {desc && <span className="truncate max-w-[200px]">{desc}</span>}
        </div>
      </div>
      <Badge variant="outline" className="shrink-0">{label}</Badge>
    </div>
  );
}
