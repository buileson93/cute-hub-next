import { Suspense, lazy } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { toast } from "sonner";
import {
  ArrowLeft, Gauge, Calendar, AlertTriangle, Wrench, PencilLine,
  LayoutDashboard, Activity, ShieldCheck, Cpu, Settings, History, ArrowLeftRight
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useScope } from "@/lib/mirats/scope";
import { useSession } from "@/hooks/use-session";
import {
  useTelemetry, useAddTelemetry, useLifecycle, useTrangThaiMap,
  useCapPhatThietBi, useAllocationHistory, useCapPhatVoiChuKy, useLatestHandover,
} from "@/lib/mirats/db-smart";
import { CapPhatControl } from "@/components/mirats/CapPhatControl";
import { ThietBiLifecycleActions } from "@/components/mirats/ThietBiLifecycleActions";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { buildRecordTimeline, type TimelineItem } from "@/lib/mirats/record-timeline";
import { formatVal } from "@/lib/mirats/change-log-utils";
import { useVaiTroThietBi } from "@/lib/mirats/he-thong-thanh-phan";
import { getTrangThaiToken } from "@/lib/mirats/ui/status-tokens";

import { Skeleton } from "@/components/ui/skeleton";

// Lazy load tab components
const TabTongQuan = lazy(() => import("@/components/mirats/thiet-bi-detail/TabTongQuan"));
const TabVanHanh = lazy(() => import("@/components/mirats/thiet-bi-detail/TabVanHanh"));
const TabHoSoPhapLy = lazy(() => import("@/components/mirats/thiet-bi-detail/TabHoSoPhapLy"));
const TabCauHinh = lazy(() => import("@/components/mirats/thiet-bi-detail/TabCauHinh"));
const TabNangCao = lazy(() => import("@/components/mirats/thiet-bi-detail/TabNangCao"));

