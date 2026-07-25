import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft, Network, HardDrive, Wrench, AlertTriangle, RefreshCw, ArrowLeftRight,
  Clock, Loader2, ShieldCheck, Building2, ChevronRight, FileText, Cpu, Link2, Puzzle,
  MapPin, Tag, Info, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";
import { ThanhPhanManager } from "@/components/mirats/ThanhPhanManager";
import { HeThongLienKetTab } from "@/components/mirats/HeThongLienKetTab";
import { useSession } from "@/hooks/use-session";
import { useViTriChucNang, useThietBiDangLap } from "@/lib/mirats/he-thong-thanh-phan";
import { LyLichThanhPhanPanel } from "@/components/mirats/LyLichLayerPanel";

export const Route = createFileRoute("/_app/he-thong/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Sổ lý lịch hệ thống — MIRATS 2.0` },
      { name: "description", content: `Sổ lý lịch hệ thống ${params.id}: tổng hợp bảo dưỡng, sự cố, hỏng hóc & thay thế của toàn bộ tài sản con.` },
    ],
  }),
  component: HeThongDetail,
});

function HeThongDetail() {
  const { id } = Route.useParams();
  const { inScope, scopeAll } = useScope();
  const { data: taxo, isLoading, error } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();

  const sys = useMemo(() => taxo?.htList.find((h) => h.id === id), [taxo, id]);
  const devices = useMemo<DbDevice[]>(
    () => (taxo?.devices ?? []).filter((d) => d._htId === id),
    [taxo, id],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ lý lịch hệ thống…
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-sm text-destructive">Không tải được dữ liệu: {error instanceof Error ? error.message : "Lỗi"}</div>;
  }
  if (!sys && devices.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <h2 className="text-lg font-semibold">Không tìm thấy hệ thống</h2>
        <Button asChild variant="outline" className="mt-4"><Link to="/thiet-bi">Về sổ lý lịch</Link></Button>
      </div>
    );
  }

  const donVi = devices[0]?.don_vi ?? "";
  if (!scopeAll && donVi && !inScope(donVi)) return <AccessDenied backTo="/thiet-bi" backLabel="Về sổ lý lịch tài sản" />;

  return <HeThongInner id={id} tenHt={nameOv?.get(id) ?? sys?.ten ?? devices[0]?._htTen ?? id} maBravo={sys?.maBravo ?? ""} gpSo={sys?.gpSo ?? ""} gpHan={sys?.gpHan ?? ""} devices={devices} />;
}

