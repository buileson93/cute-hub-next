import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, DollarSign, Users, FileText, Package, AlertTriangle } from "lucide-react";
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

export const Route = createFileRoute("/_app/hong-hoc/$maHongHoc")({
  head: () => ({
    meta: [
      { title: "Phiếu hỏng hóc — MIRATS 2.0" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HongHocDetail,
});

import { StatusBadge } from "@/components/mirats/StatusBadge";


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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/hong-hoc"><ArrowLeft className="mr-1 h-4 w-4" />Hỏng hóc</Link></Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <span className="font-mono">{h.ma_hong_hoc}</span>
              <StatusBadge domain="hong_hoc" code={h.phuong_an} label={h.phuong_an} />
              <StatusBadge domain="thiet_bi" code={h.trang_thai} label={h.trang_thai} />
            </h1>
            <p className="text-sm text-muted-foreground">Bộ phận hỏng: <strong>{h.bo_phan_hong}</strong> · {dvo?.ten ?? "—"}</p>
          </div>
        </div>
        {sc && (
          <Button asChild variant="outline" size="sm">
            <Link to="/su-co/$maSuCo" params={{ maSuCo: sc.ma_su_co }}><AlertTriangle className="mr-1 h-4 w-4" />Sự cố liên quan {sc.ma_su_co}</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Info icon={CalendarClock} label="Ngày phát hiện" value={h.ngay_hong} />
        <Info icon={CalendarClock} label="Ngày hoàn thành" value={h.ngay_hoan_thanh ?? "—"} />
        <Info icon={DollarSign} label="Chi phí" value={`${fmtVND(h.chi_phi)} đ`} />
        <Info icon={Users} label="Đơn vị thực hiện" value={h.don_vi_thuc_hien} />
      </div>

      <VongDoiPanel bang="hong_hoc" id={h.id} trangThaiHienTai={h.trang_thai} />


      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Mô tả & Kết quả</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Mô tả hỏng hóc</div>
              <p className="mt-1">{h.mo_ta_hong_hoc}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Kết quả xử lý</div>
              <p className="mt-1 text-muted-foreground">{h.ket_qua ?? "— chưa có —"}</p>
            </div>
            {h.file_dinh_kem && (
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" /><span className="font-mono text-xs">{h.file_dinh_kem}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Người thực hiện</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {h.nguoi_thuc_hien.length === 0 && <p className="text-sm text-muted-foreground">Chưa phân công.</p>}
            {h.nguoi_thuc_hien.map((nguoi: string) => (
              <div key={nguoi} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{nguoi}</span>
              </div>
            ))}
          </CardContent>

        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Truy vết tài sản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <TbCard title="Tài sản hỏng" tb={tb} maFallback={h.thiet_bi_hong} tone="border-red-200 bg-red-50/40" />
            <div className="hidden justify-center md:flex">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            {tbThay ? (
              <TbCard title="Tài sản thay thế" tb={tbThay} maFallback={h.thiet_bi_thay_the ?? ""} tone="border-emerald-200 bg-emerald-50/40" />
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Không thay nguyên tài sản — chỉ thay linh kiện/sửa chữa.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Vật tư đã tiêu hao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <VatTuTieuHaoView
            cot="lien_ket_hong_hoc_id"
            id={h.id}
            empty={
              h.vat_tu_su_dung.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có vật tư xuất kho cho phiếu này.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <div className="text-xs text-muted-foreground w-full">Dữ liệu cũ (chưa có bút toán xuất kho):</div>
                  {h.vat_tu_su_dung.map((ma: string) => (
                    <Badge key={ma} variant="secondary" className="gap-1 font-mono text-xs">
                      <Package className="h-3 w-3" />{ma}
                    </Badge>
                  ))}
                </div>
              )
            }
          />
        </CardContent>
      </Card>


      {relatedByTb.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Lịch sử hỏng hóc khác của tài sản</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã HH</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Bộ phận</TableHead>
                    <TableHead>Phương án</TableHead>
                    <TableHead className="text-right">Chi phí</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedByTb.map((x) => (
                    <TableRow key={x.ma_hong_hoc}>
                      <TableCell><Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: x.ma_hong_hoc }} className="font-mono text-xs text-primary hover:underline">{x.ma_hong_hoc}</Link></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{x.ngay_hong}</TableCell>
                      <TableCell className="text-sm">{x.bo_phan_hong}</TableCell>
                      <TableCell><StatusBadge domain="hong_hoc" code={x.phuong_an} label={x.phuong_an} /></TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{fmtVND(x.chi_phi)}</TableCell>
                      <TableCell><StatusBadge domain="thiet_bi" code={x.trang_thai} label={x.trang_thai} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TbCard({ title, tb, maFallback, tone }: { title: string; tb: ThietBi | null | undefined; maFallback: string; tone: string }) {
  return (
    <div className={`rounded-md border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      {tb ? (
        <>
          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} search={{ tab: "tong-quan" }} className="mt-1 block font-medium text-primary hover:underline">{tb.ten}</Link>
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

