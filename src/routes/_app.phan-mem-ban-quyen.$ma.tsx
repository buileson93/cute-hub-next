import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KeyRound,
  ShieldCheck,
  Clock,
  Wallet,
  PieChart,
  Info,
  ArrowLeft,
  Calendar,
  Building2,
  Tag,
  FileText,
  History,
  Laptop,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  useBanQuyenDetail,
  dinhDangTien,
  STATUS_LABEL,
  STATUS_CLASS,
  useCapPhatListUnified,
} from "@/lib/mirats/ban-quyen";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  logBanQuyenAudit,
  useBanQuyenTep,
  useBanQuyenAudit,
  useUploadBanQuyenTep,
  type BanQuyenTep,
} from "@/lib/mirats/ban-quyen-detail";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { BanQuyenFormDialog } from "@/components/mirats/BanQuyenFormDialog";
import { BanQuyenCapPhatDialog } from "@/components/mirats/BanQuyenCapPhatDialog";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/_app/phan-mem-ban-quyen/$ma")({
  head: ({ params }) => ({
    meta: [
      { title: `Bản quyền ${params.ma} — MIRATS` },
      { name: "description", content: `Chi tiết bản quyền phần mềm ${params.ma}` },
    ],
  }),
  component: BanQuyenDetailView,
});

