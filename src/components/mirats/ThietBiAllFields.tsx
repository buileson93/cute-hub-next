import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Loader2, Settings2, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RawTableWrapper } from "@/components/mirats/ui/RawTableWrapper";

// Nhãn tiếng Việt cho toàn bộ cột vật lý của bảng thiet_bi (nguồn: schema DB).
const FIELD_LABELS: Record<string, string> = {
  ma_thiet_bi: "Mã tài sản",
  ma_thiet_bi_cu: "Mã cũ (trước khi chuẩn hoá)",
  ten_thiet_bi: "Tên tài sản",
  ma_tai_san_bravo: "Mã tài sản Bravo",

  ma_serial: "Số serial",
  p_n: "P/N",
  model: "Model",
  thanh_phan: "Thành phần",
  phan_loai: "Phân loại",
  nha_san_xuat: "Nhà sản xuất (text)",
  nha_cung_cap: "Nhà cung cấp (text)",
  vi_tri: "Vị trí lắp đặt",
  noi_quan_ly: "Nơi quản lý",
  ngay_mua: "Ngày mua",
  han_bao_hanh: "Hạn bảo hành",
  nam_san_xuat: "Năm sản xuất",
  nam_dua_vao_khai_thac: "Năm đưa vào khai thác",
  so_nam_su_dung: "Số năm sử dụng",
  ty_le_tuoi_tho: "Tỷ lệ tuổi thọ (%)",
  tinh_trang_ky_thuat: "Tình trạng kỹ thuật",
  giay_phep_khai_thac: "Giấy phép khai thác",
  giay_phep_tan_so: "Giấy phép tần số",
  vat_tu_du_phong: "Vật tư dự phòng",
  thong_ke_hong_hoc: "Thống kê hỏng hóc",
  de_xuat_phuong_an: "Đề xuất phương án",
  de_xuat_tiep_tuc: "Đề xuất tiếp tục",
  de_xuat_khac: "Đề xuất khác",
  thoi_diem_dieu_chuyen: "Thời điểm điều chuyển",
  noi_chuyen_di: "Nơi chuyển đi",
  noi_chuyen_den: "Nơi chuyển đến",
  ly_do_dieu_chuyen: "Lý do điều chuyển",
  thoi_diem_cham_dut: "Thời điểm chấm dứt",
  quyet_dinh_cham_dut: "Quyết định chấm dứt",
  noi_cat_giu: "Nơi cất giữ",
  do_tin_cay: "Độ tin cậy",
  nguon_du_lieu: "Nguồn dữ liệu",
  nguoi_giu: "Người giữ",
  ngay_cap_phat: "Ngày cấp phát",
  trang_thai_cap_phat: "Trạng thái cấp phát",
  ngay_kiem_ke_ke_tiep: "Ngày kiểm kê kế tiếp",
  ngay_bao_tri_gan_nhat: "Ngày bảo trì gần nhất",
  ngay_bao_tri_ke_tiep: "Ngày bảo trì kế tiếp",
  ghi_chu: "Ghi chú",
  vai_tro: "Vai trò",
  file_tai_lieu: "File tài liệu",
  hinh_anh: "Hình ảnh",
  
  created_at: "Ngày tạo",
  updated_at: "Cập nhật gần nhất",
  id: "ID Hệ thống (UUID)",
};


const HIDDEN_COLS = new Set<string>([
  "search_text",
  "search_tsv",
  "created_by",
  "nhom_he_thong_id",
  "he_thong_id",
]);

const SNAPSHOT_COLS = new Set<string>([
  "nha_san_xuat",
  "nha_cung_cap",
  "model",
  "phan_loai",
  "vi_tri",
]);

const FK_COLS = new Set<string>([
  "id",
  "loai_thiet_bi_id",
  "trang_thai_id",
  "don_vi_quan_ly_id",
  "nha_san_xuat_id",
  "nha_cung_cap_id",
  "vi_tri_id",
  "don_vi_id",
  "danh_gia_nien_han_id",
  "model_id",
  "phan_loai_id",
  "field_set_id",
  "don_vi_giu_id",
]);

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "number") return v.toLocaleString("vi-VN");
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("vi-VN");
  }
  return s;
}