export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.maThietBi} — Sổ lý lịch tài sản — MIRATS 2.0` },
      { name: "description", content: `Sổ lý lịch tài sản ${params.maThietBi}: thông tin, vận hành, cấu hình và hồ sơ pháp lý.` },
    ],
  }),
  component: ThietBiDetail,
});

function ThietBiDetail() {
  const { maThietBi } = Route.useParams();
  const { inScope, scopeAll } = useScope();
  const { data: taxo, isLoading, error } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();
  const { data: devNameOv } = useDeviceNameOverrides();

  const tb = useMemo<DbDevice | undefined>(
    () => taxo?.devices.find((d) => d.ma_thiet_bi === maThietBi),
    [taxo, maThietBi],
  );

  if (isLoading) return <div className="p-16 text-center"><Skeleton className="h-20 w-full" /></div>;
  if (error || !tb) return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold">Không tìm thấy tài sản</h2>
      <Button asChild variant="outline" className="mt-4"><Link to="/thiet-bi">Về danh sách</Link></Button>
    </div>
  );
  
  if (!scopeAll && !inScope(tb.don_vi)) return <AccessDenied backTo="/thiet-bi" backLabel="Về danh sách tài sản" />;

  return <ThietBiDetailInner tb={tb} tenTb={devNameOv?.get(tb.ma_thiet_bi) || tb.ten} sysName={(tb._htId && nameOv?.get(tb._htId)) || tb._htTen} sysGpSo={taxo?.htList.find((h) => h.id === tb._htId)?.gpSo ?? ""} sysGpHan={taxo?.htList.find((h) => h.id === tb._htId)?.gpHan ?? ""} />;
}

function ThietBiDetailInner({ tb, tenTb, sysName, sysGpSo, sysGpHan }: { tb: DbDevice; tenTb: string; sysName: string; sysGpSo: string; sysGpHan: string }) {
  const { ops } = useOperationsData();
  const { data: taxo } = useDbTaxonomy();
  const ma = tb.ma_thiet_bi;

  const { data: loaiMau } = useQuery({
    queryKey: ["dm_loai_thiet_bi_mau", tb._loaiTbId],
    enabled: !!tb._loaiTbId,
    queryFn: async () => {
      const { data } = await supabase.from("dm_loai_thiet_bi").select("mau").eq("id", tb._loaiTbId!).maybeSingle();
      return data?.mau as string | null;
    },
  });

  const { data: refInfo } = useQuery({
    queryKey: ["tb_ref_info", ma],
    queryFn: async () => {
      const { data } = await supabase.from("thiet_bi").select("dm_model(ten, p_n, hinh_anh), dm_nha_san_xuat(ten), dm_nha_cung_cap(ten)").eq("ma_thiet_bi", ma).maybeSingle();
      const row = data as any;
      let modelImg = "";
      if (row?.dm_model?.hinh_anh) {
        const { data: signed } = await storage.from("model-anh").createSignedUrl(row.dm_model.hinh_anh, 315360000);
        modelImg = signed?.signedUrl ?? "";
      }
      return {
        model: row?.dm_model?.ten || "",
        modelPn: row?.dm_model?.p_n || "",
        nhaSanXuat: row?.dm_nha_san_xuat?.ten || "",
        nhaCungCap: row?.dm_nha_cung_cap?.ten || "",
        modelImg,
      };
    },
  });

  const { hasRole } = useSession();
  const canEdit = hasRole("admin") || hasRole("phong_kt");
  const [editMode, setEditMode] = useState(false);
  const canManage = canEdit && editMode;

  const capPhatMut = useCapPhatThietBi();
  const capPhatKyMut = useCapPhatVoiChuKy();
  const { data: latestHandover } = useLatestHandover(tb.id);
  const { data: vaiTroList = [] } = useVaiTroThietBi(tb.id);
  const donViOptions = useMemo(() => (taxo?.donViList ?? []).map((d) => ({ id: d.id, ten: `${d.ma}${d.ten ? " — " + d.ten : ""}` })), [taxo]);
  const donViTenMap = useMemo(() => new Map((taxo?.donViList ?? []).map((d) => [d.id, `${d.ma}${d.ten ? " — " + d.ten : ""}`])), [taxo]);

  const suCo = useMemo(() => ops.suCo.filter((e) => e.thiet_bi_id === tb.id || e.thiet_bi === ma), [ops.suCo, tb.id, ma]);
  const baoTri = useMemo(() => ops.baoTri.filter((e) => e.thiet_bi_id === tb.id || e.thiet_bi === ma), [ops.baoTri, tb.id, ma]);
  const hongHoc = useMemo(() => ops.hongHoc.filter((e) => e.thiet_bi_hong_id === tb.id || e.thiet_bi_hong === ma), [ops.hongHoc, tb.id, ma]);
  const banGiao = useMemo(() => ops.banGiao.filter((e) => e.thiet_bi === ma), [ops.banGiao, ma]);
  const { data: changeEvents = [] } = useChangeLogProxy(tb.id, canEdit);

  const timeline = useMemo<TimelineItem[]>(
    () => buildRecordTimeline({ baoTri, suCo, hongHoc, banGiao, changeEvents: (changeEvents || []).map((ev: any) => ({
      at: ev.at, action: ev.action, userName: ev.userName, changesCount: ev.changes.length,
      changesText: ev.changes.map((c: any) => `${c.label}: ${formatVal(c.from)} → ${formatVal(c.to)}`).join("; "),
    })) }),
    [baoTri, suCo, hongHoc, banGiao, changeEvents]
  );

  const pct = tb._tyLeTuoiTho == null ? null : Math.max(0, Math.min(100, Math.round(tb._tyLeTuoiTho)));
  const statusToken = getTrangThaiToken(tb.trang_thai);

  const tabProps = {
    tb, ma, tenTb, refInfo, loaiMau: loaiMau ?? null, sysName, sysGpSo, sysGpHan, vaiTroList,
    canEdit, canManage, timeline, suCo, baoTri, hongHoc, banGiao, changeEvents, pct
  } as any;

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 py-3 backdrop-blur-sm border-b md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/thiet-bi"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono truncate">{ma}</h1>
              {statusToken && (
                <Badge variant="outline" className={`${statusToken.class} px-1.5 py-0 h-5 text-[10px]`}>
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusToken.dot}`} />
                  {tb.trang_thai}
                </Badge>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-tight">
              {tenTb} {sysName ? `· ${sysName}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant={editMode ? "default" : "outline"} size="xs" onClick={() => setEditMode(!editMode)}>
                <PencilLine className="h-3.5 w-3.5" />
              </Button>
            )}


            {canManage && <ThietBiLifecycleActions ma={ma} trangThai={tb.trang_thai} />}
          </div>
        </div>
      </div>

      <CapPhatControl
        trangThai={tb._capPhatTrangThai} nguoiGiu={tb._nguoiGiu} donViGiuTen={tb._donViGiuTen}
        ngayCapPhat={tb._ngayCapPhat} daKy={tb._capPhatTrangThai === "da_cap_phat" && !!latestHandover?.da_chap_nhan}
        thoiDiemKy={latestHandover?.thoi_diem_chap_nhan ?? null} canManage={canManage}
        donViOptions={donViOptions} pending={capPhatKyMut.isPending || capPhatMut.isPending}
        onCapPhat={(p) => capPhatKyMut.mutate({ ...p, thietBiId: tb.id, maThietBi: ma, hanhDong: "cap_phat", nguoiGiao: null })}
        onThuHoi={(p) => capPhatMut.mutate({ ...p, thietBiId: tb.id, hanhDong: "thu_hoi" })}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Gauge} label="Tuổi thọ" value={pct == null ? "—" : `${pct}%`} tone={pct != null && pct >= 90 ? "text-red-600" : pct != null && pct >= 70 ? "text-amber-600" : "text-emerald-600"} />
        <KpiCard icon={Calendar} label="Khai thác" value={tb._namKhaiThac ? String(tb._namKhaiThac) : "—"} />
        <KpiCard icon={AlertTriangle} label="Sự cố" value={String(suCo.length)} tone={suCo.length > 0 ? "text-red-600" : "text-emerald-600"} />
        <KpiCard icon={Wrench} label="Bảo dưỡng" value={String(baoTri.length)} />
      </div>

      <Tabs defaultValue="tongquan" className="space-y-4">
        <TabsList className="flex w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 scrollbar-hide">
          <TabsTrigger value="tongquan" className="flex-shrink-0"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Tổng quan</TabsTrigger>
          <TabsTrigger value="vanhanh" className="flex-shrink-0"><Activity className="mr-1.5 h-3.5 w-3.5" /> Vận hành {suCo.length + baoTri.length > 0 && `(${suCo.length + baoTri.length})`}</TabsTrigger>
          <TabsTrigger value="hoso" className="flex-shrink-0"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Hồ sơ & Pháp lý</TabsTrigger>
          <TabsTrigger value="cauhinh" className="flex-shrink-0"><Cpu className="mr-1.5 h-3.5 w-3.5" /> Cấu hình</TabsTrigger>
          <TabsTrigger value="nangcao" className="flex-shrink-0"><Settings className="mr-1.5 h-3.5 w-3.5" /> Nâng cao</TabsTrigger>
        </TabsList>

        <Suspense fallback={<div className="py-20 text-center"><Skeleton className="h-40 w-full" /></div>}>
          <TabsContent value="tongquan"><TabTongQuan {...tabProps} /></TabsContent>
          <TabsContent value="vanhanh"><TabVanHanh {...tabProps} /></TabsContent>
          <TabsContent value="hoso"><TabHoSoPhapLy {...tabProps} /></TabsContent>
          <TabsContent value="cauhinh"><TabCauHinh {...tabProps} donViTenMap={donViTenMap} TelemetryPanel={TelemetryPanelProxy} AllocationPanel={AllocationPanelProxy} /></TabsContent>
          <TabsContent value="nangcao"><TabNangCao {...tabProps} LifecyclePanel={LifecyclePanelProxy} /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: any) {
  return (
    <Card className="border-none bg-muted/30 shadow-none">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm"><Icon className={`h-4 w-4 ${tone ?? "text-foreground/70"}`} /></div>
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
          <div className={`text-sm font-bold ${tone ?? ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Proxies for internal components to avoid re-defining them in this file
function useChangeLogProxy(id: string, canEdit: boolean) {
  const { getChangeLog } = require("@/lib/mirats/change-log.functions");
  return useQuery({
    queryKey: ["change_log", "thiet_bi", canEdit ? id : null],
    enabled: !!(canEdit && id),
    queryFn: () => getChangeLog({ data: { entity: "thiet_bi", entityId: id } }),
  });
}


function TelemetryPanelProxy({ thietBiId, canManage }: any) {
  const { useTelemetry, useAddTelemetry } = require("@/lib/mirats/db-smart");
  const { data: rows = [], isLoading } = useTelemetry(thietBiId);
  const addMut = useAddTelemetry(thietBiId);
  const [chiSo, setChiSo] = useState("gio_chay");
  const [giaTri, setGiaTri] = useState("");
  const [donVi, setDonVi] = useState("giờ");

  const submit = () => {
    const v = giaTri.trim() === "" ? null : Number(giaTri.replace(",", "."));
    if (!chiSo.trim()) return toast.error("Nhập tên chỉ số");
    if (v != null && Number.isNaN(v)) return toast.error("Giá trị phải là số");
    addMut.mutate(
      { chi_so: chiSo.trim(), gia_tri: v, don_vi_do: donVi.trim() || null },
      {
        onSuccess: () => {
          toast.success("Đã ghi số đo");
          setGiaTri("");
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
          <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase text-muted-foreground">
            Chỉ số
            <Input className="mt-1 h-8 text-xs" value={chiSo} onChange={(e: any) => setChiSo(e.target.value)} placeholder="gio_chay, nhiet_do…" />
          </label>
          <label className="w-28 text-[10px] font-bold uppercase text-muted-foreground">
            Giá trị
            <Input className="mt-1 h-8 text-xs" value={giaTri} onChange={(e: any) => setGiaTri(e.target.value)} inputMode="decimal" placeholder="0" />
          </label>
          <label className="w-24 text-[10px] font-bold uppercase text-muted-foreground">
            Đơn vị
            <Input className="mt-1 h-8 text-xs" value={donVi} onChange={(e: any) => setDonVi(e.target.value)} placeholder="giờ, °C…" />
          </label>

          <Button size="sm" onClick={submit} disabled={addMut.isPending}>
            {addMut.isPending ? <Activity className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1 h-3.5 w-3.5" />}
            Ghi số đo
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Activity className="h-4 w-4 animate-spin" /> Đang tải...
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">Chưa có số đo nào.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border p-2.5 text-xs bg-card">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{r.chi_so}</Badge>
                <span className="font-bold tabular-nums text-sm">
                  {r.gia_tri == null ? "—" : r.gia_tri.toLocaleString("vi-VN")}
                </span>
                <span className="text-muted-foreground">{r.don_vi_do ?? ""}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(r.thoi_diem).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllocationPanelProxy({ thietBiId, donViTenMap }: any) {
  const { useAllocationHistory } = require("@/lib/mirats/db-smart");
  const { data: rows = [], isLoading } = useAllocationHistory(thietBiId);

  if (isLoading) return <div className="py-8 text-center"><Activity className="h-5 w-5 animate-spin mx-auto" /></div>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">Chưa có lịch sử cấp phát.</p>;

  return (
    <ol className="relative ml-2 border-l border-border pl-6 space-y-6">
      {rows.map((r: any) => {
        const isCap = r.hanh_dong === "cap_phat";
        return (
          <li key={r.id} className="relative">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${isCap ? "bg-amber-500" : "bg-emerald-500"}`}>
              <Activity className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="rounded-md border p-3 text-xs bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-medium text-muted-foreground">
                  {new Date(r.thoi_diem).toLocaleString("vi-VN")}
                </span>
                <Badge variant="secondary" className={isCap ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}>
                  {isCap ? "Cấp phát" : "Thu hồi"}
                </Badge>
              </div>
              {(r.nguoi_giu || r.don_vi_giu_id) && (
                <div className="flex flex-col gap-1">
                  {r.nguoi_giu && <div className="font-bold">{r.nguoi_giu}</div>}
                  {r.don_vi_giu_id && <div className="text-muted-foreground">{donViTenMap.get(r.don_vi_giu_id) ?? "—"}</div>}
                </div>
              )}
              {r.ghi_chu && <div className="mt-2 pt-2 border-t italic text-muted-foreground">{r.ghi_chu}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LifecyclePanelProxy({ thietBiId }: any) {
  const { useLifecycle, useTrangThaiMap } = require("@/lib/mirats/db-smart");
  const { data: rows = [], isLoading } = useLifecycle(thietBiId);
  const { data: ttMap } = useTrangThaiMap();
  const nameOf = (id: string | null) => (id ? ttMap?.get(id) ?? "—" : "—");

  if (isLoading) return <div className="py-8 text-center"><Activity className="h-5 w-5 animate-spin mx-auto" /></div>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">Chưa có nhật ký vòng đời.</p>;

  return (
    <ol className="relative ml-2 border-l border-border pl-6 space-y-6">
      {rows.map((r: any) => (
        <li key={r.id} className="relative">
          <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-primary ring-4 ring-background">
            <History className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <div className="rounded-md border p-3 text-xs bg-card shadow-sm">
            <div className="text-muted-foreground mb-2">
              {new Date(r.thoi_diem).toLocaleString("vi-VN")}
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Badge variant="outline" className="text-[10px]">{nameOf(r.tu_trang_thai_id)}</Badge>
              <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-[10px]">{nameOf(r.den_trang_thai_id)}</Badge>
            </div>
            {r.ly_do && <div className="mt-2 text-muted-foreground italic">{r.ly_do}</div>}
          </div>
        </li>
      ))}
    </ol>
  );

