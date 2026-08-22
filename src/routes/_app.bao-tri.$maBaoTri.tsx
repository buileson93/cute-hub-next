import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  Wrench,
  CalendarClock,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  MinusCircle,
  LayoutList,
  ClipboardCheck,
  History,
  Info as InfoIcon,
  Settings,
  ArrowRight,
  Building2,
  ReplaceIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtVND } from "@/lib/mirats/format";
import type { ThietBi } from "@/lib/mirats/types";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { cn } from "@/lib/utils";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EdgeTabs } from "@/components/mirats/EdgeTabs";
import { VongDoiPanel } from "@/components/mirats/VongDoiPanel";

export const Route = createFileRoute("/_app/bao-tri/$maBaoTri")({
  head: () => ({
    meta: [{ title: "Phiếu bảo dưỡng — MIRATS" }, { name: "robots", content: "noindex" }],
  }),
  component: BaoTriDetail,
});

import { StatusBadge } from "@/components/mirats/StatusBadge";

const kqIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Đạt: CheckCircle2,
  "Không đạt": XCircle,
  "N/A": MinusCircle,
};
const kqColor: Record<string, string> = {
  Đạt: "text-emerald-600",
  "Không đạt": "text-red-600",
  "N/A": "text-muted-foreground",
};

interface HangMuc {
  id: string;
  ten_hang_muc: string;
  gia_tri_do: string;
  tieu_chuan: string;
  ket_qua: string;
  ghi_chu: string;
}