export function ThietBiAllFields({ maThietBi }: { maThietBi: string }) {
  const [techMode, setTechMode] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tb_all_fields", maThietBi],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi")
        .select("*")
        .eq("ma_thiet_bi", maThietBi)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
  });

  const displayRows = useMemo(() => {
    if (!data) return [];
    const thuocTinh = (data.thuoc_tinh && typeof data.thuoc_tinh === "object" ? data.thuoc_tinh : {}) as Record<string, unknown>;
    
    const allKeys = Object.keys(data).filter(k => k !== "thuoc_tinh");
    const dynKeys = Object.keys(thuocTinh);

    const mapRow = (k: string, isDyn = false) => {
      const val = isDyn ? thuocTinh[k] : data[k];
      return {
        key: k,
        label: isDyn ? humanize(k) : (FIELD_LABELS[k] ?? humanize(k)),
        value: fmt(val),
        raw: val,
        isFK: !isDyn && FK_COLS.has(k),
        isSnapshot: !isDyn && SNAPSHOT_COLS.has(k),
        isHidden: !isDyn && HIDDEN_COLS.has(k),
        isEmpty: val == null || val === "" || val === undefined,
        isDyn
      };
    };

    let rows = [
      ...allKeys.map(k => mapRow(k)),
      ...dynKeys.map(k => mapRow(k, true))
    ];

    // Lọc theo chế độ
    if (!techMode) {
      // Chế độ thường: Ẩn ID kỹ thuật, ẩn cột nội bộ
      rows = rows.filter(r => !r.isFK && !r.isHidden);
    }

    if (!showEmpty) {
      // Ẩn các trường trống
      rows = rows.filter(r => !r.isEmpty);
    }

    return rows;
  }, [data, techMode, showEmpty]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu…
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Lỗi: {String(error || "Không tìm thấy")}</p>;
  }

  const sections = [
    { 
      title: "Thông tin chính", 
      rows: displayRows.filter(r => !r.isFK && !r.isSnapshot && !r.isDyn && !r.isHidden) 
    },
    { 
      title: "Trường mở rộng (Dynamic)", 
      rows: displayRows.filter(r => r.isDyn) 
    },
    { 
      title: "Snapshot Dữ liệu", 
      rows: displayRows.filter(r => r.isSnapshot) 
    },
    { 
      title: "Kỹ thuật & Liên kết", 
      rows: displayRows.filter(r => r.isFK || r.isHidden) 
    },
  ].filter(s => s.rows.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="tech-mode" 
              checked={techMode} 
              onCheckedChange={setTechMode}
            />
            <Label htmlFor="tech-mode" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
              <Settings2 className="h-3.5 w-3.5" /> Chế độ kỹ thuật
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-empty" 
              checked={showEmpty} 
              onCheckedChange={setShowEmpty}
            />
            <Label htmlFor="show-empty" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
              <Info className="h-3.5 w-3.5" /> Hiện trường trống
            </Label>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground italic">
          Đang hiển thị {displayRows.length} trường
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
              <span className="w-1 h-3 bg-primary/40 rounded-full" />
              {s.title}
            </h3>
            <RawTableWrapper stickyHeader={false} showShadows={false}>
              <table>
                <tbody>
                  {s.rows.map((r, i) => (
                    <tr key={r.key} className={cn(
                      "group transition-colors",
                      i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}>
                      <td className="w-1/3 min-w-[160px] border-r align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{r.label}</span>
                          {r.isSnapshot && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-sky-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Dữ liệu snapshot từ bảng danh mục</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5">
                          {r.key}
                        </div>
                      </td>
                      <td className={cn(
                        "align-top break-all font-medium",
                        (r.isFK || r.isHidden) ? "font-mono text-[11px] text-muted-foreground bg-muted/10" : "text-foreground",
                        r.isEmpty && "text-muted-foreground/40 italic font-normal"
                      )}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </RawTableWrapper>
          </div>
        ))}
      </div>
    </div>
  );
}
