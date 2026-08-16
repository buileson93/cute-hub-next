import { ShieldCheck, Laptop, ExternalLink, Calendar, User, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STATUS_CLASS, STATUS_LABEL, trangThaiBanQuyen } from "@/lib/mirats/ban-quyen";
import { Link } from "@tanstack/react-router";

export function NhanVienSoftwareSheet({
  nhanVienId,
  nhanVienTen,
  open,
  onOpenChange,
}: {
  nhanVienId: string;
  nhanVienTen: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["nhan_vien_assets_software", nhanVienId],
    enabled: open && !!nhanVienId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select(`
          id, ma_thiet_bi, ten_thiet_bi, 
          phan_mem_ban_quyen_cap_phat(
            id, ngay_cai_dat, nguoi_cai, ngay_thu_hoi,
            phan_mem_ban_quyen(id, ten_phan_mem, phien_ban, license_key, ngay_het_han, ma_ban_quyen)
          )
        `)
        .eq("nhan_vien_id" as any, nhanVienId);
      
      if (error) throw error;
      return (data || []).map(tb => ({
        ...tb,
        software: (tb.phan_mem_ban_quyen_cap_phat || [])
          .filter((cp: any) => !cp.ngay_thu_hoi)
          .map((cp: any) => ({
            id: cp.id,
            ngay_cai_dat: cp.ngay_cai_dat,
            nguoi_cai: cp.nguoi_cai,
            ...cp.phan_mem_ban_quyen
          }))
      }));
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Phần mềm đang sử dụng
          </SheetTitle>
          <SheetDescription>
            Danh sách máy tính và bản quyền phần mềm gán cho nhân viên <strong>{nhanVienTen}</strong>.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-muted-foreground italic">
              Đang truy xuất dữ liệu...
            </div>
          ) : assets.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Laptop className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <div className="text-sm text-muted-foreground">Nhân viên này chưa được gán tài sản máy tính nào.</div>
            </div>
          ) : (
            <div className="space-y-6 pb-8">
              {assets.map((asset) => (
                <div key={asset.id} className="rounded-xl border bg-card overflow-hidden">
                  <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{asset.ten_thiet_bi || asset.ma_thiet_bi}</span>
                      <span className="text-meta font-mono text-muted-foreground">· {asset.ma_thiet_bi}</span>
                    </div>
                    <Link 
                      to="/thiet-bi/$maThietBi" 
                      params={{ maThietBi: asset.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                      className="text-meta text-primary hover:underline flex items-center gap-1"
                    >
                      Sổ lý lịch <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  
                  <div className="p-3">
                    {asset.software.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-2">
                        Chưa có bản quyền phần mềm nào được cấp phát cho máy tính này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {asset.software.map((sw: any) => {
                          const status = sw.ngay_het_han ? trangThaiBanQuyen(sw.ngay_het_han) : 'perpetual';
                          return (
                            <div key={sw.id} className="group relative rounded-lg border p-3 hover:bg-primary/5 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold">{sw.ten_phan_mem}</span>
                                    {sw.phien_ban && <Badge variant="outline" className="text-meta px-1 py-0 h-4">{sw.phien_ban}</Badge>}
                                  </div>
                                  <div className="text-meta font-mono text-muted-foreground uppercase">{sw.ma_ban_quyen}</div>
                                </div>
                                <Badge variant="secondary" className={`text-meta px-1.5 py-0 h-4 font-semibold uppercase tracking-wider ${STATUS_CLASS[status]}`}>
                                  {STATUS_LABEL[status]}
                                </Badge>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-2 gap-2 text-meta text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Cài: {new Date(sw.ngay_cai_dat).toLocaleDateString("vi-VN")}
                                </div>
                                {sw.ngay_het_han && (
                                  <div className="flex items-center gap-1">
                                    <History className="h-3 w-3" />
                                    Hết hạn: {new Date(sw.ngay_het_han).toLocaleDateString("vi-VN")}
                                  </div>
                                )}
                              </div>
                              
                              {sw.license_key && (
                                <div className="mt-2 text-meta font-mono bg-muted/50 p-1.5 rounded truncate border border-dashed">
                                  <span className="text-muted-foreground/70 mr-1">KEY:</span>
                                  {sw.license_key}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
