// ============================================================================
// Sổ lý lịch THÀNH PHẦN — nhánh con của Sổ lý lịch Hệ thống.
// 4 khối: (A) Header định danh, (B) Tài sản đang gắn + timeline gắn-tháo,
// (C) KPI (MTBF/MTTR/tỉ lệ Đạt + biểu đồ), (D) Nhật ký sự kiện.
// Tác nghiệp nhanh dùng Sheet native (không iframe) — auto điền hệ thống cha.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, HardDrive, Clock, ExternalLink, Puzzle, Activity, Wrench,
  AlertTriangle, Gauge, TrendingUp, Plus, PackagePlus, PackageMinus,
  ArrowLeftRight, CheckCircle2, Loader2, RefreshCw, Cpu,
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/backend/client";
import {
  useThanhPhanKpi, useThanhPhanTaiSanHistory,
  useThietBiDangLap,
} from "@/lib/mirats/he-thong-thanh-phan";
import { LyLichThanhPhanPanel } from "@/components/mirats/LyLichLayerPanel";
import { SuCoMoiForm } from "@/components/mirats/quick/SuCoMoiForm";
import { BaoTriMoiForm } from "@/components/mirats/quick/BaoTriMoiForm";
import { HongHocMoiForm } from "@/components/mirats/quick/HongHocMoiForm";
import { PageHeader } from "@/components/mirats/PageHeader";

export const Route = createFileRoute("/_app/he-thong/$id/thanh-phan/$tpId")({
  head: ({ params }) => ({
    meta: [
      { title: `Sổ lý lịch thành phần — MIRATS 2.0` },
      {
        name: "description",
        content: `Sổ lý lịch chi tiết thành phần ${params.tpId} thuộc hệ thống ${params.id}: tài sản đang gắn, chỉ số MTBF/MTTR, nhật ký sự kiện.`,
      },
    ],
  }),
  component: ThanhPhanSoLyLich,
});

type QuickKind = null | "su_co" | "bao_tri" | "hong_hoc";

