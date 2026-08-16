import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { HardDrive, AlertTriangle, Settings, FileText, ChevronRight, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/q/$maThietBi")({
  component: ThietBiQuickViewRoute,
});

function ThietBiQuickViewRoute() {
  const { maThietBi: ma } = Route.useParams();
  const navigate = useNavigate();
  const { data: taxonomy, isLoading: taxLoading } = useDbTaxonomy();
  const asset = taxonomy?.devices.find((d) => d.ma_thiet_bi === ma);

  const { ops, isLoading: opsLoading } = useOperationsData();
  const { suCo, baoTri, hongHoc } = ops;
  
  const filteredSuCo = suCo.filter(s => s.thiet_bi === ma || s.thiet_bi_id === asset?.id);
  const filteredBaoTri = baoTri.filter(b => b.thiet_bi === ma || b.thiet_bi_id === asset?.id);
  const filteredHongHoc = hongHoc.filter(h => h.thiet_bi_hong === ma || h.thiet_bi_hong_id === asset?.id);

  const isLoading = taxLoading || opsLoading;

  if (isLoading) {
    return (
      <PageBody>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </PageBody>
    );
  }

  if (!asset) {
    return (
      <PageBody>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy</AlertTitle>
          <AlertDescription>
            Tài sản mã "{ma}" không tồn tại trong hệ thống.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate({ to: "/" })}>Quay lại trang chủ</Button>
        </div>
      </PageBody>
    );
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <PageHeader 
          title={asset.ten}
          icon={HardDrive}
          subtitle={asset.ma_thiet_bi}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Trạng thái</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{asset.trang_thai || "—"}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Sự cố mới nhất</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{filteredSuCo.length}</span>
              <span className="text-xs text-muted-foreground">lần</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Bảo trì gần đây</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{filteredBaoTri.length}</span>
              <span className="text-xs text-muted-foreground">đợt</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Hỏng hóc/Thay thế</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{filteredHongHoc.length}</span>
              <span className="text-xs text-muted-foreground">ca</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Lịch sử vận hành
                </h3>
                <Link 
                  to="/thiet-bi/$maThietBi" 
                  params={{ maThietBi: asset.ma_thiet_bi }} 
                  search={{ tab: "van-hanh", doc: undefined, q: undefined }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-0">
                {filteredSuCo.length === 0 && filteredBaoTri.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground italic">
                    Chưa có ghi nhận lịch sử vận hành
                  </div>
                ) : (
                  <div className="divide-y">
                    {[...filteredSuCo, ...filteredBaoTri]
                      .sort((a, b) => new Date((b as any).ngay_phat_hien || (b as any).ngay_bat_dau).getTime() - new Date((a as any).ngay_phat_hien || (a as any).ngay_bat_dau).getTime())
                      .slice(0, 5)
                      .map((item, idx) => {
                        const isSuCo = 'ma_su_co' in item;
                        return (
                          <div key={idx} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                            <div className={cn(
                              "mt-1 p-1 rounded-full",
                              isSuCo ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {isSuCo ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold truncate">
                                  {isSuCo ? (item as any).hien_tuong : (item as any).mo_ta_cong_viec}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {isSuCo ? (item as any).ngay_phat_hien : (item as any).ngay_bat_dau}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {isSuCo ? 'Sự cố' : 'Bảo trì'} · {isSuCo ? (item as any).muc_do : (item as any).loai_bao_tri}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Hồ sơ tài sản
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</span>
                    <p className="text-xs font-medium truncate">{asset.model || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Serial</span>
                    <p className="text-xs font-medium truncate">{asset.serial || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hệ thống</span>
                    <p className="text-xs font-medium truncate">{asset._htTen || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vị trí</span>
                    <p className="text-xs font-medium truncate">{asset.vi_tri || "—"}</p>
                  </div>
                </div>
                
                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full justify-start text-[11px] h-8">
                    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: asset.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
                      <HardDrive className="mr-2 h-3 w-3" /> Chi tiết tài sản
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start text-[11px] h-8">
                    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: asset.ma_thiet_bi }} search={{ tab: "ho-so", doc: undefined, q: undefined }}>
                      <FileText className="mr-2 h-3 w-3" /> Hồ sơ kỹ thuật
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