function BanQuyenDetailView() {
  const { ma } = Route.useParams();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const { data: bq, isLoading, refetch } = useBanQuyenDetail(ma || "");
  const { data: capPhats = [] } = useCapPhatListUnified({ banQuyenId: bq?.id || "" });
  const { data: teps = [] } = useBanQuyenTep(bq?.id || "");
  const { data: logs = [] } = useBanQuyenAudit(bq?.id || "");
  const upFile = useUploadBanQuyenTep(bq?.id || "");

  const [showKey, setShowKey] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [capPhatOpen, setCapPhatOpen] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);

  const maskKey = (key: string | null) => {
    if (!key) return "—";
    if (showKey) return key;
    if (key.length <= 8) return "********";
    return `${key.slice(0, 4)}-****-****-${key.slice(-4)}`;
  };

  const handleToggleKey = async () => {
    if (!showKey && canManage && bq) {
      await logBanQuyenAudit(bq.id, "VIEW_LICENSE_KEY", `Xem License Key của ${bq.ten_phan_mem}`);
      setShowKey(true);
      toast.success("License Key đã được hiển thị và ghi log truy cập.");
    } else {
      setShowKey(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Đang tải chi tiết bản quyền…</div>
    );
  if (!bq)
    return (
      <div className="p-8 text-center text-red-500 font-bold">Không tìm thấy bản quyền mã {ma}</div>
    );

  const seatsPct = bq.so_ghe ? Math.round((bq.gheDaDung / bq.so_ghe) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/phan-mem-ban-quyen">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight truncate">{bq.ten_phan_mem}</h1>
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-bold uppercase", STATUS_CLASS[bq.status])}
            >
              {STATUS_LABEL[bq.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{ma}</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setCapPhatOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Cấp phát mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          icon={ShieldCheck}
          label="Số ghế sử dụng"
          value={`${bq.gheDaDung}/${bq.so_ghe ?? "∞"}`}
          subValue={`${seatsPct}% công suất`}
        />
        <KpiCard
          icon={Clock}
          label="Thời hạn còn lại"
          value={bq.soNgayConLai !== null ? `${bq.soNgayConLai} ngày` : "Vĩnh viễn"}
          subValue={bq.ngay_het_han || "Không thời hạn"}
        />
        <KpiCard
          icon={Wallet}
          label="Giá trị"
          value={dinhDangTien(bq.gia_tri)}
          subValue={`Hợp đồng: ${bq.so_hop_dong || "—"}`}
        />
        <KpiCard
          icon={Tag}
          label="Phân loại"
          value={bq.loaiTen || "—"}
          subValue={bq.nha_phat_hanh || "—"}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="assignment" className="gap-2">
            <Laptop className="h-4 w-4" /> Cấp phát ({bq.gheDaDung})
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="h-4 w-4" /> Tệp đính kèm ({teps.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Nhật ký
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Thông tin bản quyền</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <InfoItem label="Nhà phát hành" value={bq.nha_phat_hanh} icon={Building2} />
                <InfoItem label="Phiên bản" value={bq.phien_ban} icon={Tag} />
                <InfoItem label="Ngày mua" value={bq.ngay_mua} icon={Calendar} />
                <InfoItem label="Ngày bắt đầu hiệu lực" value={bq.ngay_bat_dau} icon={Calendar} />
                <InfoItem label="Nhà cung cấp" value={bq.nccTen} icon={Building2} />
                <InfoItem label="Đơn vị quản lý" value={bq.donViTen} icon={Building2} />

                <div className="sm:col-span-2 pt-2 border-t mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5" /> License Key
                    </span>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px]"
                        onClick={handleToggleKey}
                      >
                        {showKey ? (
                          <EyeOff className="mr-1 h-3 w-3" />
                        ) : (
                          <Eye className="mr-1 h-3 w-3" />
                        )}
                        {showKey ? "Ẩn Key" : "Hiện Key"}
                      </Button>
                    )}
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg font-mono text-sm break-all border border-dashed select-all">
                    {maskKey(bq.license_key)}
                  </div>
                </div>

                {bq.ghi_chu && (
                  <div className="sm:col-span-2 pt-2 border-t mt-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                      Ghi chú
                    </span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {bq.ghi_chu}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" /> Sử dụng ghế
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black tabular-nums">
                      {bq.gheDaDung}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        / {bq.so_ghe ?? "∞"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        seatsPct >= 90 ? "text-red-500" : "text-emerald-500",
                      )}
                    >
                      {seatsPct}%
                    </span>
                  </div>
                  <Progress
                    value={seatsPct}
                    className="h-2"
                    indicatorClassName={seatsPct >= 90 ? "bg-red-500" : "bg-emerald-500"}
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    {bq.so_ghe
                      ? `Hệ thống còn trống ${bq.so_ghe - bq.gheDaDung} ghế bản quyền cho thiết bị mới.`
                      : "Bản quyền này không giới hạn số lượng thiết bị cài đặt."}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex gap-3">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-primary">Hướng dẫn vận hành</div>
                    <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                      Để đảm bảo an toàn thông tin, không chia sẻ License Key trực tiếp. Hãy sử dụng
                      tính năng "Cấp phát" để gán bản quyền cho đúng mã tài sản.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignment" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <StandardTable
                tableKey="bq_assignment"
                rows={capPhats}
                getRowId={(r) => r.id}
                columns={[
                  {
                    key: "thiet_bi",
                    label: "Thiết bị",
                    cell: (r: any) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{r.maThietBi || "—"}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {r.tenThietBi}
                        </span>
                      </div>
                    ),
                  },
                  { key: "ngay_cai_dat", label: "Ngày cài đặt", value: (r: any) => r.ngay_cai_dat },
                  { key: "nguoi_cai", label: "Người cài", value: (r: any) => r.nguoi_cai || "—" },
                  {
                    key: "trang_thai",
                    label: "Trạng thái",
                    cell: (r: any) => (
                      <Badge
                        variant={r.ngay_thu_hoi ? "secondary" : "default"}
                        className="text-[9px] uppercase"
                      >
                        {r.ngay_thu_hoi ? "Đã thu hồi" : "Đang sử dụng"}
                      </Badge>
                    ),
                  },
                  {
                    key: "ngay_thu_hoi",
                    label: "Ngày thu hồi",
                    value: (r: any) => r.ngay_thu_hoi || "—",
                  },
                  {
                    key: "actions",
                    label: "Thao tác",
                    align: "right",
                    cell: (r: any) => (
                      <div className="flex justify-end gap-1">
                        {!r.ngay_thu_hoi && canManage && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] text-red-500 hover:text-red-600"
                            onClick={async () => {
                              if (
                                !confirm("Bạn có chắc chắn muốn thu hồi bản quyền này từ thiết bị?")
                              )
                                return;
                              const { error } = await supabase
                                .from("phan_mem_ban_quyen_cap_phat")
                                .update({ ngay_thu_hoi: new Date().toISOString() })
                                .eq("id", r.id);
                              if (error) toast.error("Lỗi: " + error.message);
                              else {
                                toast.success("Đã thu hồi bản quyền thành công.");
                                refetch();
                              }
                            }}
                          >
                            Thu hồi
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link
                            to="/thiet-bi/$maThietBi"
                            params={{ maThietBi: r.maThietBi }}
                            search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Hồ sơ & Tài liệu</CardTitle>
                <CardDescription className="text-xs">
                  Hợp đồng, chứng nhận bản quyền, hướng dẫn sử dụng.
                </CardDescription>
              </div>
              {canManage && (
                <div className="relative">
                  <Button size="sm" variant="outline" className="relative overflow-hidden">
                    <Plus className="mr-2 h-4 w-4" /> Tải lên tài liệu
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const loai = prompt(
                          "Nhập loại tài liệu (VD: Hợp đồng, Chứng nhận...):",
                          "Tài liệu",
                        );
                        if (loai) await upFile.mutateAsync({ file, loai });
                      }}
                    />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <StandardTable
                tableKey="bq_files"
                rows={teps}
                getRowId={(r) => r.id}
                columns={[
                  {
                    key: "ten_tep",
                    label: "Tên tệp",
                    cell: (r: any) => (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{r.ten_tep}</span>
                      </div>
                    ),
                  },
                  { key: "loai_tep", label: "Loại", value: (r: any) => r.loai_tep || "—" },
                  {
                    key: "created_at",
                    label: "Ngày tải lên",
                    value: (r: any) => new Date(r.created_at).toLocaleDateString("vi-VN"),
                  },
                  {
                    key: "actions",
                    label: "Thao tác",
                    align: "right",
                    cell: (r: any) => (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Xem"
                          onClick={() => setViewer({ url: r.url, name: r.ten_tep })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Tải xuống"
                          asChild
                        >
                          <a href={r.url} download={r.ten_tep} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Xóa"
                            onClick={async () => {
                              if (!confirm("Xóa tệp này?")) return;
                              const { error } = await supabase
                                .from("phan_mem_ban_quyen_tep" as any)
                                .delete()
                                .eq("id", r.id);
                              if (error) toast.error(error.message);
                              else {
                                toast.success("Đã xóa tệp");
                                refetch();
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch sử tác động</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StandardTable
                tableKey="bq_audit"
                rows={logs}
                getRowId={(r) => r.id}
                columns={[
                  {
                    key: "created_at",
                    label: "Thời gian",
                    value: (r: any) => new Date(r.created_at).toLocaleString("vi-VN"),
                  },
                  {
                    key: "action",
                    label: "Hành động",
                    cell: (r: any) => (
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {r.action}
                      </Badge>
                    ),
                  },
                  { key: "detail", label: "Chi tiết", value: (r: any) => r.detail || "—" },
                  {
                    key: "user_id",
                    label: "Người thực hiện",
                    value: (r: any) => r.user?.email || r.user_id || "System",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BanQuyenFormDialog open={formOpen} onOpenChange={setFormOpen} row={bq} />
      <BanQuyenCapPhatDialog
        open={capPhatOpen}
        onOpenChange={setCapPhatOpen}
        banQuyen={bq}
        canManage={canManage}
      />

      {viewer && (
        <DocViewerDialog
          open={!!viewer}
          onOpenChange={(v) => !v && setViewer(null)}
          url={viewer.url}
          fileName={viewer.name}
        />
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
            {label}
          </div>
          <div className="text-lg font-black tracking-tight truncate">{value}</div>
          {subValue && (
            <div className="text-[10px] font-medium text-muted-foreground truncate">{subValue}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: any;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}
