import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/backend/client";
import { useQuery } from "@tanstack/react-query";
import { fetchAllRows } from "@/lib/mirats/paginate";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  component: ThietBiDetailRoute,
});

function ThietBiDetailRoute() {
  const { maThietBi: ma } = Route.useParams();

  const { data: tb, isLoading } = useQuery({
    queryKey: ["thiet-bi", ma],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select(`
          *,
          loai:loai_thiet_bi_id(ten),
          model_rel:model_id(ten, hang_san_xuat, p_n),
          trang_thai:trang_thai_id(ma, ten),
          don_vi:don_vi_quan_ly_id(ten, ma)
        `)
        .eq("ma_thiet_bi", ma)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const vt = useQuery({
    queryKey: ["vai-tro-thiet-bi", tb?.id],
    enabled: !!tb?.id,
    queryFn: async () => {
      const rows = await fetchAllRows<{
        thanh_phan: { id: string; ten: string; he_thong: { id: string; ten: string } | null } | null;
      }>((from, to) =>
        supabase
          .from("gan_chuc_nang")
          .select("thanh_phan:thanh_phan_id(id, ten, he_thong:he_thong_id(id, ten))")
          .eq("thiet_bi_id", tb!.id)
          .is("den_ngay", null)
          .range(from, to)
      );
      return rows.map((r) => r.thanh_phan).filter(Boolean);
    },
  });

  if (isLoading) return <DetailSkeleton />;
  if (!tb) return <div>Không tìm thấy tài sản.</div>;

  const pct = tb.ty_le_tuoi_tho == null ? null : Math.max(0, Math.min(100, Math.round(tb.ty_le_tuoi_tho)));

  return (
    <PageBody>
      <PageHeader
        icon={Package}
        title={tb.ten_thiet_bi || tb.ma_thiet_bi}
        description={
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[10px] font-normal">Tài sản</Badge>
             <span className="text-muted-foreground">/</span>
             <span className="text-muted-foreground">{tb.ma_thiet_bi}</span>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <StatusBadge domain="thiet_bi" code={tb.trang_thai?.ma} />
          {tb.ma_serial && <Badge variant="secondary" className="font-mono">S/N: {tb.ma_serial}</Badge>}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Thông tin kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoItem label="Mã tài sản" value={tb.ma_thiet_bi} bold />
              <InfoItem label="Chủng loại" value={tb.loai?.ten} />
              <InfoItem label="Model" value={tb.model_rel?.ten || tb.model} />
              <InfoItem label="P/N" value={tb.model_rel?.p_n || tb.p_n} />
              <InfoItem label="Hãng sản xuất" value={tb.model_rel?.hang_san_xuat || tb.nha_san_xuat} />
              <InfoItem label="Năm sản xuất" value={tb.nam_san_xuat} />
            </CardContent>
          </Card>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Lịch sử khai thác</TabsTrigger>
              <TabsTrigger value="roles">Vai trò hệ thống</TabsTrigger>
              <TabsTrigger value="docs">Tài liệu</TabsTrigger>
            </TabsList>
            <TabsContent value="roles" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {vt.isLoading ? <Skeleton className="h-20 w-full" /> : 
                   vt.data?.length ? (
                    <div className="space-y-3">
                      {vt.data.map(v => (
                        <div key={v!.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{v!.ten}</div>
                            <div className="text-xs text-muted-foreground">{v!.he_thong?.ten}</div>
                          </div>
                          <Badge variant="outline">Đang lắp</Badge>
                        </div>
                      ))}
                    </div>
                   ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm italic">Tài sản chưa được gán vào thành phần hệ thống nào.</div>
                   )
                  }
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tình trạng & Tuổi thọ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pct !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Đã sử dụng</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )}
              <InfoItem label="Đơn vị quản lý" value={tb.don_vi?.ten} />
              <InfoItem label="Năm SD" value={tb.nam_dua_vao_khai_thac} />
              <InfoItem label="Hạn dùng" value={tb.so_nam_su_dung ? `${tb.so_nam_su_dung} năm` : "—"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageBody>
  );
}

function InfoItem({ label, value, bold }: { label: string; value: any; bold?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm ${bold ? "font-bold" : ""}`}>{value || "—"}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <PageBody>
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </PageBody>
  );
}
