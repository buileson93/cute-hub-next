import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { 
  ArrowLeft, Wrench, CalendarClock, Users, FileText, CheckCircle2, XCircle, MinusCircle,
  LayoutList, ClipboardCheck, History, Info, Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DetailLayout, DetailCard, DetailInfoGrid } from "@/components/mirats/DetailLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/bao-tri/$maBaoTri")({
  head: () => ({
    meta: [
      { title: "Phiếu bảo dưỡng — MIRATS 2.0" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BaoTriDetail,
});

const loaiColor: Record<string, string> = {
  "Định kỳ": "bg-sky-100 text-sky-700",
  "Đột xuất": "bg-amber-100 text-amber-700",
  "Hiệu chuẩn": "bg-violet-100 text-violet-700",
  "Nâng cấp": "bg-emerald-100 text-emerald-700",
};
const ttColor: Record<string, string> = {
  "Kế hoạch": "bg-slate-100 text-slate-700",
  "Đang thực hiện": "bg-amber-100 text-amber-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Hoãn": "bg-red-100 text-red-700",
};
const kqIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  "Đạt": CheckCircle2,
  "Không đạt": XCircle,
  "N/A": MinusCircle,
};
const kqColor: Record<string, string> = {
  "Đạt": "text-emerald-600",
  "Không đạt": "text-red-600",
  "N/A": "text-muted-foreground",
};

interface HangMuc { id: string; ten_hang_muc: string; gia_tri_do: string; tieu_chuan: string; ket_qua: string; ghi_chu: string; }

function BaoTriDetail() {
  const { maBaoTri } = Route.useParams();
  const { baoTri, thietBi, heThong, donVi, inScope, loading } = useScope();

  const bt = useMemo(() => baoTri.find((x) => x.ma_bao_tri === maBaoTri), [baoTri, maBaoTri]);
  const tb = useMemo(() => thietBi.find((t) => t.ma_thiet_bi === bt?.thiet_bi), [thietBi, bt]);
  const ht = useMemo(() => heThong.find((h) => h.ma === bt?.he_thong), [heThong, bt]);
  const dvo = useMemo(() => donVi.find((d) => d.ma === bt?.don_vi), [donVi, bt]);
  const other = useMemo(
    () => (bt ? baoTri.filter((x) => x.thiet_bi === bt.thiet_bi && x.ma_bao_tri !== bt.ma_bao_tri).slice(0, 8) : []),
    [baoTri, bt],
  );
  // Checklist hạng mục chưa có bảng CSDL riêng — để trống cho tới khi triển khai.
  const hangMuc: HangMuc[] = [];
  const kqCount = hangMuc.reduce((a, h) => { a[h.ket_qua] = (a[h.ket_qua] ?? 0) + 1; return a; }, {} as Record<string, number>);

  if (loading) return <div className="rounded-md border p-8 text-center text-muted-foreground">Đang tải…</div>;
  if (!bt) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <h1 className="text-lg font-semibold">Không tìm thấy phiếu {maBaoTri}</h1>
        <Button asChild className="mt-4"><Link to="/bao-tri">Quay lại danh sách</Link></Button>
      </div>
    );
  }
  if (!inScope(bt.don_vi)) return <AccessDenied backTo="/bao-tri" backLabel="Về danh sách bảo dưỡng" />;


  return (
    <DetailLayout
      title={bt.ma_bao_tri}
      subtitle={bt.mo_ta_cong_viec}
      headerIcon={<Wrench className="h-6 w-6 text-primary" />}
      badges={[
        { label: bt.loai_bao_tri, className: loaiColor[bt.loai_bao_tri] },
        { label: bt.trang_thai, className: ttColor[bt.trang_thai] }
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/bao-tri"><ArrowLeft className="mr-2 h-4 w-4" /> Bảo dưỡng</Link>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <FileText className="mr-2 h-4 w-4" /> In biên bản
          </Button>
        </div>
      }
      kpiCards={
        <>
          <InfoCard icon={CalendarClock} label="Ngày bắt đầu" value={bt.ngay_bat_dau} />
          <InfoCard icon={CalendarClock} label="Ngày hoàn thành" value={bt.ngay_hoan_thanh ?? "—"} />
          <InfoCard icon={Wrench} label="Đơn vị thực hiện" value={bt.don_vi_thuc_hien} />
          <InfoCard icon={Users} label="Nhân sự" value={`${bt.nguoi_thuc_hien.length} người`} />
        </>
      }
      tabs={[
        {
          id: "tong-quan",
          label: "Tổng quan",
          icon: <LayoutList className="h-4 w-4" />,
          content: (
            <DetailInfoGrid>
              <DetailCard title="Thông tin phiếu" icon={Info}>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Đơn vị quản lý</div>
                    <div className="font-medium">{dvo?.ten ?? bt.don_vi}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Hệ thống</div>
                    <div className="font-medium">{ht?.ten ?? bt.he_thong}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Tài sản</div>
                    {tb ? (
                      <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} className="text-primary hover:underline font-medium">
                        {tb.ma_thiet_bi} — {tb.ten}
                      </Link>
                    ) : <span className="font-medium">{bt.thiet_bi}</span>}
                  </div>
                  {bt.ke_hoach && (
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">Sinh từ kế hoạch</div>
                      <div className="font-mono">{bt.ke_hoach}</div>
                    </div>
                  )}
                </div>
              </DetailCard>

              <DetailCard title="Nội dung & Kết quả" icon={ClipboardCheck} className="md:col-span-2">
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Mô tả công việc</div>
                    <div className="rounded-md border bg-muted/30 p-3">{bt.mo_ta_cong_viec}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Kết quả xử lý</div>
                    <div className="rounded-md border bg-muted/30 p-3">
                      {bt.ket_qua || "— chưa có nội dung kết quả —"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs uppercase text-muted-foreground">Nhân sự thực hiện:</div>
                      <div className="flex -space-x-2">
                        {bt.nguoi_thuc_hien.map((n: string) => (
                          <div key={n} title={n} className="h-7 w-7 rounded-full border-2 border-background bg-secondary grid place-items-center text-[10px] font-bold uppercase">
                            {n.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {bt.file_bien_ban && (
                      <div className="flex items-center gap-2 text-primary ml-auto">
                        <FileText className="h-4 w-4" />
                        <span className="font-mono text-xs underline cursor-pointer">{bt.file_bien_ban}</span>
                      </div>
                    )}
                  </div>
                </div>
              </DetailCard>
            </DetailInfoGrid>
          )
        },
        {
          id: "checklist",
          label: "Hạng mục kiểm tra",
          icon: <ClipboardCheck className="h-4 w-4" />,
          content: (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Bảng Checklist ({hangMuc.length})</CardTitle>
                  <div className="flex gap-2">
                    {Object.entries(kqCount).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className={cn("text-[10px]", kqColor[k])}>{k}: {v}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Hạng mục</TableHead>
                        <TableHead>Giá trị đo</TableHead>
                        <TableHead>Tiêu chuẩn</TableHead>
                        <TableHead>Kết quả</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hangMuc.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Chưa có dữ liệu checklist hạng mục.
                          </TableCell>
                        </TableRow>
                      ) : hangMuc.map((h) => {
                        const Icon = kqIcon[h.ket_qua] ?? MinusCircle;
                        return (
                          <TableRow key={h.id}>
                            <TableCell><Icon className={cn("h-4 w-4", kqColor[h.ket_qua])} /></TableCell>
                            <TableCell className="font-medium">{h.ten_hang_muc}</TableCell>
                            <TableCell className="text-sm tabular-nums">{h.gia_tri_do || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{h.tieu_chuan || "—"}</TableCell>
                            <TableCell><Badge variant="secondary" className={cn("text-[10px]", kqColor[h.ket_qua])}>{h.ket_qua}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{h.ghi_chu || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        },
        {
          id: "lich-su",
          label: "Lịch sử thiết bị",
          icon: <History className="h-4 w-4" />,
          content: (
            <Card>
              <CardHeader><CardTitle className="text-sm">Lịch sử bảo dưỡng gần đây của tài sản</CardTitle></CardHeader>
              <CardContent className="p-0 border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Mã phiếu</TableHead>
                      <TableHead>Ngày thực hiện</TableHead>
                      <TableHead>Loại hình</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {other.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Không có bản ghi khác.</TableCell>
                      </TableRow>
                    ) : other.map((x) => (
                      <TableRow key={x.ma_bao_tri}>
                        <TableCell><Link to="/bao-tri/$maBaoTri" params={{ maBaoTri: x.ma_bao_tri }} className="font-mono text-xs text-primary hover:underline">{x.ma_bao_tri}</Link></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{x.ngay_bat_dau}</TableCell>
                        <TableCell><Badge variant="secondary" className={cn("text-[10px]", loaiColor[x.loai_bao_tri])}>{x.loai_bao_tri}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className={cn("text-[10px]", ttColor[x.trang_thai])}>{x.trang_thai}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        }
      ]}
    />
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className="h-5 w-5 text-foreground/70" /></div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className="text-sm font-semibold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}