function ThanhPhanSoLyLich() {
  const { id: heThongId, tpId } = Route.useParams();
  const [quick, setQuick] = useState<QuickKind>(null);

  // Thông tin định danh thành phần + hệ thống cha.
  const { data: tp, isLoading: loadingTp } = useQuery({
    queryKey: ["thanh-phan-info", tpId],
    enabled: Boolean(tpId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select(
          "id, ma_thanh_phan, ten, mo_ta, bat_buoc, trang_thai, thu_tu, hieu_luc_tu, hieu_luc_den, he_thong_id, dm_he_thong:he_thong_id(ten, ten_viet_tat, dm_don_vi:don_vi_id(ma, ten)), dm_loai_thiet_bi:loai_thiet_bi_yeu_cau(ten), dm_vi_tri:vi_tri_id(ten)"
        )
        .eq("id", tpId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: kpi, isLoading: loadingKpi } = useThanhPhanKpi(tpId);
  const { data: history = [], isLoading: loadingHist } = useThanhPhanTaiSanHistory(tpId);
  const { data: dangLapMap } = useThietBiDangLap(heThongId);
  const dangLap = dangLapMap?.get(tpId) ?? null;

  const chartData = useMemo(
    () => (kpi?.su_co_by_month ?? []).map((r) => ({ thang: r.thang.slice(5), value: r.so_su_co })),
    [kpi],
  );

  if (loadingTp) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ lý lịch thành phần…
      </div>
    );
  }

  if (!tp) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-lg font-semibold">Không tìm thấy thành phần</p>
        <p className="mt-1 text-sm text-muted-foreground">Thành phần có thể đã bị xoá hoặc bạn không có quyền xem.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/he-thong/$id" params={{ id: heThongId }}>Quay lại sổ hệ thống</Link>
        </Button>
      </div>
    );
  }

  const donVi = tp.dm_he_thong?.dm_don_vi;
  const htTen = tp.dm_he_thong?.ten ?? "";

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-4 p-4">
      {/* Consolidated Header row */}
      <PageHeader
        icon={Puzzle}
        title={tp.ten}
        subtitle={donVi ? `${donVi.ma} — ${donVi.ten}` : undefined}
        description={tp.mo_ta}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setQuick("su_co")}>
              <AlertTriangle className="h-3.5 w-3.5" /> + Sự cố
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setQuick("bao_tri")}>
              <Wrench className="h-3.5 w-3.5" /> + Bảo dưỡng
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setQuick("hong_hoc")}>
              <RefreshCw className="h-3.5 w-3.5" /> + Hỏng hóc
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant={tp.trang_thai === "ngung" ? "secondary" : "default"}>
          {tp.trang_thai === "ngung" ? "Ngừng" : "Đang khai thác"}
        </Badge>
        {tp.bat_buoc && <Badge variant="outline">Bắt buộc</Badge>}
        {tp.dm_loai_thiet_bi?.ten && <Badge variant="secondary" className="font-normal">Loại: {tp.dm_loai_thiet_bi.ten}</Badge>}
        {tp.dm_vi_tri?.ten && <Badge variant="secondary" className="font-normal">Vị trí: {tp.dm_vi_tri.ten}</Badge>}
      </div>


      {/* Khối C — KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCell icon={AlertTriangle} label="Sự cố (12 tháng)" value={loadingKpi ? "…" : String(kpi?.so_su_co_12m ?? 0)}
          hint={kpi?.so_su_co_mo ? `${kpi.so_su_co_mo} đang mở` : "Không có sự cố mở"} tone={kpi?.so_su_co_mo ? "warn" : "ok"} />
        <KpiCell icon={Wrench} label="Bảo dưỡng (12 tháng)" value={loadingKpi ? "…" : String(kpi?.so_bao_tri_12m ?? 0)}
          hint={kpi?.ti_le_dat != null ? `${Math.round(kpi.ti_le_dat)}% Đạt` : "Chưa có kết quả"} />
        <KpiCell icon={Gauge} label="MTBF (ngày)" value={fmtNum(kpi?.mtbf_days)} hint="Trung bình giữa các sự cố" />
        <KpiCell icon={TrendingUp} label="MTTR (giờ)" value={fmtNum(kpi?.mttr_hours)} hint="Trung bình khắc phục" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="hidden"><CardTitle className="text-sm">Sự cố theo tháng (12 tháng gần nhất)</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="thang" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Khối B + D — Tài sản & Nhật ký */}
      <Tabs defaultValue="tai-san" className="space-y-3">
        <TabsList>
          <TabsTrigger value="tai-san" className="gap-1.5"><HardDrive className="h-3.5 w-3.5" /> Tài sản gắn</TabsTrigger>
          <TabsTrigger value="nhat-ky" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Nhật ký sự kiện</TabsTrigger>
        </TabsList>

        <TabsContent value="tai-san" className="space-y-3">
          <Card>
            <CardHeader className="hidden">
              <CardTitle>Tài sản đang gắn</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {dangLap ? (
                <div className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{dangLap.ma_thiet_bi}</Badge>
                    <span className="font-medium">{dangLap.ten_thiet_bi || "—"}</span>
                    <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Đang lắp</Badge>
                  </div>
                  {dangLap.ma_serial && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Serial: <span className="font-mono">{dangLap.ma_serial}</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lắp từ: {dangLap.tu_ngay ? new Date(dangLap.tu_ngay).toLocaleDateString("vi-VN") : "—"}
                    {dangLap.ly_do && <> · Lý do: {dangLap.ly_do}</>}
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: dangLap.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Mở sổ lý lịch tài sản
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Để <strong>tháo / thay thế / điều chuyển</strong> tài sản: vào cây hệ thống → chọn thành phần → mở sidebar chi tiết.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có tài sản lắp vào thành phần này.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="hidden">
              <CardTitle>Lịch sử gắn — tháo tài sản</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingHist ? (
                <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có lần gắn nào.</p>
              ) : (
                <ol className="relative ml-2 border-l border-border pl-6">
                  {history.map((h) => {
                    const Icon = h.dang_lap ? PackagePlus : PackageMinus;
                    const dot = h.dang_lap ? "bg-emerald-500" : "bg-slate-400";
                    return (
                      <li key={h.gan_id} className="relative mb-4 last:mb-0">
                        <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${dot}`}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </span>
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="gap-1 font-mono text-meta">
                              <Cpu className="h-3 w-3" />{h.ma_thiet_bi}
                            </Badge>
                            {h.ma_serial && <span className="font-mono text-xs text-muted-foreground">SN {h.ma_serial}</span>}
                            {h.dang_lap ? (
                              <Badge variant="outline">Đang lắp</Badge>
                            ) : (
                              <Badge variant="outline">Đã tháo</Badge>
                            )}
                            <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: h.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="ml-auto text-xs text-primary hover:underline">
                              Mở →
                            </Link>
                          </div>
                          <div className="mt-1 font-medium">{h.ten_thiet_bi || "—"}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {h.tu_ngay ? new Date(h.tu_ngay).toLocaleDateString("vi-VN") : "—"}
                            {" → "}
                            {h.den_ngay ? new Date(h.den_ngay).toLocaleDateString("vi-VN") : "hiện tại"}
                            {h.ly_do && <> · {h.ly_do}</>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nhat-ky">
          <Card>
            <CardHeader className="hidden">
              <CardTitle>Nhật ký khai thác thành phần</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <LyLichThanhPhanPanel thanhPhanId={tpId} empty="Chưa có sự kiện cho thành phần này." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tác nghiệp nhanh — Sheet native (không iframe) */}
      <Sheet open={quick !== null} onOpenChange={(o) => !o && setQuick(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {quick === "su_co" && "Tạo sự cố mới"}
              {quick === "bao_tri" && "Tạo phiếu bảo dưỡng"}
              {quick === "hong_hoc" && "Ghi nhận hỏng hóc"}
            </SheetTitle>
            <SheetDescription>Tác nghiệp cho thành phần: <strong>{tp.ten}</strong></SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {quick === "su_co" && <SuCoMoiForm defaultHeThongId={heThongId} embedded onDone={() => setQuick(null)} />}
            {quick === "bao_tri" && <BaoTriMoiForm defaultHeThongId={heThongId} embedded onDone={() => setQuick(null)} />}
            {quick === "hong_hoc" && <HongHocMoiForm defaultHeThongId={heThongId} embedded onDone={() => setQuick(null)} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KpiCell({ icon: Icon, label, value, hint, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  const toneCls = tone === "warn" ? "text-orange-600" : tone === "ok" ? "text-emerald-600" : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {hint && <div className={`mt-0.5 text-xs ${toneCls}`}>{hint}</div>}
      </CardContent>
    </Card>
  );
}

function fmtNum(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(1);
}