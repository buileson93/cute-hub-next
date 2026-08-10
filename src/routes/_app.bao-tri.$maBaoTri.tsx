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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/bao-tri"><ArrowLeft className="mr-1 h-4 w-4" />Bảo dưỡng</Link></Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <span className="font-mono">{bt.ma_bao_tri}</span>
              <Badge variant="secondary" className={loaiColor[bt.loai_bao_tri]}>{bt.loai_bao_tri}</Badge>
              <Badge variant="secondary" className={ttColor[bt.trang_thai]}>{bt.trang_thai}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{ht?.ten ?? bt.he_thong} · {dvo?.ten ?? bt.don_vi}</p>
          </div>
        </div>
        {tb && (
          <Button asChild variant="outline" size="sm">
            <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }}>Mở hồ sơ tài sản</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Info icon={CalendarClock} label="Ngày bắt đầu" value={bt.ngay_bat_dau} />
        <Info icon={CalendarClock} label="Ngày hoàn thành" value={bt.ngay_hoan_thanh ?? "—"} />
        <Info icon={Wrench} label="Đơn vị thực hiện" value={bt.don_vi_thuc_hien} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nội dung công việc</CardTitle>
            {bt.ke_hoach && <CardDescription>Sinh từ kế hoạch <span className="font-mono">{bt.ke_hoach}</span></CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Mô tả</div>
              <p className="mt-1">{bt.mo_ta_cong_viec}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Kết quả</div>
              <p className="mt-1 text-muted-foreground">{bt.ket_qua ?? "— chưa có kết quả —"}</p>
            </div>
            {bt.file_bien_ban && (
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" />
                <span className="font-mono text-xs">{bt.file_bien_ban}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Người thực hiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bt.nguoi_thuc_hien.length === 0 && <p className="text-sm text-muted-foreground">Chưa phân công.</p>}
            {bt.nguoi_thuc_hien.map((nguoi: string) => (
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
          <div className="flex items-end justify-between">
            <div>
              <CardTitle className="text-base">Checklist hạng mục</CardTitle>
            </div>
            <div className="flex gap-2 text-xs">
              {Object.entries(kqCount).map(([k, v]) => (
                <Badge key={k} variant="secondary" className={kqColor[k]}>{k}: {v}</Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Giá trị đo</TableHead>
                  <TableHead>Tiêu chuẩn</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hangMuc.map((h) => {
                  const Icon = kqIcon[h.ket_qua] ?? MinusCircle;
                  return (
                    <TableRow key={h.id}>
                      <TableCell><Icon className={`h-4 w-4 ${kqColor[h.ket_qua] ?? ""}`} /></TableCell>
                      <TableCell className="font-medium">{h.ten_hang_muc}</TableCell>
                      <TableCell className="text-sm tabular-nums">{h.gia_tri_do || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{h.tieu_chuan || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className={kqColor[h.ket_qua]}>{h.ket_qua}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.ghi_chu || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {tb && other.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử bảo dưỡng khác của {tb.ten}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã BT</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {other.map((x) => (
                    <TableRow key={x.ma_bao_tri}>
                      <TableCell><Link to="/bao-tri/$maBaoTri" params={{ maBaoTri: x.ma_bao_tri }} className="font-mono text-xs text-primary hover:underline">{x.ma_bao_tri}</Link></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{x.ngay_bat_dau}</TableCell>
                      <TableCell><Badge variant="secondary" className={loaiColor[x.loai_bao_tri]}>{x.loai_bao_tri}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className={ttColor[x.trang_thai]}>{x.trang_thai}</Badge></TableCell>
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

