// ============================================================================
// Nguồn dữ liệu THẬT cho các nghiệp vụ vận hành:
//   Bảo dưỡng (bao_tri) · Sự cố (su_co) · Hỏng hóc & thay thế (hong_hoc) · Bàn giao (ban_giao)
// Đọc trực tiếp từ CSDL, map về đúng kiểu dữ liệu ứng dụng để các trang hiện có
// dùng lại không cần đổi. Bảng khởi tạo rỗng, nhập liệu dần.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import type { SuCo, BaoTri, HongHocThayThe, BanGiao } from "@/lib/mirats/types";
import { fetchAllRows } from "./paginate";
import { usePagedQuery, sel as pagedSel, type Filter as PagedFilter, type Sort as PagedSort, type TsSearch as PagedSearch } from "./paged";

type Row = Record<string, unknown>;

export interface OperationsData {
  suCo: SuCo[];
  baoTri: BaoTri[];
  hongHoc: HongHocThayThe[];
  banGiao: BanGiao[];
}

const EMPTY_OPS: OperationsData = { suCo: [], baoTri: [], hongHoc: [], banGiao: [] };

function s(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function sn(v: unknown): string | null {
  return v == null || v === "" ? null : String(v);
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}
function num(v: unknown): number {
  const n = typeof v === "number" ? v : v == null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function numN(v: unknown): number | null {
  const n = typeof v === "number" ? v : v == null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
}
/** Trích ảnh chụp nhận dạng tài sản (do CSDL đóng băng) để dùng dự phòng. */
function snap(r: Record<string, unknown>) {
  return {
    snapshot_ma_thiet_bi: sn(r.snapshot_ma_thiet_bi),
    snapshot_ten_thiet_bi: sn(r.snapshot_ten_thiet_bi),
    snapshot_he_thong: sn(r.snapshot_he_thong),
    snapshot_don_vi: sn(r.snapshot_don_vi),
    snapshot_vi_tri: sn(r.snapshot_vi_tri),
  };
}

async function loadOperations(): Promise<OperationsData> {
  const [scRes, btRes, hhRes, bgRes] = await Promise.all([
    fetchAllRows<Row>((from, to) => supabase.from("su_co").select("*").order("ngay_phat_hien", { ascending: false }).range(from, to)).catch(e => { console.warn("Ops SC fail:", e); return []; }),
    fetchAllRows<Row>((from, to) => supabase.from("bao_tri").select("*").order("ngay_bat_dau", { ascending: false }).range(from, to)).catch(e => { console.warn("Ops BT fail:", e); return []; }),
    fetchAllRows<Row>((from, to) => supabase.from("hong_hoc").select("*").order("ngay_hong", { ascending: false }).range(from, to)).catch(e => { console.warn("Ops HH fail:", e); return []; }),
    fetchAllRows<Row>((from, to) => supabase.from("ban_giao").select("*").order("ngay_nhan", { ascending: false }).range(from, to)).catch(e => { console.warn("Ops BG fail:", e); return []; }),
  ]);

  if (typeof window === 'undefined' && (!scRes.length || !btRes.length)) {
     // If we are in SSR and have no data, it's likely a 401. Don't throw, just return empty.
     return EMPTY_OPS;
  }

  const suCo: SuCo[] = scRes.map((r: Row) => ({
    ma_su_co: s(r.ma_su_co) || s(r.id),
    thiet_bi: s(r.thiet_bi),
    thiet_bi_id: sn(r.thiet_bi_id),
    he_thong: s(r.he_thong),
    he_thong_id: sn(r.he_thong_id),
    don_vi: s(r.don_vi),
    ngay_phat_hien: s(r.ngay_phat_hien),
    nguoi_bao_cao: s(r.nguoi_bao_cao),
    muc_do: s(r.muc_do),
    anh_huong_dhb: s(r.anh_huong_dhb),
    hien_tuong: s(r.hien_tuong),
    nguyen_nhan: sn(r.nguyen_nhan),
    bien_phap_xu_ly: sn(r.bien_phap_xu_ly),
    thoi_diem_khac_phuc: sn(r.thoi_diem_khac_phuc),
    thoi_gian_gian_doan: numN(r.thoi_gian_gian_doan),
    nguoi_xu_ly: arr(r.nguoi_xu_ly),
    trang_thai: s(r.trang_thai),
    lien_ket_hong_hoc: sn(r.lien_ket_hong_hoc),
    file_dinh_kem: sn(r.file_dinh_kem),
    bao_cao_ban_dau: (r.bao_cao_ban_dau ?? null) as SuCo["bao_cao_ban_dau"],
    ma_nhom_bc: sn(r.ma_nhom_bc),
    van_de_id: sn((r as { van_de_id?: string | null }).van_de_id),
    ...snap(r as Record<string, unknown>),
  }));

  const baoTri: BaoTri[] = btRes.map((r: Row) => ({
    ma_bao_tri: s(r.ma_bao_tri) || s(r.id),
    thiet_bi: s(r.thiet_bi),
    thiet_bi_id: sn(r.thiet_bi_id),
    he_thong: s(r.he_thong),
    he_thong_id: sn(r.he_thong_id),
    don_vi: s(r.don_vi),
    loai_bao_tri: s(r.loai_bao_tri),
    ke_hoach: sn(r.ke_hoach),
    ngay_bat_dau: s(r.ngay_bat_dau),
    ngay_hoan_thanh: sn(r.ngay_hoan_thanh),
    mo_ta_cong_viec: s(r.mo_ta_cong_viec),
    ket_qua: sn(r.ket_qua),
    chi_phi: num(r.chi_phi),
    nguoi_thuc_hien: arr(r.nguoi_thuc_hien),
    don_vi_thuc_hien: s(r.don_vi_thuc_hien),
    trang_thai: s(r.trang_thai),
    file_bien_ban: sn(r.file_bien_ban),
    ...snap(r as Record<string, unknown>),
  }));

  const hongHoc: HongHocThayThe[] = hhRes.map((r: Row) => ({
    id: s(r.id),
    thanh_phan_id: sn(r.thanh_phan_id),
    ma_hong_hoc: s(r.ma_hong_hoc) || s(r.id),
    thiet_bi_hong: s(r.thiet_bi_hong),
    thiet_bi_hong_id: sn(r.thiet_bi_hong_id),
    su_co: sn(r.su_co),
    ngay_hong: s(r.ngay_hong),
    bo_phan_hong: s(r.bo_phan_hong),
    mo_ta_hong_hoc: s(r.mo_ta_hong_hoc),
    phuong_an: s(r.phuong_an),
    thiet_bi_thay_the: sn(r.thiet_bi_thay_the),
    thiet_bi_thay_the_id: sn(r.thiet_bi_thay_the_id),
    vat_tu_su_dung: arr(r.vat_tu_su_dung),
    chi_phi: num(r.chi_phi),
    nguoi_thuc_hien: arr(r.nguoi_thuc_hien),
    don_vi_thuc_hien: s(r.don_vi_thuc_hien),
    ket_qua: sn(r.ket_qua),
    ngay_hoan_thanh: sn(r.ngay_hoan_thanh),
    trang_thai: s(r.trang_thai),
    file_dinh_kem: sn(r.file_dinh_kem),
    ...snap(r as Record<string, unknown>),
  }));

  const banGiao: BanGiao[] = bgRes.map((r: Row) => ({
    ma_ban_giao: s(r.ma_ban_giao) || s(r.id),
    thiet_bi: s(r.thiet_bi),
    loai_ban_giao: s(r.loai_ban_giao),
    nguoi_giao: s(r.nguoi_giao),
    nguoi_nhan: s(r.nguoi_nhan),
    don_vi_nhan: s(r.don_vi_nhan),
    ngay_nhan: s(r.ngay_nhan),
    ngay_tra: sn(r.ngay_tra),
    tinh_trang_khi_nhan: s(r.tinh_trang_khi_nhan),
    tinh_trang_khi_tra: sn(r.tinh_trang_khi_tra),
    file_bien_ban: sn(r.file_bien_ban),
    trang_thai: s(r.trang_thai),
    ghi_chu: sn(r.ghi_chu),
    ...snap(r as Record<string, unknown>),
  }));

  return { suCo, baoTri, hongHoc, banGiao };
}

/** Dữ liệu vận hành thật (bảo dưỡng/sự cố/hỏng hóc/bàn giao) từ CSDL. */
export function useOperationsData() {
  const q = useQuery({
    queryKey: ["operations_data"],
    queryFn: loadOperations,
    staleTime: 30_000,
  });
  return { ...q, ops: q.data ?? EMPTY_OPS };
}

// ============================================================================
// GĐ 3 — Phân trang server-side cho 4 bảng vận hành.
// Dùng cho trang list (su-co/bao-tri/hong-hoc/ban-giao) khi dataset lớn.
// Không thay `useOperationsData` (còn dùng cho detail-scope + KPI cross-cut).
// ============================================================================

export interface PagedOpsOpts {
  page: number;
  pageSize: number;
  filters?: PagedFilter[];
  sort?: PagedSort | PagedSort[];
  search?: PagedSearch;
  enabled?: boolean;
}

/** Sự cố — chỉ tải trang hiện tại + tổng dòng. */
export function usePagedSuCo(opts: PagedOpsOpts) {
  return usePagedQuery<Row>({
    key: ["paged", "su_co", opts],
    table: "su_co",
    select: pagedSel("*"),
    sort: opts.sort ?? { column: "ngay_phat_hien", ascending: false },
    ...opts,
  });
}

/** Bảo trì — chỉ tải trang hiện tại + tổng dòng. */
export function usePagedBaoTri(opts: PagedOpsOpts) {
  return usePagedQuery<Row>({
    key: ["paged", "bao_tri", opts],
    table: "bao_tri",
    select: pagedSel("*"),
    sort: opts.sort ?? { column: "ngay_bat_dau", ascending: false },
    ...opts,
  });
}

/** Hỏng hóc — chỉ tải trang hiện tại + tổng dòng. */
export function usePagedHongHoc(opts: PagedOpsOpts) {
  return usePagedQuery<Row>({
    key: ["paged", "hong_hoc", opts],
    table: "hong_hoc",
    select: pagedSel("*"),
    sort: opts.sort ?? { column: "ngay_hong", ascending: false },
    ...opts,
  });
}

/** Bàn giao — chỉ tải trang hiện tại + tổng dòng. */
export function usePagedBanGiao(opts: PagedOpsOpts) {
  return usePagedQuery<Row>({
    key: ["paged", "ban_giao", opts],
    table: "ban_giao",
    select: pagedSel("*"),
    sort: opts.sort ?? { column: "ngay_nhan", ascending: false },
    ...opts,
  });
}
