import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/backend/client";
import { useQuery } from "@tanstack/react-query";
import { fetchAllRows } from "@/lib/mirats/paginate";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { Package, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCan } from "@/hooks/use-permissions";
import { useUserPref } from "@/hooks/use-user-pref";
import TabTongQuan from "@/components/mirats/thiet-bi-detail/TabTongQuan";
import TabVanHanh from "@/components/mirats/thiet-bi-detail/TabVanHanh";
import TabCauHinh from "@/components/mirats/thiet-bi-detail/TabCauHinh";
import TabHoSoPhapLy from "@/components/mirats/thiet-bi-detail/TabHoSoPhapLy";
import TabNangCao from "@/components/mirats/thiet-bi-detail/TabNangCao";

export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  component: ThietBiDetailRoute,
});

function ThietBiDetailRoute() {
  const { maThietBi: ma } = Route.useParams();
  const canManage = useCan("thiet-bi", "manage");
  const [editMode, setEditMode] = useUserPref<boolean>("thiet-bi-detail:edit-mode", false);
  const canEdit = canManage && editMode;

  const { data: tb, isLoading } = useQuery({
    queryKey: ["thiet-bi", ma],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select(`
          *,
          loai:loai_thiet_bi_id(ten, mau),
          trang_thai:trang_thai_id(ma, ten),
          don_vi:don_vi_quan_ly_id(ten, ma)
        `)
        .eq("ma_thiet_bi", ma)
        .single();
      if (error) throw error;
      
      // Khởi tạo các trường DbDevice giả định nếu thiếu
      const row = data as any;
      return {
        ...row,
        _pl: row.phan_loai_id || "",
        _plTen: "",
        _lv: "",
        _lvTen: "",
        _htId: row.he_thong_id || "",
        _htTen: "",
        _nhKey: "",
        _nhTen: "",
        _namSanXuat: row.nam_san_xuat,
        _namKhaiThac: row.nam_dua_vao_khai_thac,
        _tyLeTuoiTho: row.ty_le_tuoi_tho,
        _noiQuanLy: row.noi_quan_ly || "",
        _phanLoai: row.phan_loai || "",
        _thanhPhan: row.thanh_phan || "",
        _donViTen: row.don_vi?.ten || "",
        _viTriId: row.vi_tri_id || "",
        _viTriTen: "",
        _maBravo: row.ma_tai_san_bravo || "",
        _modelId: row.model_id || "",
        _modelMa: "",
        _modelTen: row.model || "",
        _modelAnh: "",
        _modelMoTa: "",
        _modelPn: row.p_n || "",
        _modelNsxTen: row.nha_san_xuat || "",
        _loaiTbId: row.loai_thiet_bi_id || "",
        _loaiTbTen: row.loai?.ten || "",
        _loaiTbOrder: 0,
        _capPhatTrangThai: row.trang_thai_cap_phat || "san_sang",
        _nguoiGiu: row.nguoi_giu || "",
        _donViGiuId: row.don_vi_giu_id || "",
        _donViGiuTen: "",
        _ngayCapPhat: row.ngay_cap_phat || ""
      };
    },
  });

  // Giả lập hoặc fetch các dữ liệu phụ cho các tab (timeline, suCo, baoTri, ...)
  // Trong thực tế sẽ dùng useQueries hoặc fetch đầy đủ từ DB
  const timeline = [] as any[]; 
  const suCo = [] as any[];
  const baoTri = [] as any[];
  const hongHoc = [] as any[];
  const banGiao = [] as any[];

  if (isLoading) return <DetailSkeleton />;
  if (!tb) return <div className="p-8 text-center">Không tìm thấy tài sản.</div>;

  const pct = tb.ty_le_tuoi_tho == null ? null : Math.max(0, Math.min(100, Math.round(tb.ty_le_tuoi_tho)));

  const tabProps = {
    tb,
    ma,
    tenTb: tb.ten_thiet_bi || tb.ma_thiet_bi,
    loaiMau: tb.loai?.mau,
    sysName: "Hệ thống giả lập",
    sysGpSo: "",
    sysGpHan: "",
    vaiTroList: [],
    canEdit,
    canManage,
    editMode,
    setEditMode,
    timeline,
    suCo,
    baoTri,
    hongHoc,
    banGiao,
    changeEvents: [],
    pct
  };

  return (
    <PageBody>
      <PageHeader
        icon={Package}
        title={tb.ten_thiet_bi || tb.ma_thiet_bi}
        actions={
          <div className="flex items-center gap-4">
            {canManage && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 transition-all hover:bg-muted">
                <Switch 
                  id="edit-mode" 
                  checked={editMode} 
                  onCheckedChange={setEditMode}
                  className="data-[state=checked]:bg-primary"
                />
                <label 
                  htmlFor="edit-mode" 
                  className="text-xs font-medium cursor-pointer flex items-center gap-1.5 select-none"
                >
                  {editMode ? (
                    <><Check className="h-3 w-3 text-primary" /> Đang chỉnh sửa</>
                  ) : (
                    <><Pencil className="h-3 w-3 text-muted-foreground" /> Bật chỉnh sửa</>
                  )}
                </label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <StatusBadge domain="thiet_bi" code={tb.trang_thai?.ma} />
              {tb.ma_serial && <Badge variant="secondary" className="font-mono">S/N: {tb.ma_serial}</Badge>}
            </div>
          </div>
        }
        description={
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[10px] font-normal">Tài sản</Badge>
             <span className="text-muted-foreground">/</span>
             <span className="text-muted-foreground">{tb.ma_thiet_bi}</span>
          </div>
        }
      />

      <div className="mt-6">
        <Tabs defaultValue="tong-quan" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tong-quan">Tổng quan</TabsTrigger>
            <TabsTrigger value="van-hanh">Vận hành</TabsTrigger>
            <TabsTrigger value="cau-hinh">Cấu hình</TabsTrigger>
            <TabsTrigger value="phap-ly">Pháp lý</TabsTrigger>
            <TabsTrigger value="nang-cao">Nâng cao</TabsTrigger>
          </TabsList>

          <TabsContent value="tong-quan" className="focus-visible:outline-none">
            <TabTongQuan {...tabProps} />
          </TabsContent>
          <TabsContent value="van-hanh" className="focus-visible:outline-none">
            <TabVanHanh {...tabProps} />
          </TabsContent>
          <TabsContent value="cau-hinh" className="focus-visible:outline-none">
            <TabCauHinh {...tabProps} TelemetryPanel={null} AllocationPanel={null} donViTenMap={{}} />
          </TabsContent>
          <TabsContent value="phap-ly" className="focus-visible:outline-none">
            <TabHoSoPhapLy {...tabProps} />
          </TabsContent>
          <TabsContent value="nang-cao" className="focus-visible:outline-none">
            <TabNangCao {...tabProps} LifecyclePanel={null} />
          </TabsContent>
        </Tabs>
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
