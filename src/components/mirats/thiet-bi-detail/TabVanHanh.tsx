import React from "react";
import { Clock, Wrench, AlertTriangle, History, ArrowLeftRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DeviceDetailTabProps } from "./types";

export default function TabVanHanh({ 
  timeline, baoTri, suCo, hongHoc, banGiao 
}: DeviceDetailTabProps) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1 bg-muted/50 p-1">
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
          <EventRow key={e.ma_su_co || e.id} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-red-50 text-red-700" />
        ))}
      </TabsContent>

      <TabsContent value="thaythe" className="mt-4 space-y-2">
        {hongHoc.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc / thay thế.</p>}
        {hongHoc.map((e) => (
          <EventRow key={e.ma_hong_hoc || e.id} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-orange-50 text-orange-700" />
        ))}
      </TabsContent>

      <TabsContent value="bangiao" className="mt-4 space-y-2">
        {banGiao.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
        {banGiao.map((e) => (
          <EventRow key={e.ma_ban_giao || e.id} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-sky-50 text-sky-700" />
        ))}
      </TabsContent>
    </Tabs>
  );
}

function Timeline({ items }: { items: any[] }) {
  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {items.map((item, idx) => (
        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-hover:bg-white group-hover:scale-110 transition-all duration-300 z-10">
             <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-white shadow-sm">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-slate-900 text-sm">{item.kind}</div>
              <time className="font-mono text-[10px] text-indigo-500 font-semibold uppercase">{item.at}</time>
            </div>
            <div className="text-slate-500 text-xs">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
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
