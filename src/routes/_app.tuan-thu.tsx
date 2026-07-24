import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/mirats/EmptyState";

/**
 * N5 — Trang Tuân thủ: tổng hợp cảnh báo hết hạn (bảo hành / giấy phép /
 * kiểm định / hiệu chuẩn) đọc từ bảng `thong_bao` (do job scan sinh ra).
 */
export const Route = createFileRoute("/_app/tuan-thu")({
  head: () => ({
    meta: [
      { title: "Tuân thủ — Cảnh báo hết hạn | MIRATS" },
      {
        name: "description",
        content: "Bảng điều khiển tuân thủ: sắp hết hạn, quá hạn, đã xử lý theo đơn vị và loại.",
      },
      { property: "og:title", content: "Tuân thủ — Cảnh báo hết hạn | MIRATS" },
      {
        property: "og:description",
        content: "Tổng hợp cảnh báo giấy phép, kiểm định, hiệu chuẩn, bảo hành theo đơn vị.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TuanThuPage,
});

const LOAI_LABEL: Record<string, string> = {
  bao_hanh: "Bảo hành",
  giay_phep: "Giấy phép",
  chung_chi_kd: "Kiểm định",
  chung_chi_hc: "Hiệu chuẩn",
};

const MUC_DO_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
  overdue: "bg-red-600 text-white",
};

function TuanThuPage() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["tuan-thu", "thong-bao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thong_bao")
        .select("id,loai,muc_do,nguong,tieu_de,noi_dung,den_han_at,don_vi_id,da_doc,created_at")
        .order("den_han_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = data?.length ?? 0;
  const byMuc = {
    overdue: data?.filter((d) => d.muc_do === "overdue").length ?? 0,
    critical: data?.filter((d) => d.muc_do === "critical").length ?? 0,
    warning: data?.filter((d) => d.muc_do === "warning").length ?? 0,
    info: data?.filter((d) => d.muc_do === "info").length ?? 0,
  };
  const daXuLy = data?.filter((d) => d.da_doc).length ?? 0;

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        icon={ShieldCheck}
        title="Tuân thủ"
        help="Cảnh báo hết hạn theo ngưỡng 30/15/7 ngày (nguồn: bảng thông báo)."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? "Đang tải…" : "Tải lại"}
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard title="Tổng cảnh báo" value={total} icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard
          title="Quá hạn"
          value={byMuc.overdue}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          tone="critical"
        />
        <KpiCard
          title="Nguy cấp (≤7 ngày)"
          value={byMuc.critical}
          icon={<Clock className="h-4 w-4 text-red-500" />}
          tone="critical"
        />
        <KpiCard
          title="Cảnh báo (≤15 ngày)"
          value={byMuc.warning}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          title="Đã xử lý"
          value={daXuLy}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách cảnh báo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : error ? (
            <p className="text-sm text-red-600">Lỗi: {(error as Error).message}</p>
          ) : total === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Chưa có cảnh báo"
              description="Hệ thống đang tuân thủ. Chạy job quét (POST /api/public/hooks/scan-canh-bao) để làm mới dữ liệu."
            />
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left">
                    <th className="px-2 py-1">Mức</th>
                    <th className="px-2 py-1">Loại</th>
                    <th className="px-2 py-1">Tiêu đề</th>
                    <th className="px-2 py-1">Hạn</th>
                    <th className="px-2 py-1">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-1">
                        <Badge className={MUC_DO_STYLES[r.muc_do] ?? ""}>{r.muc_do}</Badge>
                      </td>
                      <td className="px-2 py-1">{LOAI_LABEL[r.loai] ?? r.loai}</td>
                      <td className="px-2 py-1">{r.tieu_de}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{r.den_han_at}</td>
                      <td className="px-2 py-1">
                        {r.da_doc ? (
                          <Badge variant="outline">Đã đọc</Badge>
                        ) : (
                          <Badge variant="secondary">Chưa đọc</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Xem chi tiết ở trang <Link to="/thong-bao" className="underline">Thông báo</Link>.
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone?: "critical";
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div
          className={`text-2xl font-bold ${
            tone === "critical" && value > 0 ? "text-red-600" : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