function HeThongInner({
  id, tenHt, maBravo, gpSo, gpHan, devices,
}: { id: string; tenHt: string; maBravo: string; gpSo: string; gpHan: string; devices: DbDevice[] }) {
  const { ops } = useOperationsData();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data: devNameOv } = useDeviceNameOverrides();
  const maSet = useMemo(() => new Set(devices.map((d) => d.ma_thiet_bi)), [devices]);
  const idSet = useMemo(() => new Set(devices.map((d) => d.id)), [devices]);
  const tenMap = useMemo(
    () => new Map(devices.map((d) => [d.ma_thiet_bi, devNameOv?.get(d.ma_thiet_bi) || d.ten])),
    [devices, devNameOv],
  );

  // Khớp lý lịch hệ thống: bản ghi gắn trực tiếp hệ thống (he_thong_id === id),
  // hoặc gắn với tài sản con (ưu tiên UUID, fallback mã text cho dữ liệu cũ).
  const inSys = useCallback((e: { he_thong_id?: string | null }) => e.he_thong_id === id, [id]);
  const byDev = useCallback(
    (e: { thiet_bi_id?: string | null; thiet_bi: string }) =>
      e.thiet_bi_id ? idSet.has(e.thiet_bi_id) : maSet.has(e.thiet_bi),
    [idSet, maSet],
  );
  const baoTri = useMemo(() => ops.baoTri.filter((e) => inSys(e) || byDev(e)), [ops.baoTri, inSys, byDev]);
  const suCo = useMemo(() => ops.suCo.filter((e) => inSys(e) || byDev(e)), [ops.suCo, inSys, byDev]);
  const hongHoc = useMemo(() => ops.hongHoc.filter((e) => (e.thiet_bi_hong_id ? idSet.has(e.thiet_bi_hong_id) : maSet.has(e.thiet_bi_hong))), [ops.hongHoc, idSet, maSet]);
  const banGiao = useMemo(() => ops.banGiao.filter((e) => maSet.has(e.thiet_bi)), [ops.banGiao, maSet]);

  
  const donVi = devices[0]?.don_vi ?? "";
  const donViTen = devices[0]?._donViTen ?? "";

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const e of baoTri) items.push({ kind: "bt", date: e.ngay_bat_dau || "", title: e.mo_ta_cong_viec || e.loai_bao_tri || "Bảo dưỡng", label: e.loai_bao_tri || "Bảo dưỡng", desc: e.ket_qua ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    for (const e of suCo) items.push({ kind: "sc", date: e.ngay_phat_hien || "", title: e.hien_tuong || "Sự cố", label: e.muc_do || "Sự cố", desc: e.bien_phap_xu_ly ?? e.nguyen_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    for (const e of hongHoc) items.push({ kind: "hh", date: e.ngay_hong || "", title: e.mo_ta_hong_hoc || e.bo_phan_hong || "Hỏng hóc / thay thế", label: e.bo_phan_hong || "Hỏng hóc", desc: e.phuong_an ?? "", tag: e.trang_thai, tb: e.thiet_bi_hong });
    for (const e of banGiao) items.push({ kind: "bg", date: e.ngay_nhan || "", title: `${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`, label: e.loai_ban_giao || "Bàn giao", desc: e.don_vi_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    const toKey = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? -Infinity : t; };
    return items.sort((a, b) => toKey(b.date) - toKey(a.date));
  }, [baoTri, suCo, hongHoc, banGiao]);

  const hasGp = Boolean(gpSo);

  const parseD = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? null : t; };
  const firstEventTs = timeline.reduce<number | null>((a, it) => { const t = parseD(it.date); if (t == null) return a; return a == null ? t : Math.min(a, t); }, null);
  const lastEventTs = timeline.reduce<number | null>((a, it) => { const t = parseD(it.date); if (t == null) return a; return a == null ? t : Math.max(a, t); }, null);
  const suCoDates = suCo.map((e) => parseD(e.ngay_phat_hien || "")).filter((t): t is number => t != null).sort((a, b) => a - b);
  const lastSuCoTs = suCoDates.length ? suCoDates[suCoDates.length - 1] : null;
  const daysSinceIncident = lastSuCoTs != null ? Math.max(0, Math.round((Date.now() - lastSuCoTs) / 86_400_000)) : null;
  const mtbfDays = suCoDates.length >= 2 ? Math.round((suCoDates[suCoDates.length - 1] - suCoDates[0]) / 86_400_000 / (suCoDates.length - 1)) : null;
  const replacedDevices = new Set(hongHoc.map((e) => e.thiet_bi_hong).filter(Boolean));
  const fmtVN = (t: number | null) => (t == null ? "—" : new Date(t).toLocaleDateString("vi-VN"));
  const bookNo = id.slice(0, 8).toUpperCase();
  const openYear = firstEventTs ? new Date(firstEventTs).getFullYear() : new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/thiet-bi"><ArrowLeft className="mr-1 h-4 w-4" /> Sổ lý lịch</Link></Button>
        <div className="ml-auto text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Quyển № <span className="font-mono text-foreground/80">{bookNo}</span> · Mở sổ {openYear}
        </div>
      </div>

      {/* ── BÌA SỔ ── */}
      <div className="relative overflow-hidden rounded-lg border border-amber-900/20 bg-[linear-gradient(180deg,#f9f3e3_0%,#f4ead0_100%)] shadow-[0_10px_30px_-15px_rgba(120,80,20,0.35)] dark:border-amber-100/10 dark:bg-[linear-gradient(180deg,#2a2317_0%,#1f1a12_100%)]">
        <div className="absolute inset-y-0 left-0 w-2 bg-[repeating-linear-gradient(180deg,#a67c2a_0_10px,#8a651e_10px_20px)]" />
        <div className="absolute inset-y-0 left-2 w-px bg-amber-900/30" />
        <div className="relative px-8 py-6 pl-10">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-900/70 dark:text-amber-100/70">
            <span className="rounded border border-amber-900/30 px-2 py-0.5">Hồ sơ khai thác</span>
            <span>· MIRATS 2.0</span>
            {donVi && <span>· {donVi}{donViTen ? ` — ${donViTen}` : ""}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-900/40 bg-amber-100/60 text-amber-900 shadow-inner dark:bg-amber-950/40 dark:text-amber-100">
              <Network className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-3xl leading-tight text-amber-950 dark:text-amber-50">{tenHt}</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-900/80 dark:text-amber-100/70">
            {maBravo && <span>Mã Bravo: <span className="font-mono">{maBravo}</span></span>}
            <span>Trang mục lục: <span className="font-mono">{timeline.length}</span> mục</span>
            {hasGp ? (
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> GPKT {gpSo}{gpHan ? ` · Hạn ${gpHan}` : ""}</span>
            ) : (
              <span className="text-red-700/80 dark:text-red-300/80">Chưa có GPKT</span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            <BookStamp icon={HardDrive} label="Tài sản con" value={String(devices.length)} />
            <BookStamp icon={Wrench} label="Bảo dưỡng" value={String(baoTri.length)} tone="emerald" />
            <BookStamp icon={AlertTriangle} label="Sự cố" value={String(suCo.length)} tone={suCo.length > 0 ? "red" : "emerald"} />
            <BookStamp icon={RefreshCw} label="Thay thế" value={String(hongHoc.length)} tone={hongHoc.length > 0 ? "amber" : undefined} />
            <BookStamp icon={ArrowLeftRight} label="Bàn giao" value={String(banGiao.length)} tone="sky" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-md border border-amber-900/15 bg-amber-50/60 p-3 text-xs md:grid-cols-4 dark:border-amber-100/10 dark:bg-amber-950/30">
            <StatLine label="Ngày mở sổ" value={fmtVN(firstEventTs)} />
            <StatLine label="Cập nhật gần nhất" value={fmtVN(lastEventTs)} />
            <StatLine label="Ngày không sự cố" value={daysSinceIncident == null ? "—" : `${daysSinceIncident} ngày`} tone={daysSinceIncident != null && daysSinceIncident < 7 ? "text-red-700" : "text-emerald-700"} />
            <StatLine label="Nhịp sự cố TB (MTBF)" value={mtbfDays == null ? "—" : `${mtbfDays} ngày`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin hệ thống</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Network} label="Hệ thống" value={tenHt} />
              <InfoRow icon={FileText} label="Mã tài sản Bravo" value={maBravo || "—"} />
              
              <InfoRow icon={Building2} label="Đơn vị quản lý" value={`${donVi || "—"}${donViTen ? " — " + donViTen : ""}`} />
              <InfoRow icon={ShieldCheck} label="Giấy phép khai thác" value={hasGp ? `${gpSo}${gpHan ? " · Hạn " + gpHan : ""}` : "Chưa có"} />
            </CardContent>
          </Card>

          <ThanhPhanCard heThongId={id} />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Sổ lý lịch hệ thống</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="tl">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="tl"><Clock className="mr-1 h-3.5 w-3.5" />Dòng thời gian ({timeline.length})</TabsTrigger>
                <TabsTrigger value="vt"><Cpu className="mr-1 h-3.5 w-3.5" />Thành phần hệ thống</TabsTrigger>
                <TabsTrigger value="bt">Bảo dưỡng ({baoTri.length})</TabsTrigger>
                <TabsTrigger value="sc">Sự cố ({suCo.length})</TabsTrigger>
                <TabsTrigger value="hh">Thay thế ({hongHoc.length})</TabsTrigger>
                <TabsTrigger value="bg">Bàn giao ({banGiao.length})</TabsTrigger>
                <TabsTrigger value="lk"><Link2 className="mr-1 h-3.5 w-3.5" />Liên kết</TabsTrigger>
                {canManage && <TabsTrigger value="cd">Chỉnh sửa dữ liệu</TabsTrigger>}
              </TabsList>

              <TabsContent value="tl" className="mt-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có sự kiện lịch sử nào cho hệ thống này.</p>
                ) : (
                  <Timeline items={timeline} tenMap={tenMap} />
                )}
              </TabsContent>

              <TabsContent value="vt" className="mt-4">
                <ThanhPhanManager heThongId={id} canManage={canManage} />
              </TabsContent>


              <TabsContent value="bt" className="mt-4 space-y-2">
                {baoTri.length === 0 && <p className="text-sm text-muted-foreground">Chưa có phiếu bảo dưỡng.</p>}
                {baoTri.map((e) => (
                  <EventRow key={e.ma_bao_tri} tb={e.thiet_bi} tenMap={tenMap} title={e.mo_ta_cong_viec || e.loai_bao_tri} date={e.ngay_bat_dau} label={e.loai_bao_tri} desc={e.ket_qua ?? ""} tag={e.trang_thai} />
                ))}
              </TabsContent>

              <TabsContent value="sc" className="mt-4 space-y-2">
                {suCo.length === 0 && <p className="text-sm text-muted-foreground">Không có sự cố ghi nhận.</p>}
                {suCo.map((e) => (
                  <EventRow key={e.ma_su_co} tb={e.thiet_bi} tenMap={tenMap} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-red-50 text-red-700" />
                ))}
              </TabsContent>

              <TabsContent value="hh" className="mt-4 space-y-2">
                {hongHoc.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc / thay thế.</p>}
                {hongHoc.map((e) => (
                  <EventRow key={e.ma_hong_hoc} tb={e.thiet_bi_hong} tenMap={tenMap} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-orange-50 text-orange-700" />
                ))}
              </TabsContent>

              <TabsContent value="bg" className="mt-4 space-y-2">
                {banGiao.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
                {banGiao.map((e) => (
                  <EventRow key={e.ma_ban_giao} tb={e.thiet_bi} tenMap={tenMap} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-sky-50 text-sky-700" />
                ))}
              </TabsContent>

              <TabsContent value="lk" className="mt-4">
                <HeThongLienKetTab heThongId={id} />
              </TabsContent>



              {canManage && (
                <TabsContent value="cd" className="mt-4">
                  <ChangeLogPanel entity="dm_he_thong" entityId={id} />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ThanhPhanCard({ heThongId }: { heThongId: string }) {
  const { data: tps } = useViTriChucNang(heThongId);
  const { data: dangLap } = useThietBiDangLap(heThongId);
  const list = tps ?? [];
  const [openTpId, setOpenTpId] = useState<string | null>(null);
  const openTp = openTpId ? list.find((t) => t.id === openTpId) ?? null : null;
  const openDev = openTpId ? dangLap?.get(openTpId) ?? null : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Thành phần thuộc hệ thống ({list.length})</span>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link to="/he-thong/cay">Quản lý</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thành phần.</p>}
        {list.map((tp) => {
          const dev = dangLap?.get(tp.id);
          return (
            <HoverCard key={tp.id} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  onClick={() => setOpenTpId(tp.id)}
                  className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-primary/5"
                >
              <Puzzle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">{tp.ten}</span>
                  {dev ? (
                    <Badge variant="secondary" className="font-mono text-[10px]">{dev.ma_thiet_bi}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">trống</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-80 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">{tp.ten}</div>
                  <div className="grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                    <span className="text-muted-foreground">Loại yêu cầu</span>
                    <span>{tp.loai_thiet_bi_yeu_cau || "—"}</span>
                    <span className="text-muted-foreground">Bắt buộc</span>
                    <span>{tp.bat_buoc ? "Có" : "Không"}</span>
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span>{tp.trang_thai === "ngung" ? "Ngừng" : "Đang khai thác"}</span>
                    <span className="text-muted-foreground">Tài sản lắp</span>
                    <span>
                      {dev ? (
                        <>
                          <span className="font-mono">{dev.ma_thiet_bi}</span>
                          {dev.ten_thiet_bi ? ` — ${dev.ten_thiet_bi}` : ""}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Chưa lắp</span>
                      )}
                    </span>
                    {dev?.ma_serial && (
                      <>
                        <span className="text-muted-foreground">Serial</span>
                        <span className="font-mono">{dev.ma_serial}</span>
                      </>
                    )}
                    {(tp.hieu_luc_tu || tp.hieu_luc_den) && (
                      <>
                        <span className="text-muted-foreground">Hiệu lực</span>
                        <span>{tp.hieu_luc_tu || "—"} → {tp.hieu_luc_den || "hiện tại"}</span>
                      </>
                    )}
                  </div>
                  {tp.mo_ta && (
                    <p className="border-t pt-2 text-xs text-muted-foreground whitespace-pre-wrap">{tp.mo_ta}</p>
                  )}
                  <p className="border-t pt-2 text-[11px] text-muted-foreground">Bấm để xem sổ lý lịch thành phần.</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </CardContent>

      <Sheet open={!!openTpId} onOpenChange={(v) => { if (!v) setOpenTpId(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {openTp && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Puzzle className="h-4 w-4 text-emerald-600" />
                  <span className="truncate">{openTp.ten}</span>
                </SheetTitle>
                <SheetDescription>Chi tiết thành phần hệ thống & sổ lý lịch.</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-2 rounded-md border p-3 text-sm">
                  <InfoLine icon={Tag} label="Loại yêu cầu" value={openTp.loai_thiet_bi_yeu_cau || "—"} />
                  <InfoLine icon={Info} label="Bắt buộc" value={openTp.bat_buoc ? "Có" : "Không"} />
                  <InfoLine icon={Info} label="Trạng thái" value={
                    <Badge variant={openTp.trang_thai === "ngung" ? "secondary" : "default"}>
                      {openTp.trang_thai === "ngung" ? "Ngừng" : "Đang khai thác"}
                    </Badge>
                  } />
                  {openTp.mo_ta && <InfoLine icon={FileText} label="Mô tả" value={<span className="whitespace-pre-wrap">{openTp.mo_ta}</span>} />}
                  {(openTp.hieu_luc_tu || openTp.hieu_luc_den) && (
                    <InfoLine icon={Clock} label="Hiệu lực" value={`${openTp.hieu_luc_tu || "—"} → ${openTp.hieu_luc_den || "hiện tại"}`} />
                  )}
                </div>

                <div className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <HardDrive className="h-4 w-4" /> Tài sản đang lắp
                  </div>
                  {openDev ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">{openDev.ma_thiet_bi}</Badge>
                        <span className="font-medium">{openDev.ten_thiet_bi || "—"}</span>
                      </div>
                      {openDev.ma_serial && (
                        <div className="text-xs text-muted-foreground">Serial: <span className="font-mono">{openDev.ma_serial}</span></div>
                      )}
                      <div className="text-xs text-muted-foreground">Lắp từ: {openDev.tu_ngay || "—"}</div>
                      <div className="pt-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: openDev.ma_thiet_bi }}>
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Mở sổ lý lịch tài sản
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có tài sản lắp vào vị trí này (đang chờ thay thế).</p>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4" /> Sổ lý lịch thành phần
                  </div>
                  <LyLichThanhPhanPanel thanhPhanId={openTp.id} empty="Chưa có sự kiện nào cho thành phần này." />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words">{value}</div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className={`font-semibold ${tone ?? ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceChip({ tb, tenMap }: { tb: string; tenMap: Map<string, string> }) {
  if (!tb) return null;
  return (
    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb }} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-primary hover:underline">
      <HardDrive className="h-3 w-3" />
      <span className="font-mono">{tb}</span>
      {tenMap.get(tb) && <span className="text-muted-foreground">· {tenMap.get(tb)}</span>}
    </Link>
  );
}

function EventRow({ title, date, label, desc, tag, tone, tb, tenMap }: { title: string; date: string; label: string; desc: string; tag?: string; tone?: string; tb: string; tenMap: Map<string, string> }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={tone}>{label}</Badge>
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        <DeviceChip tb={tb} tenMap={tenMap} />
        {tag && <Badge variant="secondary" className="ml-auto">{tag}</Badge>}
      </div>
      <div className="mt-1 font-medium">{title || "—"}</div>
      {desc && <div className="text-muted-foreground">{desc}</div>}
    </div>
  );
}

type TimelineKind = "bt" | "sc" | "hh" | "bg";
type TimelineItem = { kind: TimelineKind; date: string; title: string; label: string; desc: string; tag?: string; tb: string };

const timelineMeta: Record<TimelineKind, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string; chip: string }> = {
  bt: { icon: Wrench, name: "Bảo dưỡng", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  sc: { icon: AlertTriangle, name: "Sự cố", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  hh: { icon: RefreshCw, name: "Hỏng hóc / thay thế", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700" },
  bg: { icon: ArrowLeftRight, name: "Bàn giao", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
};

function Timeline({ items, tenMap }: { items: TimelineItem[]; tenMap: Map<string, string> }) {
  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {items.map((it, i) => {
        const m = timelineMeta[it.kind];
        const Icon = m.icon;
        return (
          <li key={`${it.kind}-${i}`} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${m.dot}`}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {it.date ? new Date(it.date).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}
                </span>
                <Badge variant="outline" className={m.chip}>{m.name}</Badge>
                {it.label && it.label !== m.name && <Badge variant="outline">{it.label}</Badge>}
                <DeviceChip tb={it.tb} tenMap={tenMap} />
                {it.tag && <Badge variant="secondary" className="ml-auto">{it.tag}</Badge>}
              </div>
              <div className="mt-1 font-medium">{it.title || "—"}</div>
              {it.desc && <div className="mt-0.5 text-muted-foreground">{it.desc}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
