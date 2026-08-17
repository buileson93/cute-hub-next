import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { 
  ArrowLeft, ArrowRight, CalendarClock, DollarSign, Users, FileText, Package, 
  AlertTriangle, LayoutList, History, Info as InfoIcon, Building2, ReplaceIcon,
  ArrowLeftRight, Wrench
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtVND } from "@/lib/mirats/format";
import type { ThietBi } from "@/lib/mirats/types";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { VatTuTieuHaoView } from "@/components/mirats/VatTuTieuHaoView";
import { VongDoiPanel } from "@/components/mirats/VongDoiPanel";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EdgeTabs } from "@/components/mirats/EdgeTabs";
import { StatusBadge } from "@/components/mirats/StatusBadge";

export const Route = createFileRoute("/_app/hong-hoc/$maHongHoc")({
  head: () => ({
    meta: [
      { title: "Phiếu hỏng hóc — MIRATS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HongHocDetail,
});



function HongHocDetail() {
  const { maHongHoc } = Route.useParams();
  const { hongHoc, thietBi, suCo, donVi, inScope, loading } = useScope();

  const h = useMemo(() => hongHoc.find((x) => x.ma_hong_hoc === maHongHoc), [hongHoc, maHongHoc]);
  const tb = useMemo(() => thietBi.find((t) => t.ma_thiet_bi === h?.thiet_bi_hong), [thietBi, h]);
  const tbThay = useMemo(() => (h?.thiet_bi_thay_the ? thietBi.find((t) => t.ma_thiet_bi === h.thiet_bi_thay_the) ?? null : null), [thietBi, h]);
  const sc = useMemo(() => (h?.su_co ? suCo.find((x) => x.ma_su_co === h.su_co) ?? null : null), [suCo, h]);
  const dvo = useMemo(() => (tb ? donVi.find((d) => d.ma === tb.don_vi) ?? null : null), [donVi, tb]);
  const relatedByTb = useMemo(
    () => (h ? hongHoc.filter((x) => x.thiet_bi_hong === h.thiet_bi_hong && x.ma_hong_hoc !== h.ma_hong_hoc).slice(0, 8) : []),
    [hongHoc, h],
  );

  if (loading) return <div className="rounded-md border p-8 text-center text-muted-foreground">Đang tải…</div>;
  if (!h) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <h1 className="text-lg font-semibold">Không tìm thấy phiếu {maHongHoc}</h1>
        <Button asChild className="mt-4"><Link to="/hong-hoc">Quay lại danh sách</Link></Button>
      </div>
    );
  }
  if (!inScope(tb?.don_vi)) return <AccessDenied backTo="/hong-hoc" backLabel="Về danh sách hỏng hóc" />;


  return (
    <PageFrame density="compact">
      <PageHeader
        title={h.ma_hong_hoc}
        subtitle={h.bo_phan_hong}
        icon={ReplaceIcon}
        breadcrumbs={[
          { label: "Hỏng hóc", to: "/hong-hoc" },
          { label: h.ma_hong_hoc }
        ]}
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge domain="hong_hoc" code={h.phuong_an} label={h.phuong_an} />
            <StatusBadge domain="thiet_bi" code={h.trang_thai} label={h.trang_thai} />
            {dvo && (
              <Badge variant="outline" className="text-[10px]">
                <Building2 className="mr-1 h-3 w-3" /> {dvo.ma}
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link to="/hong-hoc"><ArrowLeft className="mr-2 h-4 w-4" /> Hỏng hóc</Link>
            </Button>
            {sc && (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link to="/su-co/$maSuCo" params={{ maSuCo: sc.ma_su_co }}>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Sự cố {sc.ma_su_co}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          <KpiCard icon={CalendarClock} label="Ngày phát hiện" value={h.ngay_hong} />
          <KpiCard icon={CalendarClock} label="Ngày hoàn thành" value={h.ngay_hoan_thanh ?? "—"} />
          <KpiCard icon={DollarSign} label="Chi phí" value={`${fmtVND(h.chi_phi)} đ`} />
          <KpiCard icon={Users} label="Đơn vị thực hiện" value={h.don_vi_thuc_hien} />
        </div>

        <VongDoiPanel bang={"hong_hoc" as any} id={h.id} trangThaiHienTai={h.trang_thai} />
        <div className="mb-6" />

        <EdgeTabs
          tabs={[
            {
              id: "tong-quan",
              label: "Tổng quan",
              icon: <LayoutList className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Mô tả & Kết quả
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 text-sm space-y-3">
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Mô tả hỏng hóc</div>
                          <p className="mt-1">{h.mo_ta_hong_hoc}</p>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Kết quả xử lý</div>
                          <p className="mt-1 text-muted-foreground">{h.ket_qua ?? "— chưa có —"}</p>
                        </div>
                        {h.file_dinh_kem && (
                          <div className="flex items-center gap-2 text-primary pt-2 border-t border-dashed">
                            <FileText className="h-4 w-4" /><span className="font-mono text-xs">{h.file_dinh_kem}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Người thực hiện
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 space-y-2">
                        {h.nguoi_thuc_hien.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa phân công.</p>}
                        {h.nguoi_thuc_hien.map((nguoi: string) => (
                          <div key={nguoi} className="flex items-center gap-2 rounded-md border p-2 text-sm bg-muted/20">
                            <div className="h-6 w-6 rounded-full bg-secondary grid place-items-center text-[10px] font-bold uppercase">{nguoi.slice(0, 2)}</div>
                            <span className="font-medium">{nguoi}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3 pt-4 px-5">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-primary" />
                        Truy vết tài sản
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <TbCard title="Tài sản hỏng" tb={tb} maFallback={h.thiet_bi_hong} tone="border-red-200 bg-red-50/40" />
                        <div className="hidden justify-center md:flex">
                          <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        </div>
                        {tbThay ? (
                          <TbCard title="Tài sản thay thế" tb={tbThay} maFallback={h.thiet_bi_thay_the ?? ""} tone="border-emerald-200 bg-emerald-50/40" />
                        ) : (
                          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[80px]">
                            <span>Không thay nguyên tài sản</span>
                            <span className="text-[10px] uppercase opacity-60">Chỉ thay linh kiện/sửa chữa</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            },
            {
              id: "vat-tu",
              label: "Vật tư & Tiêu hao",
              icon: <Package className="h-4 w-4" />,
              content: (
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Vật tư đã tiêu hao
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <VatTuTieuHaoView
                      cot="lien_ket_hong_hoc_id"
                      id={h.id}
                      empty={
                        h.vat_tu_su_dung.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Không có vật tư xuất kho cho phiếu này.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <div className="text-xs text-muted-foreground w-full mb-1">Dữ liệu cũ (chưa có bút toán xuất kho):</div>
                            {h.vat_tu_su_dung.map((ma: string) => (
                              <Badge key={ma} variant="secondary" className="gap-1 font-mono text-[10px]">
                                <Package className="h-3 w-3" />{ma}
                              </Badge>
                            ))}
                          </div>
                        )
                      }
                    />
                  </CardContent>
                </Card>
              )
            },
            {
              id: "lich-su",
              label: "Lịch sử hỏng hóc",
              icon: <History className="h-4 w-4" />,
              content: (
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Lịch sử hỏng hóc khác của tài sản</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-24">Mã HH</TableHead>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Bộ phận</TableHead>
                            <TableHead>Phương án</TableHead>
                            <TableHead className="text-right">Chi phí</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatedByTb.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Không có bản ghi khác.</TableCell>
                            </TableRow>
                          ) : relatedByTb.map((x) => (
                            <TableRow key={x.ma_hong_hoc}>
                              <TableCell><Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: x.ma_hong_hoc }} className="font-mono text-xs text-primary hover:underline">{x.ma_hong_hoc}</Link></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{x.ngay_hong}</TableCell>
                              <TableCell className="text-sm">{x.bo_phan_hong}</TableCell>
                              <TableCell><StatusBadge domain="hong_hoc" code={x.phuong_an} label={x.phuong_an} /></TableCell>
                              <TableCell className="text-right text-sm tabular-nums font-mono">{fmtVND(x.chi_phi)}</TableCell>
                              <TableCell><StatusBadge domain="thiet_bi" code={x.trang_thai} label={x.trang_thai} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )
            }
          ]}
        />
      </PageBody>
    </PageFrame>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold truncate leading-tight mb-0.5">{label}</div>
          <div className="text-sm font-bold truncate leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TbCard({ title, tb, maFallback, tone }: { title: string; tb: ThietBi | null | undefined; maFallback: string; tone: string }) {
  return (
    <div className={`rounded-md border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      {tb ? (
        <>
          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="mt-1 block font-medium text-primary hover:underline">{tb.ten}</Link>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="font-mono">{tb.ma_thiet_bi}</span>
            {tb.model && <span className="text-muted-foreground">· {tb.model}{tb.p_n ? ` · ${tb.p_n}` : ""}</span>}
            <Badge variant="secondary" className="text-[10px]">{tb.trang_thai}</Badge>
          </div>
        </>
      ) : (
        <div className="mt-1 font-mono text-sm text-muted-foreground">{maFallback}</div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className="h-5 w-5 text-foreground/70" /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className="text-sm font-semibold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

