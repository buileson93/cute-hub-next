import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  HardDrive, ArrowLeft, ShieldCheck, Wrench, AlertTriangle, FileText, ExternalLink,
  Building2, MapPin, Network, Factory, Calendar, Package, Users, Gauge,
  Truck, Layers, Paperclip, Loader2, Clock, RefreshCw, ArrowLeftRight, Tag,
  Activity, History, Plus, PackageCheck, UserCheck, Building2 as BuildingIcon, PencilLine, Table2, Cpu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThietBiTepDinhKem } from "@/components/mirats/ThietBiTepDinhKem";
import { LyLichThietBiPanel } from "@/components/mirats/LyLichThietBiPanel";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice, giayPhepLabelByTen } from "@/lib/mirats/db-taxonomy";
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
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";
import { useChangeLog, formatVal } from "@/lib/mirats/change-log";
import { buildRecordTimeline, type TimelineItem, type TimelineKind } from "@/lib/mirats/record-timeline";
import { ThietBiAllFields } from "@/components/mirats/ThietBiAllFields";
import { useVaiTroThietBi } from "@/lib/mirats/he-thong-thanh-phan";
import { KheLinhKienPanel } from "@/components/mirats/KheLinhKienPanel";
import { ChungChiPanel } from "@/components/mirats/ChungChiPanel";
import { MauChip } from "@/components/mirats/MauChip";
import { sortDacTinh, type DacTinh } from "@/lib/mirats/dac-tinh";