function BaoTriDetail() {
  const { maBaoTri } = Route.useParams();
  const { baoTri, thietBi, heThong, donVi, inScope, loading } = useScope();

  const bt = useMemo(() => baoTri.find((x) => x.ma_bao_tri === maBaoTri), [baoTri, maBaoTri]);
  const tb = useMemo(() => thietBi.find((t) => t.ma_thiet_bi === bt?.thiet_bi), [thietBi, bt]);
  const ht = useMemo(() => heThong.find((h) => h.ma === bt?.he_thong), [heThong, bt]);
  const dvo = useMemo(() => donVi.find((d) => d.ma === bt?.don_vi), [donVi, bt]);
  const other = useMemo(
    () =>
      bt
        ? baoTri
            .filter((x) => x.thiet_bi === bt.thiet_bi && x.ma_bao_tri !== bt.ma_bao_tri)
            .slice(0, 8)
        : [],
    [baoTri, bt],
  );
  // Checklist hạng mục chưa có bảng CSDL riêng — để trống cho tới khi triển khai.
  const hangMuc: HangMuc[] = [];
  const kqCount = hangMuc.reduce(
    (a, h) => {
      a[h.ket_qua] = (a[h.ket_qua] ?? 0) + 1;
      return a;
    },
    {} as Record<string, number>,
  );

  if (loading)
    return <div className="rounded-md border p-8 text-center text-muted-foreground">Đang tải…</div>;
  if (!bt) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <h1 className="text-lg font-semibold">Không tìm thấy phiếu {maBaoTri}</h1>
        <Button asChild className="mt-4">
          <Link to="/bao-tri">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }
  if (!inScope(bt.don_vi))
    return <AccessDenied backTo="/bao-tri" backLabel="Về danh sách bảo dưỡng" />;

  return (
    <PageFrame density="compact">
      <PageHeader
        title={bt.ma_bao_tri}
        subtitle={bt.mo_ta_cong_viec}
        icon={Wrench}
        breadcrumbs={[{ label: "Bảo dưỡng", to: "/bao-tri" }, { label: bt.ma_bao_tri }]}
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge domain="bao_tri" code={bt.loai_bao_tri} label={bt.loai_bao_tri} />
            <StatusBadge domain="thiet_bi" code={bt.trang_thai} label={bt.trang_thai} />
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
              <Link to="/bao-tri">
                <ArrowLeft className="mr-2 h-4 w-4" /> Bảo dưỡng
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8" disabled>
              <FileText className="mr-2 h-4 w-4" /> In biên bản
            </Button>
          </div>
        }
      />

      <PageBody>
        <VongDoiPanel
          bang={"bao_tri" as any}
          id={(bt as any).ma_bao_tri}
          trangThaiHienTai={bt.trang_thai}
        />
        <div className="mb-6" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          <KpiCard icon={CalendarClock} label="Ngày bắt đầu" value={bt.ngay_bat_dau} />
          <KpiCard icon={CalendarClock} label="Ngày hoàn thành" value={bt.ngay_hoan_thanh ?? "—"} />
          <KpiCard icon={Wrench} label="Đơn vị thực hiện" value={bt.don_vi_thuc_hien} />
          <KpiCard icon={Users} label="Nhân sự" value={`${bt.nguoi_thuc_hien.length} người`} />
        </div>

        <EdgeTabs
          tabs={[
            {
              id: "tong-quan",
              label: "Tổng quan",
              icon: <LayoutList className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <InfoIcon className="h-4 w-4 text-primary" />
                          Thông tin phiếu
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 text-sm space-y-3">
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Hệ thống</div>
                          <div className="font-medium">{ht?.ten ?? bt.he_thong}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Tài sản</div>
                          {tb ? (
                            <Link
                              to="/thiet-bi/$maThietBi"
                              params={{ maThietBi: tb.ma_thiet_bi }}
                              search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                              className="text-primary hover:underline font-medium"
                            >
                              {tb.ma_thiet_bi} — {tb.ten}
                            </Link>
                          ) : (
                            <span className="font-medium">{bt.thiet_bi}</span>
                          )}
                        </div>
                        {bt.ke_hoach && (
                          <div>
                            <div className="text-xs uppercase text-muted-foreground">
                              Sinh từ kế hoạch
                            </div>
                            <div className="font-mono text-xs">{bt.ke_hoach}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                          Nội dung & Kết quả
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 text-sm space-y-4">
                        <div>
                          <div className="text-xs uppercase text-muted-foreground mb-1">
                            Mô tả công việc
                          </div>
                          <div className="rounded-md border bg-muted/30 p-3">
                            {bt.mo_ta_cong_viec}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground mb-1">
                            Kết quả xử lý
                          </div>
                          <div className="rounded-md border bg-muted/30 p-3">
                            {bt.ket_qua || "— chưa có nội dung kết quả —"}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Nhân sự:</span>
                            <div className="flex -space-x-2">
                              {bt.nguoi_thuc_hien.map((n: string) => (
                                <div
                                  key={n}
                                  title={n}
                                  className="h-7 w-7 rounded-full border-2 border-background bg-secondary grid place-items-center text-[10px] font-bold uppercase ring-1 ring-border"
                                >
                                  {n.slice(0, 2)}
                                </div>
                              ))}
                            </div>
                          </div>
                          {bt.file_bien_ban && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-primary gap-1 px-2"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="font-mono text-xs underline">
                                {bt.file_bien_ban}
                              </span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ),
            },
            {
              id: "checklist",
              label: "Checklist",
              icon: <ClipboardCheck className="h-4 w-4" />,
              content: (
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold">
                      Bảng Checklist ({hangMuc.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      {Object.entries(kqCount).map(([k, v]) => (
                        <Badge
                          key={k}
                          variant="secondary"
                          className={cn("text-[10px] py-0", kqColor[k])}
                        >
                          {k}: {v}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
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
                              <TableCell
                                colSpan={6}
                                className="h-24 text-center text-muted-foreground italic"
                              >
                                Chưa có dữ liệu checklist hạng mục.
                              </TableCell>
                            </TableRow>
                          ) : (
                            hangMuc.map((h) => {
                              const Icon = kqIcon[h.ket_qua] ?? MinusCircle;
                              return (
                                <TableRow key={h.id}>
                                  <TableCell>
                                    <Icon className={cn("h-4 w-4", kqColor[h.ket_qua])} />
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {h.ten_hang_muc}
                                  </TableCell>
                                  <TableCell className="text-sm tabular-nums font-mono">
                                    {h.gia_tri_do || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {h.tieu_chuan || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className={cn("text-[10px]", kqColor[h.ket_qua])}
                                    >
                                      {h.ket_qua}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {h.ghi_chu || "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ),
            },
            {
              id: "lich-su",
              label: "Lịch sử thiết bị",
              icon: <History className="h-4 w-4" />,
              content: (
                <Card>
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">
                      Lịch sử bảo dưỡng gần đây của tài sản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-32">Mã phiếu</TableHead>
                          <TableHead>Ngày thực hiện</TableHead>
                          <TableHead>Loại hình</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {other.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="h-24 text-center text-muted-foreground italic"
                            >
                              Không có bản ghi khác.
                            </TableCell>
                          </TableRow>
                        ) : (
                          other.map((x) => (
                            <TableRow key={x.ma_bao_tri}>
                              <TableCell>
                                <Link
                                  to="/bao-tri/$maBaoTri"
                                  params={{ maBaoTri: x.ma_bao_tri }}
                                  className="font-mono text-xs text-primary hover:underline"
                                >
                                  {x.ma_bao_tri}
                                </Link>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {x.ngay_bat_dau}
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  domain="bao_tri"
                                  code={x.loai_bao_tri}
                                  label={x.loai_bao_tri}
                                />
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  domain="thiet_bi"
                                  code={x.trang_thai}
                                  label={x.trang_thai}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ),
            },
          ]}
        />
      </PageBody>
    </PageFrame>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted/50">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold truncate">
            {label}
          </div>
          <div className="text-sm font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
