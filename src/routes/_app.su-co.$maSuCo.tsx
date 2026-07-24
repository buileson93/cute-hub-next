import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, AlertTriangle, Clock, Activity, ShieldAlert, Wrench, User, Calendar,
  HardDrive, Network, Building2, FileText, Package, Sparkles, Link2, Unlink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { fmtDowntime } from "@/lib/mirats/format";
import { mttr as computeMttr, mtbf as computeMtbf, formatKpiValue } from "@/lib/mirats/reliability";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { supabase } from "@/integrations/supabase/client";
import { VatTuTieuHaoView } from "@/components/mirats/VatTuTieuHaoView";
import { VatTuTieuHaoInline } from "@/components/mirats/VatTuTieuHaoInline";
import { useSession } from "@/hooks/use-session";
import { canManageSuCoState } from "@/lib/mirats/su-co-state";
import { VongDoiPanel } from "@/components/mirats/VongDoiPanel";
import { toast } from "sonner";

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

const mucColor: Record<string, string> = {
  "Nghiêm trọng": "bg-red-100 text-red-700",
  "Cao": "bg-orange-100 text-orange-700",
  "Trung bình": "bg-amber-100 text-amber-700",
  "Thấp": "bg-slate-100 text-slate-700",
};
const ttColor: Record<string, string> = {
  "Mới": "bg-sky-100 text-sky-700",
  "Đang xử lý": "bg-amber-100 text-amber-700",
  "Đã khắc phục": "bg-emerald-100 text-emerald-700",
  "Đóng": "bg-slate-200 text-slate-700",
};
const ahColor: Record<string, string> = {
  "Có gián đoạn ĐHB": "bg-red-100 text-red-700",
  "Ảnh hưởng một phần": "bg-amber-100 text-amber-700",
  "Không ảnh hưởng": "bg-slate-100 text-slate-600",
};

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/su-co"><ArrowLeft className="mr-1 h-4 w-4" /> Nhật ký</Link></Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold font-mono">{sc.ma_su_co}</h1>
            <Badge variant="secondary" className={mucColor[sc.muc_do] ?? ""}>{sc.muc_do}</Badge>
            <Badge variant="secondary" className={ttColor[sc.trang_thai] ?? ""}>{sc.trang_thai}</Badge>
            <Badge variant="secondary" className={ahColor[sc.anh_huong_dhb] ?? ""}>{sc.anh_huong_dhb}</Badge>
            {(sc.bao_cao_ban_dau as { nguon?: string } | null)?.nguon === "AI" && (
              <Badge variant="secondary" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" /> AI hỗ trợ nhập
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{sc.hien_tuong}</p>
        </div>
      </div>

      {sc.muc_do === "Nghiêm trọng" && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Sự cố nghiêm trọng — đã thông báo</div>
            <div>Đã gửi cảnh báo cho phụ trách đơn vị {dv?.ten ?? sc.don_vi} và Phòng Kỹ thuật ngay khi phát sinh.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Clock} label="Downtime" value={fmtDowntime(sc.thoi_gian_gian_doan)} tone={sc.thoi_gian_gian_doan ? "text-amber-600" : "text-muted-foreground"} />
        <KpiCard icon={Activity} label="TB — Sự cố lũy kế" value={String(tbHistory.length)} />
        <KpiCard icon={Clock} label="TB — MTTR" value={formatKpiValue(mttr, fmtDowntime)} />
        <KpiCard icon={Calendar} label="TB — MTBF" value={formatKpiValue(mtbf)} />
      </div>

      {suCoId && <VongDoiPanel bang="su_co" id={suCoId} trangThaiHienTai={sc.trang_thai} />}


      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Vấn đề (RCA) liên quan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sc.van_de_id ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {linkedVd?.hint ?? sc.van_de_id.slice(0, 8)}
              </Badge>
              <span className="text-muted-foreground">{linkedVd?.label ?? "(vấn đề)"}</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/van-de">Mở trang RCA</Link>
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa gắn vào vấn đề nào — hãy chọn để đối chiếu số sự cố ở trang Vấn đề.</p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[280px] flex-1">
              <Combobox
                options={[{ value: "", label: "— Không liên kết —" }, ...vdOpts]}
                value={vdPick}
                onChange={setVdPick}
                placeholder="Chọn vấn đề…"
                searchPlaceholder="Tìm mã / tiêu đề vấn đề…"
              />
            </div>
            <Button size="sm" disabled={!dirty || saving} onClick={() => saveVanDe(vdPick || null)}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
            {sc.van_de_id && (
              <Button size="sm" variant="outline" disabled={saving} onClick={() => { setVdPick(""); saveVanDe(null); }}>
                <Unlink className="mr-1 h-4 w-4" /> Gỡ liên kết
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Thông tin phiếu</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={Calendar} label="Ngày phát hiện" value={sc.ngay_phat_hien.replace("T", " ")} />
            <InfoRow icon={Calendar} label="Thời điểm khắc phục" value={sc.thoi_diem_khac_phuc ? sc.thoi_diem_khac_phuc.replace("T", " ") : "Chưa khắc phục"} />
            <InfoRow icon={User} label="Người báo cáo" value={sc.nguoi_bao_cao || "—"} />
            <InfoRow icon={User} label="Người xử lý" value={sc.nguoi_xu_ly.length ? sc.nguoi_xu_ly.join(", ") : "—"} />
            <InfoRow icon={Building2} label="Đơn vị" value={`${dv?.ma ?? sc.don_vi} — ${dv?.ten ?? ""}`} />
            <InfoRow icon={Network} label="Hệ thống" value={ht?.ten ?? sc.he_thong} />
            <InfoRow icon={HardDrive} label="Tài sản" value={
              tb ? (
                <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} className="text-primary hover:underline">
                  {tb.ma_thiet_bi} — {tb.ten}
                </Link>
              ) : sc.thiet_bi
            } />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Nội dung xử lý</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Section icon={AlertTriangle} title="Hiện tượng" tone="text-red-600" body={sc.hien_tuong} />
            <Section icon={FileText} title="Nguyên nhân" tone="text-amber-600" body={sc.nguyen_nhan ?? "Chưa xác định — đang phân tích."} />
            <Section icon={Wrench} title="Biện pháp xử lý" tone="text-emerald-600" body={sc.bien_phap_xu_ly ?? "Chưa cập nhật biện pháp khắc phục."} />
            {sc.lien_ket_hong_hoc && (
              <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-700">
                <Package className="h-4 w-4" />
                <span>Liên kết phiếu Hỏng hóc & Thay thế: <span className="font-mono">{sc.lien_ket_hong_hoc}</span></span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {!sc.lien_ket_hong_hoc && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/hong-hoc/moi" search={{ suCo: sc.ma_su_co, heThong: sc.he_thong_id ?? undefined, thietBi: sc.thiet_bi }}>
                    <Package className="mr-1 h-4 w-4" /> Ghi nhận hỏng hóc
                  </Link>
                </Button>
              )}
              {sc.lien_ket_hong_hoc && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: sc.lien_ket_hong_hoc }}>
                    <Package className="mr-1 h-4 w-4" /> Xem phiếu hỏng hóc
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" disabled><FileText className="mr-1 h-4 w-4" /> In phiếu sự cố</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task 53 — Vật tư đã tiêu hao cho sự cố (đồng bộ Bảo dưỡng / Hỏng hóc). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Vật tư đã tiêu hao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VatTuTieuHaoView
            cot="lien_ket_su_co_id"
            id={suCoId ?? null}
            empty={<p className="text-sm text-muted-foreground">Chưa có bút toán xuất kho cho sự cố này.</p>}
          />
          {coQuyenGhi && suCoId && (
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ghi vật tư sử dụng
              </div>
              <VatTuTieuHaoInline
                lienKet={{ suCoId }}
                hideTitle
                onXong={(ids) => {
                  if (ids.length > 0) toast.success(`Đã liên kết ${ids.length} bút toán vào sự cố`);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>



      {tbHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử sự cố của tài sản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tbHistory.map((x) => (
              <Link key={x.ma_su_co} to="/su-co/$maSuCo" params={{ maSuCo: x.ma_su_co }}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm hover:bg-muted/50 ${x.ma_su_co === sc.ma_su_co ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">{x.ma_su_co}</span>
                  <span className="text-xs text-muted-foreground">{x.ngay_phat_hien.replace("T", " ")}</span>
                </div>
                <div className="min-w-0 flex-1 truncate text-muted-foreground px-2">{x.hien_tuong}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={mucColor[x.muc_do] ?? ""}>{x.muc_do}</Badge>
                  <Badge variant="secondary" className={ttColor[x.trang_thai] ?? ""}>{x.trang_thai}</Badge>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmtDowntime(x.thoi_gian_gian_doan)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
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
