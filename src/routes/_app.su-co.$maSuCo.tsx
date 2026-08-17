import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, AlertTriangle, Clock, Activity, ShieldAlert, Wrench, User, Calendar,
  HardDrive, Network, Building2, FileText, Package, Sparkles, Link2, Unlink,
  History, Info, Files, Settings, LayoutList, ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { fmtDowntime } from "@/lib/mirats/format";
import { mttr as computeMttr, mtbf as computeMtbf, formatKpiValue } from "@/lib/mirats/reliability";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { supabase } from "@/integrations/backend/client";
import { VatTuTieuHaoView } from "@/components/mirats/VatTuTieuHaoView";
import { VatTuTieuHaoInline } from "@/components/mirats/VatTuTieuHaoInline";
import { useSession } from "@/hooks/use-session";
import { canManageSuCoState } from "@/lib/mirats/su-co-state";
import { VongDoiPanel } from "@/components/mirats/VongDoiPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { InfoGrid } from "@/components/mirats/InfoGrid";
import { EdgeTabs } from "@/components/mirats/EdgeTabs";

export const Route = createFileRoute("/_app/su-co/$maSuCo")({
  head: () => ({
    meta: [
      { title: "Sự cố — MIRATS 2.0" },
      { name: "description", content: "Phiếu sự cố MIRATS 2.0" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuCoDetail,
});

import { StatusBadge } from "@/components/mirats/StatusBadge";


function SuCoDetail() {
  const { maSuCo } = Route.useParams();
  const { suCo, thietBi, heThong, donVi, inScope, loading } = useScope();
  const { roles } = useSession();

  const sc = useMemo(() => suCo.find((x) => x.ma_su_co === maSuCo), [suCo, maSuCo]);
  const tb = useMemo(() => thietBi.find((t) => t.ma_thiet_bi === sc?.thiet_bi), [thietBi, sc]);
  const ht = useMemo(() => heThong.find((h) => h.ma === sc?.he_thong), [heThong, sc]);
  const dv = useMemo(() => donVi.find((d) => d.ma === sc?.don_vi), [donVi, sc]);
  const tbHistory = useMemo(() => (sc ? suCo.filter((x) => x.thiet_bi === sc.thiet_bi) : []), [suCo, sc]);
  const mttr = useMemo(() => computeMttr(tbHistory), [tbHistory]);
  const mtbf = useMemo(() => computeMtbf(tbHistory), [tbHistory]);

  // Task 53 — resolve su_co.id (uuid) để liên kết bút toán tiêu hao vật tư.
  const { data: suCoId } = useQuery({
    queryKey: ["su_co_id", maSuCo],
    enabled: !!maSuCo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("su_co")
        .select("id")
        .eq("ma_su_co", maSuCo)
        .maybeSingle();
      if (error) throw error;
      return (data?.id as string | undefined) ?? null;
    },
    staleTime: 60_000,
  });
  const coQuyenGhi = canManageSuCoState(roles);

  const [vdOpts, setVdOpts] = useState<ComboOption[]>([]);
  const [vdPick, setVdPick] = useState<string>("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase
      .from("v_van_de")
      .select("id, ma_van_de, tieu_de, trang_thai")
      .neq("trang_thai", "dong")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const opts: ComboOption[] = [];
        for (const v of data ?? []) {
          if (!v.id) continue;
          opts.push({ value: v.id, label: v.tieu_de ?? "(không tiêu đề)", hint: v.ma_van_de ?? undefined });
        }
        setVdOpts(opts);
      });
  }, []);
  useEffect(() => { setVdPick(sc?.van_de_id ?? ""); }, [sc?.van_de_id]);

  const linkedVd = useMemo(() => vdOpts.find((o) => o.value === sc?.van_de_id), [vdOpts, sc?.van_de_id]);
  const dirty = (sc?.van_de_id ?? "") !== vdPick;

  async function saveVanDe(newId: string | null) {
    if (!sc) return;
    setSaving(true);
    const { error } = await supabase.from("su_co").update({ van_de_id: newId }).eq("ma_su_co", sc.ma_su_co);
    setSaving(false);
    if (error) toast.error("Lỗi khi cập nhật vấn đề: " + error.message);
    else toast.success(newId ? "Đã gắn vấn đề" : "Đã gỡ vấn đề");
  }

  if (loading) return <div className="rounded-md border p-8 text-center text-muted-foreground">Đang tải…</div>;
  if (!sc) {
    return (
      <div className="rounded-md border p-8 text-center">
        <h2 className="text-lg font-semibold">Không tìm thấy sự cố</h2>
        <Button asChild variant="outline" className="mt-4"><Link to="/su-co">Về nhật ký</Link></Button>
      </div>
    );
  }
  if (!inScope(sc.don_vi)) return <AccessDenied backTo="/su-co" backLabel="Về danh sách sự cố" />;

  return (
    <PageFrame density="compact">
      <PageHeader
        title={sc.ma_su_co}
        subtitle={sc.hien_tuong}
        icon={() => <AlertTriangle className={cn("h-4 w-4", sc.muc_do === "Nghiêm trọng" ? "text-destructive" : "text-primary")} />}
        breadcrumbs={[
          { label: "Sự cố", to: "/su-co" },
          { label: sc.ma_su_co }
        ]}
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge domain="su_co" code={sc.muc_do} label={sc.muc_do} />
            <StatusBadge domain="thiet_bi" code={sc.trang_thai} label={sc.trang_thai} />
            <StatusBadge domain="su_co" code={sc.anh_huong_dhb} label={sc.anh_huong_dhb} />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link to="/su-co"><ArrowLeft className="mr-2 h-4 w-4" /> Nhật ký</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8" disabled>
              <FileText className="mr-2 h-4 w-4" /> In phiếu
            </Button>
          </div>
        }
      />

      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          <KpiCard icon={Clock} label="Downtime" value={fmtDowntime(sc.thoi_gian_gian_doan)} tone={sc.thoi_gian_gian_doan ? "text-amber-600" : "text-muted-foreground"} />
          <KpiCard icon={Activity} label="TB — Sự cố lũy kế" value={String(tbHistory.length)} />
          <KpiCard icon={Clock} label="TB — MTTR" value={formatKpiValue(mttr, fmtDowntime)} />
          <KpiCard icon={Calendar} label="TB — MTBF" value={formatKpiValue(mtbf)} />
        </div>

        <EdgeTabs
          tabs={[
        {
          id: "tong-quan",
          label: "Tổng quan",
          icon: <LayoutList className="h-4 w-4" />,
          content: (
            <div className="space-y-6">
              {sc.muc_do === "Nghiêm trọng" && (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-semibold">Sự cố nghiêm trọng — đã thông báo</div>
                    <div>Đã gửi cảnh báo cho phụ trách đơn vị {dv?.ten ?? sc.don_vi} và Phòng Kỹ thuật.</div>
                  </div>
                </div>
              )}

              {suCoId && <VongDoiPanel bang="su_co" id={suCoId} trangThaiHienTai={sc.trang_thai} />}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Thông tin phiếu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-3 text-sm">
                      <InfoRow icon={Calendar} label="Ngày phát hiện" value={sc.ngay_phat_hien.replace("T", " ")} />
                      <InfoRow icon={Calendar} label="Thời điểm khắc phục" value={sc.thoi_diem_khac_phuc ? sc.thoi_diem_khac_phuc.replace("T", " ") : "Chưa khắc phục"} />
                      <InfoRow icon={User} label="Người báo cáo" value={sc.nguoi_bao_cao || "—"} />
                      <InfoRow icon={Building2} label="Đơn vị" value={dv?.ten ?? sc.don_vi} />
                      <InfoRow icon={Network} label="Hệ thống" value={ht?.ten ?? sc.he_thong} />
                      <InfoRow icon={HardDrive} label="Tài sản" value={
                        tb ? (
                          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="text-primary hover:underline">
                            {tb.ma_thiet_bi} — {tb.ten}
                          </Link>
                        ) : sc.thiet_bi
                      } />
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Xử lý kỹ thuật
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-4 text-sm">
                      <Section icon={AlertTriangle} title="Hiện tượng" tone="text-red-600" body={sc.hien_tuong} />
                      <Section icon={FileText} title="Nguyên nhân" tone="text-amber-600" body={sc.nguyen_nhan ?? "Chưa xác định."} />
                      <Section icon={Wrench} title="Biện pháp xử lý" tone="text-emerald-600" body={sc.bien_phap_xu_ly ?? "Đang cập nhật."} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        },
        {
          id: "vat-tu",
          label: "Vật tư & Tiêu hao",
          icon: <Package className="h-4 w-4" />,
          content: (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <VatTuTieuHaoView
                  cot="lien_ket_su_co_id"
                  id={suCoId ?? null}
                  empty={<p className="text-sm text-muted-foreground">Chưa có bút toán xuất kho cho sự cố này.</p>}
                />
                {coQuyenGhi && suCoId && (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi vật tư sử dụng</div>
                    <VatTuTieuHaoInline
                      lienKet={{ suCoId }}
                      hideTitle
                      onXong={(ids) => {
                        if (ids.length > 0) toast.success(`Đã liên kết ${ids.length} bút toán`);
                      }}
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {!sc.lien_ket_hong_hoc ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/hong-hoc/moi" search={{ suCo: sc.ma_su_co, heThong: sc.he_thong_id ?? undefined, thietBi: sc.thiet_bi }}>
                        <Package className="mr-2 h-4 w-4" /> Ghi nhận hỏng hóc
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: sc.lien_ket_hong_hoc }}>
                        <Package className="mr-2 h-4 w-4" /> Xem phiếu hỏng hóc
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        },
        {
          id: "lien-ket",
          label: "Liên kết & RCA",
          icon: <Link2 className="h-4 w-4" />,
          content: (
            <Card>
              <CardContent className="space-y-4 pt-6 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {linkedVd?.hint ?? sc.van_de_id?.slice(0, 8) ?? "Chưa liên kết"}
                  </Badge>
                  <span className="text-muted-foreground">{linkedVd?.label ?? "Chưa gắn vào vấn đề (RCA) nào"}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/van-de">Mở trang RCA</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[280px] flex-1">
                    <Combobox
                      options={[{ value: "", label: "— Không liên kết —" }, ...vdOpts]}
                      value={vdPick}
                      onChange={setVdPick}
                      placeholder="Chọn vấn đề…"
                    />
                  </div>
                  <Button size="sm" disabled={!dirty || saving} onClick={() => saveVanDe(vdPick || null)}>
                    {saving ? "Đang lưu…" : "Lưu"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        },
        {
          id: "lich-su",
          label: "Lịch sử tài sản",
          icon: <History className="h-4 w-4" />,
          content: (
            <div className="space-y-3">
              {tbHistory.map((x) => (
                <Link key={x.ma_su_co} to="/su-co/$maSuCo" params={{ maSuCo: x.ma_su_co }}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm hover:bg-muted/50",
                    x.ma_su_co === sc.ma_su_co && "border-primary bg-primary/5"
                  )}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary">{x.ma_su_co}</span>
                    <span className="text-xs text-muted-foreground">{x.ngay_phat_hien.replace("T", " ")}</span>
                  </div>
                  <div className="min-w-0 flex-1 truncate px-2 text-muted-foreground">{x.hien_tuong}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge domain="su_co" code={x.muc_do} label={x.muc_do} />
                    <span className="text-xs tabular-nums text-muted-foreground">{fmtDowntime(x.thoi_gian_gian_doan)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        }
        ]}
        />
      </PageBody>
    </PageFrame>
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

function Section({ icon: Icon, title, body, tone }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; tone?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone ?? "text-muted-foreground"}`} />
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      </div>
      <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">{body}</div>
    </div>
  );
}
