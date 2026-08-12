import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Loader2 } from "lucide-react";

// Nhãn tiếng Việt cho toàn bộ cột vật lý của bảng thiet_bi (nguồn: schema DB).
// Cột nào không có trong map sẽ được "humanize" từ tên cột.
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
  file_tai_lieu: "File tài liệu",
  hinh_anh: "Hình ảnh",
  
  created_at: "Ngày tạo",
  updated_at: "Cập nhật gần nhất",
};

// Cột nội bộ / kỹ thuật không hiển thị.
const HIDDEN_COLS = new Set<string>([
  "search_text",
  "search_tsv",
  "created_by",
  // UUID khoá ngoại đã có nhãn tên đọc được ở khối trên của Drawer → không cần lộ UUID
  "nhom_he_thong_id",
  "he_thong_id",
]);

// Master-data (Task 10): FK *_id là chuẩn — các cột text dưới đây chỉ là
// snapshot hiển thị, được trigger CSDL đồng bộ từ FK. Không nhập trực tiếp.
const SNAPSHOT_COLS = new Set<string>([
  "nha_san_xuat",
  "nha_cung_cap",
  "model",
  "phan_loai",
  "vi_tri",
]);


// Cột UUID khoá ngoại — gom thành nhóm riêng, hiển thị dạng mã kỹ thuật.
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
  // ISO datetime → giờ VN
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("vi-VN");
  }
  return s;
}

export function ThietBiAllFields({ maThietBi }: { maThietBi: string }) {
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải toàn bộ trường dữ liệu…
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-destructive">Không tải được dữ liệu: {error instanceof Error ? error.message : "Lỗi"}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Không tìm thấy bản ghi.</p>;
  }

  const thuocTinh = (data.thuoc_tinh && typeof data.thuoc_tinh === "object" ? data.thuoc_tinh : {}) as Record<string, unknown>;

  const businessCols = Object.keys(data).filter(
    (k) => !HIDDEN_COLS.has(k) && !FK_COLS.has(k) && !SNAPSHOT_COLS.has(k) && k !== "thuoc_tinh",
  );
  const snapshotCols = Object.keys(data).filter((k) => SNAPSHOT_COLS.has(k));
  const fkCols = Object.keys(data).filter((k) => FK_COLS.has(k));
  const dynKeys = Object.keys(thuocTinh);

  return (
    <div className="space-y-6">
      <FieldTable
        title={`Trường nghiệp vụ (${businessCols.length})`}
        rows={businessCols.map((k) => ({ label: FIELD_LABELS[k] ?? humanize(k), key: k, value: fmt(data[k]) }))}
      />

      {snapshotCols.length > 0 && (
        <FieldTable
          title={`Snapshot hiển thị — đồng bộ từ FK, không nhập tay (${snapshotCols.length})`}
          rows={snapshotCols.map((k) => ({ label: FIELD_LABELS[k] ?? humanize(k), key: k, value: fmt(data[k]) }))}
        />
      )}

      {dynKeys.length > 0 && (
        <FieldTable
          title={`Trường động (khai thêm theo hệ thống) (${dynKeys.length})`}
          rows={dynKeys.map((k) => ({ label: humanize(k), key: k, value: fmt(thuocTinh[k]) }))}
        />
      )}

      <FieldTable
        title={`Định danh & khoá liên kết (${fkCols.length})`}
        rows={fkCols.map((k) => ({ label: FIELD_LABELS[k] ?? humanize(k), key: k, value: fmt(data[k]) }))}
        mono
      />
    </div>
  );
}

function FieldTable({
  title,
  rows,
  mono,
}: {
  title: string;
  rows: { label: string; key: string; value: string }[];
  mono?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i % 2 ? "bg-muted/30" : ""}>
                <td className="w-1/3 min-w-[160px] border-r px-3 py-2 align-top">
                  <div className="font-medium">{r.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{r.key}</div>
                </td>
                <td className={`px-3 py-2 align-top break-words ${mono ? "font-mono text-xs" : ""}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
