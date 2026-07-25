import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft, Network, HardDrive, Wrench, AlertTriangle, RefreshCw, ArrowLeftRight,
  Clock, Loader2, ShieldCheck, Building2, ChevronRight, FileText, Cpu, Link2,
  MapPin, Tag, Info, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/thiet-bi"><ArrowLeft className="mr-1 h-4 w-4" /> Sổ lý lịch</Link></Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold">{tenHt}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Sổ lý lịch hệ thống{donVi ? ` · ${donVi}${donViTen ? " — " + donViTen : ""}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard icon={HardDrive} label="Tài sản con" value={String(devices.length)} />
        <KpiCard icon={Wrench} label="Bảo dưỡng" value={String(baoTri.length)} />
        <KpiCard icon={AlertTriangle} label="Sự cố" value={String(suCo.length)} tone={suCo.length > 0 ? "text-red-600" : "text-emerald-600"} />
        <KpiCard icon={RefreshCw} label="Hỏng hóc / thay thế" value={String(hongHoc.length)} tone={hongHoc.length > 0 ? "text-orange-600" : undefined} />
        <KpiCard icon={ArrowLeftRight} label="Bàn giao" value={String(banGiao.length)} />
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
            <button
              key={tp.id}
              type="button"
              onClick={() => setOpenTpId(tp.id)}
              className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-primary/5"
            >
              <Cpu className="h-4 w-4 shrink-0 text-foreground/60" />
              <span className="font-mono text-xs text-primary">{tp.ma_thanh_phan}</span>
              <span className="min-w-0 flex-1 truncate">{tp.ten}</span>
              {dev ? (
                <Badge variant="secondary" className="font-mono text-[10px]">{dev.ma_thiet_bi}</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">trống</Badge>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </CardContent>

      <Sheet open={!!openTpId} onOpenChange={(v) => { if (!v) setOpenTpId(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {openTp && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Cpu className="h-4 w-4" />
                  <span className="font-mono text-primary">{openTp.ma_thanh_phan}</span>
                  <span className="truncate">— {openTp.ten}</span>
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
