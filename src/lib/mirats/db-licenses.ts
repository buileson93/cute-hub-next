// ============================================================================
// Nguồn dữ liệu THẬT cho Giấy phép — đọc từ read model hợp nhất `v_giay_phep`
// (T14). View này gộp cả `giay_phep` (gắn tài sản) và `giay_phep_khai_thac`
// (gắn hệ thống) về một bộ cột chuẩn, tính sẵn trạng thái/hạn/đã-bị-thay-thế.
// Mọi UI giấy phép (trang danh sách, widget, chi tiết) đọc chung nguồn này.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GiayPhep } from "@/lib/mirats/types";

/** Một dòng của read model hợp nhất v_giay_phep. */
export interface UnifiedLicense {
  id: string;
  nguon: "giay_phep" | "gpkt";
  so_giay_phep: string | null;
  ma_giay_phep: string | null;
  loai: string | null;
  loai_ma: string | null;
  ngay_cap: string | null;
  ngay_het_han: string | null;
  noi_cap: string | null;
  file_url: string | null;
  ghi_chu: string | null;
  gp_cu: string | null;
  pham_vi: "thiet_bi" | "he_thong";
  thiet_bi_id: string | null;
  he_thong_id: string | null;
  don_vi_id: string | null;
  don_vi_ma: string | null;
  don_vi_ten: string | null;
  ten_doi_tuong: string | null;
  kieu_thiet_bi: string | null;
  so_ngay_con_lai: number | null;
  trang_thai: "valid" | "expiring" | "expired" | "none";
  bi_thay_the: boolean;
}

/** Giấy phép chuẩn hoá cho UI (giữ tương thích với type GiayPhep sẵn có). */
export interface LicenseRow extends GiayPhep {
  nguon: UnifiedLicense["nguon"];
  phamVi: UnifiedLicense["pham_vi"];
  /** UUID gốc trong bảng `giay_phep`/`giay_phep_khai_thac` — cần cho UPDATE. */
  rowId: string;
  maGiayPhep: string | null;
  donViReal: string | null;
  donViTen: string | null;
  tenReal: string | null;
  tram: string | null;
  kieuThietBi: string | null;
  mucDich: string | null;
  heThongId: string | null;
  thietBiId: string | null;
  soNgayConLai: number | null;
  trangThai: UnifiedLicense["trang_thai"];
  biThayThe: boolean;
}

function txt(v: unknown): string | null {
  const t = v == null ? "" : String(v).trim();
  return t === "" ? null : t;
}

async function loadLicenses(): Promise<LicenseRow[]> {
  // v_giay_phep là view tạo bằng migration; ép kiểu client cho tới khi types regenerate.
  const client = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (c: string, o: { ascending: boolean; nullsFirst?: boolean }) => Promise<{
          data: UnifiedLicense[] | null;
          error: unknown;
        }>;
      };
    };
  };
  const { data, error } = await client
    .from("v_giay_phep")
    .select("*")
    .order("ngay_het_han", { ascending: true, nullsFirst: false });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: txt(r.so_giay_phep) ?? txt(r.ma_giay_phep) ?? String(r.id),
    rowId: String(r.id),
    maGiayPhep: txt(r.ma_giay_phep),
    thietBi: null,
    loai: r.nguon === "gpkt" ? "GPKT" : txt(r.loai),
    soGP: txt(r.so_giay_phep),
    ngayCap: txt(r.ngay_cap),
    ngayHetHan: txt(r.ngay_het_han),
    noiCap: txt(r.noi_cap),
    file: txt(r.file_url),
    ghiChu: txt(r.ghi_chu),
    nguon: r.nguon,
    phamVi: r.pham_vi,
    donViReal: txt(r.don_vi_ma),
    donViTen: txt(r.don_vi_ten),
    tenReal: txt(r.ten_doi_tuong),
    tram: null,
    kieuThietBi: txt(r.kieu_thiet_bi),
    mucDich: txt(r.ghi_chu),
    heThongId: txt(r.he_thong_id),
    thietBiId: txt(r.thiet_bi_id),
    soNgayConLai: r.so_ngay_con_lai ?? null,
    trangThai: r.trang_thai,
    biThayThe: !!r.bi_thay_the,
  }));
}

/** Danh sách giấy phép hợp nhất từ CSDL (nguồn chuẩn duy nhất). */
export function useLicensesData() {
  const q = useQuery({
    queryKey: ["licenses_data"],
    queryFn: loadLicenses,
    staleTime: 30_000,
  });
  return { ...q, licenses: q.data ?? [] };
}