export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.maThietBi} — Sổ lý lịch tài sản — MIRATS 2.0` },
      { name: "description", content: `Sổ lý lịch tài sản ${params.maThietBi}: thông tin, vòng đời, giấy phép, bảo dưỡng, sự cố, thay thế, bàn giao.` },
    ],
  }),
  component: ThietBiDetail,
});

const ttColor: Record<string, string> = {
  "Đang khai thác": "bg-emerald-100 text-emerald-700",
  "Đang sử dụng": "bg-emerald-100 text-emerald-700",
  "Dự phòng": "bg-sky-100 text-sky-700",
  "Đang sửa chữa": "bg-amber-100 text-amber-700",
  "Hỏng": "bg-red-100 text-red-700",
  "Chờ thanh lý": "bg-orange-100 text-orange-700",
  "Đã thanh lý": "bg-slate-200 text-slate-700",
  "Ngừng hoạt động": "bg-slate-200 text-slate-700",
};

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






  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ lý lịch tài sản…
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-sm text-destructive">Không tải được dữ liệu: {error instanceof Error ? error.message : "Lỗi"}</div>;
  }
  if (!tb) {
    return (
      <div className="rounded-md border p-8 text-center">
        <h2 className="text-lg font-semibold">Không tìm thấy tài sản</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mã <span className="font-mono">{maThietBi}</span> không có trong cơ sở dữ liệu.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/thiet-bi">Về danh sách</Link></Button>
      </div>
    );
  }
  if (!scopeAll && !inScope(tb.don_vi)) return <AccessDenied backTo="/thiet-bi" backLabel="Về danh sách tài sản" />;

  return <ThietBiDetailInner tb={tb} tenTb={devNameOv?.get(tb.ma_thiet_bi) || tb.ten} sysName={(tb._htId && nameOv?.get(tb._htId)) || tb._htTen} sysGpSo={taxo?.htList.find((h) => h.id === tb._htId)?.gpSo ?? ""} sysGpHan={taxo?.htList.find((h) => h.id === tb._htId)?.gpHan ?? ""} />;
}

function ThietBiDetailInner({ tb, tenTb, sysName, sysGpSo, sysGpHan }: { tb: DbDevice; tenTb: string; sysName: string; sysGpSo: string; sysGpHan: string }) {
  const { ops } = useOperationsData();
  const { data: taxo } = useDbTaxonomy();
  const ma = tb.ma_thiet_bi;

  // Màu Chủng loại (chip shelf.nu-style) — lookup theo _loaiTbId nếu có.
  const { data: loaiMau } = useQuery({
    queryKey: ["dm_loai_thiet_bi_mau", tb._loaiTbId],
    enabled: !!tb._loaiTbId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_loai_thiet_bi").select("mau").eq("id", tb._loaiTbId!).maybeSingle();
      if (error) throw error;
      return (data?.mau ?? null) as string | null;
    },
  });


  // Tên mẫu / nhà sản xuất / nhà cung cấp lấy từ liên kết khoá ngoại (nguồn chuẩn).
  const { data: refInfo } = useQuery({
    queryKey: ["tb_ref_info", ma],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("dm_model(ten, p_n, hinh_anh), dm_nha_san_xuat(ten), dm_nha_cung_cap(ten)")
        .eq("ma_thiet_bi", ma)
        .maybeSingle();
      if (error) throw error;
      const row = data as Record<string, any> | null;
      let modelImg = "";
      const path = row?.dm_model?.hinh_anh as string | undefined;
      if (path) {
        const { data: signed } = await storage.from("model-anh").createSignedUrl(path, 315360000);
        modelImg = signed?.signedUrl ?? "";
      }
      return {
        model: (row?.dm_model?.ten as string) || "",
        modelPn: (row?.dm_model?.p_n as string) || "",
        nhaSanXuat: (row?.dm_nha_san_xuat?.ten as string) || "",
        nhaCungCap: (row?.dm_nha_cung_cap?.ten as string) || "",
        modelImg,
      };
    },
  });

  const { hasRole, roles } = useSession();
  const canEdit = hasRole("admin") || hasRole("phong_kt");
  const [editMode, setEditMode] = useState(false);
  const canManage = canEdit && editMode;

  const capPhatMut = useCapPhatThietBi();
  const capPhatKyMut = useCapPhatVoiChuKy();
  const { data: latestHandover } = useLatestHandover(tb.id);
  const { data: vaiTro } = useVaiTroThietBi(tb.id);
  const donViOptions = useMemo(
    () => (taxo?.donViList ?? []).map((d) => ({ id: d.id, ten: `${d.ma}${d.ten ? " — " + d.ten : ""}` })),
    [taxo],
  );
  const donViTenMap = useMemo(
    () => new Map((taxo?.donViList ?? []).map((d) => [d.id, `${d.ma}${d.ten ? " — " + d.ten : ""}`])),
    [taxo],
  );





  // Ưu tiên khớp theo khoá ngoại UUID (thiet_bi.id); fallback mã text cho dữ liệu cũ.
  const tbId = tb.id;
  const baoTri = useMemo(() => ops.baoTri.filter((e) => (e.thiet_bi_id ? e.thiet_bi_id === tbId : e.thiet_bi === ma)), [ops.baoTri, tbId, ma]);
  const suCo = useMemo(() => ops.suCo.filter((e) => (e.thiet_bi_id ? e.thiet_bi_id === tbId : e.thiet_bi === ma)), [ops.suCo, tbId, ma]);
  const hongHoc = useMemo(() => ops.hongHoc.filter((e) => (e.thiet_bi_hong_id ? e.thiet_bi_hong_id === tbId : e.thiet_bi_hong === ma)), [ops.hongHoc, tbId, ma]);
  const banGiao = useMemo(() => ops.banGiao.filter((e) => e.thiet_bi === ma), [ops.banGiao, ma]);
  const { data: changeEvents = [] } = useChangeLog("thiet_bi", canEdit ? tb.id : null);
  const { data: cheDoKdHc } = useQuery({
    queryKey: ["thiet_bi_che_do_kd_hc", tb.id],
    queryFn: async () => {
      const { data } = await supabase.from("thiet_bi").select("che_do_kd_hc").eq("id", tb.id).maybeSingle();
      return (data?.che_do_kd_hc as string | null) ?? "KHONG";
    },
    staleTime: 60_000,
  });

  const gpLabel = giayPhepLabelByTen(tb._plTen) || "Giấy phép khai thác";
  const hasGp = Boolean(sysGpSo);

  const pct = tb._tyLeTuoiTho == null ? null : Math.max(0, Math.min(100, Math.round(tb._tyLeTuoiTho)));

  // Merged chronological timeline across all history sources (mapper dùng chung).
  const timeline = useMemo<TimelineItem[]>(
    () =>
      buildRecordTimeline({
        baoTri,
        suCo,
        hongHoc,
        banGiao,
        changeEvents: changeEvents.map((ev) => ({
          at: ev.at,
          action: ev.action,
          userName: ev.userName,
          changesCount: ev.changes.length,
          changesText: ev.changes
            .map((c) => `${c.label}: ${formatVal(c.from)} → ${formatVal(c.to)}`)
            .join("; "),
        })),
      }),
    [baoTri, suCo, hongHoc, banGiao, changeEvents],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/thiet-bi"><ArrowLeft className="mr-1 h-4 w-4" /> Danh sách</Link></Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold font-mono">{ma}</h1>
            {tb.trang_thai && <Badge variant="secondary" className={ttColor[tb.trang_thai] ?? "bg-slate-100 text-slate-700"}>{tb.trang_thai}</Badge>}
            {tb._plTen && <Badge variant="outline">{tb._plTen}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{tenTb}</p>
        </div>
        {canEdit && (
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
            title={editMode ? "Tắt chế độ chỉnh sửa" : "Bật chế độ chỉnh sửa để sửa tài sản"}
          >
            <PencilLine className="mr-1 h-4 w-4" />
            {editMode ? "Đang chỉnh sửa" : "Bật chỉnh sửa"}
          </Button>
        )}
        {canManage && <ThietBiLifecycleActions ma={ma} trangThai={tb.trang_thai} />}
      </div>

      {/* Cấp phát / thu hồi (T2.1) */}
      <CapPhatControl
        trangThai={tb._capPhatTrangThai}
        nguoiGiu={tb._nguoiGiu}
        donViGiuTen={tb._donViGiuTen}
        ngayCapPhat={tb._ngayCapPhat}
        daKy={tb._capPhatTrangThai === "da_cap_phat" && !!latestHandover?.da_chap_nhan}
        thoiDiemKy={latestHandover?.thoi_diem_chap_nhan ?? null}
        canManage={canManage}
        donViOptions={donViOptions}
        pending={capPhatKyMut.isPending || capPhatMut.isPending}
        onCapPhat={({ nguoiGiu, donViGiuId, ghiChu, chuKyDataUrl }) =>
          capPhatKyMut.mutate(
            { thietBiId: tb.id, maThietBi: ma, hanhDong: "cap_phat", nguoiGiu, donViGiuId, ghiChu, chuKyDataUrl, nguoiGiao: null },
            {
              onSuccess: () => toast.success(chuKyDataUrl ? `Đã cấp phát ${ma} kèm chữ ký` : `Đã cấp phát ${ma}`),
              onError: (e: Error) => toast.error(e.message),
            },
          )
        }
        onThuHoi={({ ghiChu }) =>
          capPhatMut.mutate(
            { thietBiId: tb.id, hanhDong: "thu_hoi", ghiChu },
            {
              onSuccess: () => toast.success(`Đã thu hồi ${ma}`),
              onError: (e: Error) => toast.error(e.message),
            },
          )
        }
      />




      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Gauge} label="Tỷ lệ tuổi thọ" value={pct == null ? "—" : `${pct}%`} tone={pct != null && pct >= 90 ? "text-red-600" : pct != null && pct >= 70 ? "text-amber-600" : "text-emerald-600"} />
        <KpiCard icon={Calendar} label="Năm sản xuất" value={tb._namSanXuat ? String(tb._namSanXuat) : "—"} sub={tb._namKhaiThac ? `Khai thác ${tb._namKhaiThac}` : undefined} />
        <KpiCard icon={AlertTriangle} label="Sự cố ghi nhận" value={String(suCo.length)} tone={suCo.length > 0 ? "text-red-600" : "text-emerald-600"} />
        <KpiCard icon={Wrench} label="Lần bảo dưỡng" value={String(baoTri.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: identification + QR */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin tài sản</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {refInfo?.modelImg && (
                <div className="flex items-center justify-center overflow-hidden rounded-md border bg-muted/40 p-2">
                  <img src={refInfo.modelImg} alt={refInfo.model || "Model"} className="max-h-40 w-auto object-contain" loading="lazy" />
                </div>
              )}
              <InfoRow icon={FileText} label="Mã tài sản Bravo" value={<span className="font-mono">{tb._maBravo || "—"}</span>} />
              <InfoRow icon={Package} label="Model" value={
                (refInfo?.model || tb.model)
                  ? <span className="inline-flex flex-wrap items-center gap-1.5">
                      <Link to="/danh-muc/model" search={{ q: (refInfo?.model || tb.model) as string }} className="inline-flex items-center gap-1 text-primary hover:underline">{refInfo?.model || tb.model}<ExternalLink className="h-3 w-3" /></Link>
                      {refInfo?.modelPn && <span className="font-mono text-xs text-muted-foreground">· {refInfo.modelPn}</span>}
                    </span>
                  : "—"
              } />
              <InfoRow icon={FileText} label="Serial" value={<span className="font-mono">{tb.serial || "—"}</span>} />
              <InfoRow icon={Factory} label="Nhà sản xuất" value={
                (refInfo?.nhaSanXuat || tb.nha_san_xuat)
                  ? <Link to="/danh-muc/nha-san-xuat" search={{ q: (refInfo?.nhaSanXuat || tb.nha_san_xuat) as string }} className="inline-flex items-center gap-1 text-primary transition-colors hover:underline">{refInfo?.nhaSanXuat || tb.nha_san_xuat}<ExternalLink className="h-3 w-3" /></Link>
                  : "—"
              } />
              <InfoRow icon={Truck} label="Nhà cung cấp" value={
                (refInfo?.nhaCungCap || tb.nha_cung_cap)
                  ? <Link to="/danh-muc/nha-cung-cap" search={{ q: (refInfo?.nhaCungCap || tb.nha_cung_cap) as string }} className="inline-flex items-center gap-1 text-primary transition-colors hover:underline">{refInfo?.nhaCungCap || tb.nha_cung_cap}<ExternalLink className="h-3 w-3" /></Link>
                  : "—"
              } />
              {(tb._loaiTbTen || tb.loai) && (
                <InfoRow icon={Tag} label="Chủng loại" value={
                  <Link to="/danh-muc/loai-thiet-bi" search={{ q: (tb._loaiTbTen || tb.loai) as string }} className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
                    <MauChip ten={(tb._loaiTbTen || tb.loai) as string} mau={loaiMau ?? null} />
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                } />
              )}
              <DacTinhInfoRow deviceId={tb.id} />



              <InfoRow icon={Building2} label="Đơn vị quản lý" value={
                (tb.don_vi || tb._donViTen)
                  ? <Link to="/danh-muc/don-vi" className="inline-flex items-center gap-1 text-primary hover:underline">{`${tb.don_vi || "—"}${tb._donViTen ? " — " + tb._donViTen : ""}`}<ExternalLink className="h-3 w-3" /></Link>
                  : "—"
              } />
              
              <InfoRow icon={Network} label="Nhóm hệ thống" value={
                tb._nhTen && tb._nhTen !== "—"
                  ? <Link to="/danh-muc/he-thong" className="inline-flex items-center gap-1 text-primary hover:underline">{tb._nhTen}<ExternalLink className="h-3 w-3" /></Link>
                  : tb._nhTen
              } />
              <InfoRow icon={Network} label="Hệ thống" value={
                sysName
                  ? <Link to="/danh-muc/he-thong" className="inline-flex items-center gap-1 text-primary hover:underline">{sysName}<ExternalLink className="h-3 w-3" /></Link>
                  : "—"
              } />
              <InfoRow icon={Layers} label="Đang đảm nhận" value={
                vaiTro
                  ? <span className="inline-flex flex-col">
                      <span className="font-medium">{vaiTro.ten_thanh_phan}</span>
                      <span className="text-xs text-muted-foreground">{vaiTro.ma_thanh_phan}{vaiTro.ten_he_thong ? ` · ${vaiTro.ten_he_thong}` : ""}</span>
                    </span>
                  : <span className="text-muted-foreground">Chưa lắp vào thành phần nào</span>
              } />
              <InfoRow icon={MapPin} label="Vị trí lắp đặt" value={
                tb.vi_tri
                  ? <Link to="/danh-muc/vi-tri" className="inline-flex items-center gap-1 text-primary hover:underline">{tb.vi_tri}<ExternalLink className="h-3 w-3" /></Link>
                  : "—"
              } />
              <InfoRow icon={MapPin} label="Nơi quản lý" value={tb._noiQuanLy || "—"} />
              {tb._thanhPhan && <InfoRow icon={Layers} label="Tài sản con" value={tb._thanhPhan} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Vòng đời & khai thác</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Calendar} label="Ngày mua" value={tb.ngay_mua || "—"} />
              <InfoRow icon={Calendar} label="Năm đưa vào khai thác" value={tb._namKhaiThac ? String(tb._namKhaiThac) : (tb.ngay_dua_vao_su_dung || "—")} />
              <InfoRow icon={ShieldCheck} label="Hạn bảo hành" value={tb.han_bao_hanh || "—"} />
              <InfoRow icon={Package} label="Phân loại" value={tb._phanLoai || tb._plTen} />
              {pct != null && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Tỷ lệ tuổi thọ</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-muted">
                    <div className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Mã QR</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <div className="rounded-md border bg-white p-3">
                <QRCodeSVG value={`MIRATS:${ma}`} size={144} />
              </div>
              <div className="text-xs font-mono text-muted-foreground">MIRATS:{ma}</div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sổ lý lịch tabs */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Sổ lý lịch</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="tl">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="tl"><Clock className="mr-1 h-3.5 w-3.5" />Dòng thời gian ({timeline.length})</TabsTrigger>
                <TabsTrigger value="lylich"><History className="mr-1 h-3.5 w-3.5" />Lý lịch</TabsTrigger>
                <TabsTrigger value="linhkien"><Cpu className="mr-1 h-3.5 w-3.5" />Linh kiện</TabsTrigger>
                <TabsTrigger value="dodac"><Activity className="mr-1 h-3.5 w-3.5" />Đo đạc</TabsTrigger>
                <TabsTrigger value="vongdoi"><History className="mr-1 h-3.5 w-3.5" />Vòng đời</TabsTrigger>
                {cheDoKdHc && cheDoKdHc !== "KHONG" && (
                  <TabsTrigger value="kdhc"><ShieldCheck className="mr-1 h-3.5 w-3.5" />KĐ/HC</TabsTrigger>
                )}
                <TabsTrigger value="gp">{gpLabel} ({hasGp ? 1 : 0})</TabsTrigger>
                <TabsTrigger value="bt">Bảo dưỡng ({baoTri.length})</TabsTrigger>
                <TabsTrigger value="sc">Sự cố ({suCo.length})</TabsTrigger>
                <TabsTrigger value="hh">Thay thế ({hongHoc.length})</TabsTrigger>
                <TabsTrigger value="bg">Bàn giao ({banGiao.length})</TabsTrigger>
                <TabsTrigger value="capphat"><PackageCheck className="mr-1 h-3.5 w-3.5" />Cấp phát</TabsTrigger>
                <TabsTrigger value="tep"><Paperclip className="mr-1 h-3.5 w-3.5" />Tệp đính kèm</TabsTrigger>
                <TabsTrigger value="all"><Table2 className="mr-1 h-3.5 w-3.5" />Toàn bộ trường</TabsTrigger>
                {canEdit && <TabsTrigger value="cd"><PencilLine className="mr-1 h-3.5 w-3.5" />Lịch sử thay đổi</TabsTrigger>}

              </TabsList>


              <TabsContent value="tl" className="mt-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có sự kiện lịch sử nào cho tài sản này.</p>
                ) : (
                  <Timeline items={timeline} />
                )}
              </TabsContent>

              <TabsContent value="lylich" className="mt-4">
                <LyLichThietBiPanel thietBiId={tb.id} />
              </TabsContent>

              <TabsContent value="linhkien" className="mt-4">
                <KheLinhKienPanel thietBiId={tb.id} canManage={canManage} />
              </TabsContent>




              <TabsContent value="dodac" className="mt-4">
                <TelemetryPanel thietBiId={tb.id} canManage={canManage} />
              </TabsContent>

              <TabsContent value="vongdoi" className="mt-4">
                <LifecyclePanel thietBiId={tb.id} />
              </TabsContent>

              <TabsContent value="capphat" className="mt-4">
                <AllocationPanel thietBiId={tb.id} donViTenMap={donViTenMap} />
              </TabsContent>

              <TabsContent value="kdhc" className="mt-4">
                <ChungChiPanel thietBiId={tb.id} cheDo={cheDoKdHc} roles={roles} />
              </TabsContent>






              <TabsContent value="gp" className="mt-4 space-y-2">

                {!hasGp && <p className="text-sm text-muted-foreground">Hệ thống chưa có {gpLabel.toLowerCase()}.</p>}
                {hasGp && (
                  <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="font-medium font-mono">{sysGpSo}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">Hệ thống: {sysName}{sysGpHan ? ` · Hạn: ${sysGpHan}` : ""}</div>
                    </div>
                    <Badge variant="outline">{gpLabel}</Badge>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bt" className="mt-4 space-y-2">
                {baoTri.length === 0 && <p className="text-sm text-muted-foreground">Chưa có phiếu bảo dưỡng.</p>}
                {baoTri.map((e) => (
                  <EventRow key={e.ma_bao_tri} title={e.mo_ta_cong_viec || e.loai_bao_tri} date={e.ngay_bat_dau} label={e.loai_bao_tri} desc={e.ket_qua ?? ""} tag={e.trang_thai} />
                ))}
              </TabsContent>

              <TabsContent value="sc" className="mt-4 space-y-2">
                {suCo.length === 0 && <p className="text-sm text-muted-foreground">Không có sự cố ghi nhận.</p>}
                {suCo.map((e) => (
                  <EventRow key={e.ma_su_co} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-red-50 text-red-700" />
                ))}
              </TabsContent>

              <TabsContent value="hh" className="mt-4 space-y-2">
                {hongHoc.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc / thay thế.</p>}
                {hongHoc.map((e) => (
                  <EventRow key={e.ma_hong_hoc} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-orange-50 text-orange-700" />
                ))}
              </TabsContent>

              <TabsContent value="bg" className="mt-4 space-y-2">
                {banGiao.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
                {banGiao.map((e) => (
                  <EventRow key={e.ma_ban_giao} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-sky-50 text-sky-700" />
                ))}
              </TabsContent>

              <TabsContent value="tep" className="mt-4">
                <ThietBiTepDinhKem maThietBi={ma} />
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <ThietBiAllFields maThietBi={ma} />
              </TabsContent>


              {canEdit && (
                <TabsContent value="cd" className="mt-4">
                  <ChangeLogPanel entity="thiet_bi" entityId={tb.id} />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {tb.ghi_chu && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ghi chú</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{tb.ghi_chu}</CardContent>
        </Card>
      )}
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

/** Dòng "Nhãn tài sản": chip đa trị kế thừa từ Mẫu qua view v_thiet_bi_dac_tinh. */
function DacTinhInfoRow({ deviceId }: { deviceId: string }) {
  const { data } = useQuery({
    queryKey: ["thiet_bi_dac_tinh_row", deviceId],
    enabled: !!deviceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: links, error: e1 } = await supabase
        .from("v_thiet_bi_dac_tinh")
        .select("dac_tinh_id")
        .eq("thiet_bi_id", deviceId);
      if (e1) throw e1;
      const ids = (links ?? []).map((r) => r.dac_tinh_id).filter((x): x is string => !!x);
      if (!ids.length) return [] as DacTinh[];
      const { data: tags, error: e2 } = await supabase
        .from("dm_dac_tinh")
        .select("ma, ten, thu_tu, mau")
        .in("id", ids);
      if (e2) throw e2;
      return (tags ?? []) as DacTinh[];
    },
  });
  const tags = sortDacTinh(data ?? []);
  return (
    <InfoRow icon={Tag} label="Nhãn tài sản" value={
      tags.length
        ? <span className="inline-flex flex-wrap gap-1">
            {tags.map((t) => (
              <MauChip key={t.ma} ten={t.ten} mau={t.mau ?? null} title={t.ten} />
            ))}
          </span>
        : <span className="text-muted-foreground">—</span>
    } />
  );
}




function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className={`font-semibold ${tone ?? ""}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function EventRow({ title, date, label, desc, tag, tone }: { title: string; date: string; label: string; desc: string; tag?: string; tone?: string }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={tone}>{label}</Badge>
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        {tag && <Badge variant="secondary" className="ml-auto">{tag}</Badge>}
      </div>
      <div className="mt-1 font-medium">{title || "—"}</div>
      {desc && <div className="text-muted-foreground">{desc}</div>}
    </div>
  );
}



