import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { LayoutDashboard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCompletenessStats } from '@/lib/mirats/completeness.functions';
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  HardDrive, ShieldCheck, AlertTriangle, Clock, CheckCircle2, HeartPulse,
  Wrench, Activity, Radio, TrendingUp, Target, Gauge, Download, Package, Search,
  Database, Sparkles, Flame,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  licenseStatus, healthDetail,
  mttrPhut, phanTramVongDoi,
} from "@/lib/mirats/metrics";
import { fmtDowntime } from "@/lib/mirats/format";
import {
  availability as calcAvailability, mttr as calcMttr, mtbf as calcMtbf,
  rangeHours, formatKpiValue, type KpiResult, type ReliabilityIncident,
} from "@/lib/mirats/reliability";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { isOpenState } from "@/lib/mirats/su-co-state";


export const Route = createFileRoute("/_app/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['completeness-stats'],
      queryFn: () => getCompletenessStats(),
    });
  },
  head: () => ({
    meta: [
      { title: "Dashboard & KPI — MIRATS 2.0" },
      { name: "description", content: "Trung tâm hành động MIRATS 2.0: việc cần làm, cảnh báo, quá hạn — xử lý nhanh mọi hoạt động trong ngày." },
      { property: "og:title", content: "Hành động hôm nay — MIRATS 2.0" },
      { property: "og:description", content: "Tình hình sự cố, bảo trì và giấy phép cần xử lý ngay." },
    ],
  }),
  component: Dashboard,
});

const SEV_COLORS: Record<string, string> = {
  "Nghiêm trọng": "hsl(0 84% 60%)", "Cao": "hsl(24 94% 52%)", "Trung bình": "hsl(38 92% 50%)", "Thấp": "hsl(215 16% 55%)",
};

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 1000) / 10 : 0; }

function Dashboard() {
  const statsQuery = useSuspenseQuery({
    queryKey: ['completeness-stats'],
    queryFn: () => getCompletenessStats(),
  });
  const completeness = (statsQuery.data as any) || {};

  const { donVi, thietBi, giayPhep, suCo, baoTri } = useScope();
  const { data: tax } = useDbTaxonomy();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const heThongMap = useMemo(() => {
    const dvMa = new Map((tax?.donViList ?? []).map((d) => [d.id, d.ma]));
    return new Map(
      (tax?.htList ?? []).map((h) => [h.ma, {
        ma: h.ma, ten: h.ten, nhom: h.nhomId, don_vi: dvMa.get(h.donViId) ?? "",
      }]),
    );
  }, [tax]);

  const gpStats = useMemo(() => {
    const c: Record<string, number> = { valid: 0, expiring: 0, expired: 0, none: 0 };
    for (const g of giayPhep) c[licenseStatus(g, today)]++;
    return c;
  }, [giayPhep, today]);

  const openIncidents = useMemo(() => suCo.filter((s) => isOpenState(s.trang_thai)), [suCo]);

  const pmDueSoon = useMemo(() => {
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 30);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    return baoTri
      .filter((b) => b.trang_thai !== "Hoàn thành" && b.loai_bao_tri === "Định kỳ" && b.ngay_bat_dau <= cutoffISO)
      .sort((a, b) => a.ngay_bat_dau.localeCompare(b.ngay_bat_dau))
      .slice(0, 8);
  }, [baoTri, today]);

  return (
    <PageBody>
      <PageHeader
        title="Chào buổi sáng!"
        icon={LayoutDashboard}
        description="Chào mừng bạn quay lại MIRATS. Đây là tóm tắt các hoạt động bạn cần chú ý trong hôm nay."
      />

      {/* Action Center - Refactored to only display Tasks/Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Tiến độ làm sạch dữ liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-primary">{completeness.avg_thiet_bi || 0}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Hoàn thiện</p>
                <Button asChild size="sm" variant="ghost" className="mt-2 text-xs">
                  <Link to="/chat-luong-du-lieu">Chi tiết <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Data Health Score</span>
                    <span>{completeness.avg_thiet_bi || 0}%</span>
                  </div>
                  <Progress value={completeness.avg_thiet_bi || 0} className="h-2 bg-primary/10" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="text-[10px] font-bold text-green-700">{completeness.perfect_tb || 0} Tài sản</p>
                    <p className="text-[9px] text-green-600/60 uppercase">Đạt 100%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] font-bold text-amber-700">{completeness.low_pct_tb || 0} Tài sản</p>
                    <p className="text-[9px] text-amber-600/60 uppercase">Dưới 50%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
              <Flame className="w-4 h-4" /> Hành động khẩn cấp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <ActionRow 
               icon={AlertTriangle} 
               label="Sự cố đang mở" 
               value={openIncidents.length} 
               to="/su-co"
               sub={`${openIncidents.filter(s => s.muc_do === 'Cao' || s.muc_do === 'Nghiêm trọng').length} vụ mức độ cao`}
             />
             <ActionRow 
               icon={Wrench} 
               label="PM sắp đến hạn" 
               value={pmDueSoon.length} 
               to="/bao-tri/pm"
               sub="Trong 30 ngày tới"
             />
             <ActionRow 
               icon={ShieldCheck} 
               label="Giấy phép quá hạn" 
               value={gpStats.expired} 
               to="/giay-phep"
               sub="Cần gia hạn ngay"
             />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bản tin vận hành</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground italic text-center py-8">
            Thông tin chi tiết về các chỉ số Availability, MTBF, MTTR đã được chuyển sang trang <Link to="/tong-quan" search={{ days: 30, donVi: [] }} className="text-primary hover:underline font-medium">Phân tích Tổng quan</Link>.
          </CardContent>
        </Card>
      </div>
    </PageBody>
  );
}

function ActionRow({ icon: Icon, label, value, to, sub }: { icon: any; label: string; value: number; to: string; sub: string }) {
  return (
    <Link to={to as any} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-background border shadow-sm">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[10px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </Link>
  );
}
