import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/backend/client";
import { useQuery } from "@tanstack/react-query";
import { fetchAllRows } from "@/lib/mirats/paginate";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { Package, Pencil, Check, ShieldCheck, History, Wrench, AlertTriangle, FileText, Ban, Trash2, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useCan } from "@/hooks/use-permissions";
import { useUserPref } from "@/hooks/use-user-pref";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { roles } = useSession();
  const isAdmin = roles.includes("admin") || roles.includes("phong_kt");
  const canManage = useCan("thiet-bi", "manage");
  const [editMode, setEditMode] = useUserPref<boolean>("thiet-bi-detail:edit-mode", false);
  const canEdit = canManage && editMode;


  const { data: tb, isLoading, error: queryError } = useQuery({
    queryKey: ["thiet-bi", ma],
    queryFn: async () => {
      if (!ma) throw new Error("Mã thiết bị không hợp lệ");
      const { data, error } = await supabase
        .from("thiet_bi")
        .select(`
          *,
          loai:loai_thiet_bi_id(ten, mau),
          trang_thai:trang_thai_id(ma, ten),
          don_vi:don_vi_quan_ly_id(ten, ma)
        `)
        .eq("ma_thiet_bi", ma)
        .maybeSingle();
      
      if (error) {
        console.error("Lỗi fetch thiết bị:", error);
        throw error;
      }
      
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
  
  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground">{(queryError as Error).message}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>Tải lại trang</Button>
      </div>
    );
  }

  if (!tb) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Package className="h-12 w-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Không tìm thấy tài sản</h2>
          <p className="text-sm text-muted-foreground">Mã thiết bị "{ma}" không tồn tại trong hệ thống.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/thiet-bi">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

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
    <div className="flex min-h-screen flex-col bg-muted/20 pb-20 md:pb-0">
      <div className="p-4 bg-background border-b sticky top-0 z-30">
        <PageHeader
          title={tb.ten_thiet_bi || ma}
          icon={Package}
          actions={
            <div className="flex items-center gap-2">
              {canManage && (
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 h-8 px-3 transition-all"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Đang chỉnh sửa</span>
                      <span className="sm:hidden">Xong</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Chỉnh sửa</span>
                    </>
                  )}
                </Button>
              )}
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">Thao tác</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-amber-600 cursor-pointer">
                      <Ban className="mr-2 h-4 w-4" /> Ngừng khai thác
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" /> Thanh lý tài sản
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className="font-mono">{ma}</Badge>
          <StatusBadge domain="thiet_bi" code={tb._capPhatTrangThai} />
          {tb.loai?.mau && <Badge style={{ backgroundColor: tb.loai.mau }} className="text-white border-0">{tb.loai.ten}</Badge>}
        </div>
      </div>
      
      <PageBody>
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
  </div>
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