const timelineMeta: Record<TimelineKind, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string; chip: string }> = {
  bt: { icon: Wrench, name: "Bảo dưỡng", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  sc: { icon: AlertTriangle, name: "Sự cố", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  hh: { icon: RefreshCw, name: "Hỏng hóc / thay thế", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700" },
  bg: { icon: ArrowLeftRight, name: "Bàn giao", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  cd: { icon: PencilLine, name: "Chỉnh sửa dữ liệu", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
};

function Timeline({ items }: { items: TimelineItem[] }) {
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

// ---------- Panel: Đo đạc / telemetry ----------
function TelemetryPanel({ thietBiId, canManage }: { thietBiId: string; canManage: boolean }) {
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
      },
    );
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
          <label className="flex-1 min-w-[140px] text-xs">
            <span className="mb-1 block text-muted-foreground">Chỉ số</span>
            <Input value={chiSo} onChange={(e) => setChiSo(e.target.value)} placeholder="gio_chay, nhiet_do…" />
          </label>
          <label className="w-28 text-xs">
            <span className="mb-1 block text-muted-foreground">Giá trị</span>
            <Input value={giaTri} onChange={(e) => setGiaTri(e.target.value)} inputMode="decimal" placeholder="0" />
          </label>
          <label className="w-24 text-xs">
            <span className="mb-1 block text-muted-foreground">Đơn vị</span>
            <Input value={donVi} onChange={(e) => setDonVi(e.target.value)} placeholder="giờ, °C…" />
          </label>
          <Button size="sm" onClick={submit} disabled={addMut.isPending}>
            {addMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
            Ghi số đo
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải số đo…
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có số đo nào. {canManage ? "Ghi số đo đầu tiên ở trên." : ""}</p>
      )}
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{r.chi_so}</Badge>
            <span className="font-semibold tabular-nums">
              {r.gia_tri == null ? "—" : r.gia_tri.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs text-muted-foreground">{r.don_vi_do ?? ""}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(r.thoi_diem).toLocaleString("vi-VN")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- Panel: Nhật ký vòng đời ----------
function LifecyclePanel({ thietBiId }: { thietBiId: string }) {
  const { data: rows = [], isLoading } = useLifecycle(thietBiId);
  const { data: ttMap } = useTrangThaiMap();
  const nameOf = (id: string | null) => (id ? ttMap?.get(id) ?? "—" : "—");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nhật ký vòng đời…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có chuyển trạng thái nào. Nhật ký sẽ tự ghi khi trạng thái tài sản thay đổi.
      </p>
    );
  }
  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {rows.map((r) => (
        <li key={r.id} className="relative mb-5 last:mb-0">
          <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-primary ring-4 ring-background">
            <History className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <div className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(r.thoi_diem).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{nameOf(r.tu_trang_thai_id)}</Badge>
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary">{nameOf(r.den_trang_thai_id)}</Badge>
            </div>
            {r.ly_do && <div className="mt-1 text-muted-foreground">{r.ly_do}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------- Panel: Lịch sử cấp phát / thu hồi ----------
function AllocationPanel({ thietBiId, donViTenMap }: { thietBiId: string; donViTenMap: Map<string, string> }) {
  const { data: rows = [], isLoading } = useAllocationHistory(thietBiId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lịch sử cấp phát…
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có lịch sử cấp phát / thu hồi.</p>;
  }
  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {rows.map((r) => {
        const isCap = r.hanh_dong === "cap_phat";
        const Icon = isCap ? UserCheck : ArrowLeftRight;
        return (
          <li key={r.id} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${isCap ? "bg-amber-500" : "bg-emerald-500"}`}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(r.thoi_diem).toLocaleString("vi-VN")}
                </span>
                <Badge variant="outline" className={isCap ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}>
                  {isCap ? "Cấp phát" : "Thu hồi"}
                </Badge>
              </div>
              {(r.nguoi_giu || r.don_vi_giu_id) && (
                <div className="mt-1 flex items-center gap-2">
                  {r.nguoi_giu && <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5 text-muted-foreground" />{r.nguoi_giu}</span>}
                  {r.don_vi_giu_id && <span className="flex items-center gap-1"><BuildingIcon className="h-3.5 w-3.5 text-muted-foreground" />{donViTenMap.get(r.don_vi_giu_id) ?? "—"}</span>}
                </div>
              )}
              {r.ghi_chu && <div className="mt-1 text-muted-foreground">{r.ghi_chu}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}




