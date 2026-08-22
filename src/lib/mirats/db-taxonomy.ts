// ============================================================================
// Nguồn dữ liệu THẬT cho cây "Hệ Thống" và trang "Hệ thống tài sản".
// Đọc trực tiếp từ CSDL (thiet_bi + các bảng danh mục) thay cho dữ liệu mẫu tĩnh.
//
// Phân lớp thật trong CSDL (quan hệ khóa ngoại rõ ràng):
//   Đơn vị (dm_don_vi)
//     → Phân loại (dm_phan_loai: Nhóm 1 / Nhóm 2 / Nhóm 3 / Tài sản đo lường …)
//       → Nhóm hệ thống (dm_nhom_he_thong: VHF / VCCS / AMHS / Radar …)
//         → Hệ thống (dm_he_thong)
//           → Tài sản (thiet_bi)
// ============================================================================


import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/mirats/paginate";
import type { ThietBi } from "@/lib/mirats/types";
import { parseHtSysMa, NONE_HT } from "@/components/mirats/he-thong-cay/utils";


/** Tài sản lấy từ CSDL, kèm mã phân lớp taxonomy để dựng cây. */
export interface DbDevice extends ThietBi {
  id: string;
  _pl: string;
  _plTen: string;
  _lv: string;
  _lvTen: string;
  _htId: string;
  _htTen: string;
  _nhKey: string;
  _nhTen: string;
  _namSanXuat: number | null;
  _namKhaiThac: number | null;
  _tyLeTuoiTho: number | null;
  _noiQuanLy: string;
  _phanLoai: string;
  _thanhPhan: string;
  _thanhPhanId: string | null;
  _thanhPhanMa: string | null;
  _thanhPhanTen: string | null;
  _donViTen: string;
  _viTriId: string;
  _viTriTen: string;
  _maBravo: string;
  _modelId: string;
  _modelMa: string;
  _modelTen: string;
  _modelAnh: string;
  _modelMoTa: string;
  _modelPn: string;
  _modelNsxTen: string;
  _loaiTbId: string;
  _loaiTbTen: string;
  _loaiTbOrder: number;
  _capPhatTrangThai: string;
  _nguoiGiu: string;
  _donViGiuId: string;
  _donViGiuTen: string;
  _ngayCapPhat: string;
}

export interface DbTaxonomy {
  plList: Array<{ id: string; ten: string; tone: string; thu_tu: number }>;
  plNameMap: Map<string, string>;
  lvNameMap: Map<string, string>;
  htNameMap: Map<string, string>;
  htMaMap: Map<string, string>;
  nhomNameMap: Map<string, string>;
  nhomMaMap: Map<string, string>;
  donViList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  lvList: Array<{ id: string; ma: string; ten: string; thu_tu: number }>;
  nhomList: Array<{ id: string; ma: string; ten: string; phanLoaiId: string; thu_tu: number }>;
  htList: Array<{
    id: string;
    ma: string;
    ten: string;
    phanLoaiId: string;
    nhomId: string;
    lvId: string;
    donViId: string;
    gpSo: string;
    gpHan: string;
    maBravo: string;
  }>;
  viTriList: Array<{ id: string; ma: string; ten: string; mo_ta: string }>;
  trangThaiList: string[];
  devices: any[];
}

function noAccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
}

function plTone(ten: string): string {
  const s = noAccent(ten);
  if (s.includes("DUNG KHAI THAC")) return "border-slate-500/40 bg-muted0/10 text-muted-foreground";
  if (s.includes("NHOM 1")) return "border-rose-500/40 bg-rose-500/10 text-rose-600";
  if (s.includes("NHOM 2")) return "border-amber-500/40 bg-amber-500/10 text-amber-600";
  if (s.includes("NHOM 3")) return "border-sky-500/40 bg-sky-500/10 text-sky-600";
  if (s.includes("DO LUONG")) return "border-violet-500/40 bg-violet-500/10 text-violet-600";
  return "border-border bg-muted text-muted-foreground";
}

type CatRow = { id: string; ma: string; ten: string; thu_tu: number | null };

async function loadBaseTaxonomy(): Promise<DbTaxonomy> {
  const [plRes, nhomRes, htRes, dvRes, ttRes, vtRes, ltRes, mdRes, nsxRes, editRes] =
    await Promise.all([
      supabase.from("dm_phan_loai").select("id, ma, ten, thu_tu").order("thu_tu"),
      supabase.from("dm_nhom_he_thong").select("id, ma, ten, phan_loai_id, thu_tu").order("thu_tu"),
      fetchAllRows((from, to) =>
        supabase
          .from("dm_he_thong")
          .select(
            "id, ma, ten, ma_tai_san_bravo, thu_tu, phan_loai_id, nhom_he_thong_id, don_vi_id, gp_so, gp_han",
          )
          .order("ten")
          .range(from, to),
      ).then((data) => ({ data, error: null })),
      supabase.from("dm_don_vi").select("id, ma, ten, mo_ta, thu_tu").order("thu_tu"),
      supabase.from("dm_trang_thai_thiet_bi").select("id, ma, ten, thu_tu").order("thu_tu"),
      fetchAllRows((from, to) =>
        supabase
          .from("dm_vi_tri")
          .select("id, ma, ten, mo_ta, thu_tu")
          .order("thu_tu")
          .range(from, to),
      ).then((data) => ({ data, error: null })),
      supabase.from("dm_loai_thiet_bi").select("id, ma, ten, thu_tu").order("thu_tu"),
      fetchAllRows((from, to) =>
        supabase
          .from("dm_model")
          .select("id, ma, ten, hinh_anh, mo_ta, p_n, nha_san_xuat_id")
          .range(from, to),
      ).then((data) => ({ data, error: null })),
      supabase.from("dm_nha_san_xuat").select("id, ten"),
      supabase.from("cay_node_edit").select("ma, du_lieu").eq("kind", "ht"),
    ]);

  for (const r of [plRes, nhomRes, htRes, dvRes, ttRes, vtRes, ltRes, mdRes, nsxRes, editRes]) {
    if (r.error) throw r.error;
  }

  const pl = (plRes.data ?? []) as CatRow[];
  const nhom = (nhomRes.data ?? []) as Array<CatRow & { phan_loai_id: string | null }>;
  const ht = (htRes.data ?? []) as any[];
  const dv = (dvRes.data ?? []) as Array<CatRow & { mo_ta: string | null }>;
  const tt = (ttRes.data ?? []) as CatRow[];
  const vt = (vtRes.data ?? []) as Array<CatRow & { mo_ta: string | null }>;

  return {
    devices: [], // TỐI ƯU 10H: Trả về mảng rỗng để buộc các route dùng paged query
    plList: pl.map((r) => ({
      id: r.id,
      ten: r.ten,
      tone: plTone(r.ten),
      thu_tu: r.thu_tu ?? 0,
    })),
    plNameMap: new Map(pl.map((r) => [r.id, r.ten])),
    lvNameMap: new Map(),
    htNameMap: new Map(ht.map((r) => [r.id, r.ten])),
    htMaMap: new Map(ht.map((r) => [r.ma, r.ten])),
    nhomList: nhom.map((r) => ({
      id: r.id,
      ma: r.ma,
      ten: r.ten,
      phanLoaiId: r.phan_loai_id ?? "",
      thu_tu: r.thu_tu ?? 0,
    })),
    nhomNameMap: new Map(nhom.map((r) => [r.id, r.ten])),
    nhomMaMap: new Map(nhom.map((r) => [r.ma, r.ten])),
    donViList: dv.map((r) => ({ id: r.id, ma: r.ma, ten: r.ten, mo_ta: r.mo_ta ?? "" })),
    lvList: [],
    htList: ht.map((r) => ({
      id: r.id,
      ma: r.ma,
      ten: r.ten,
      phanLoaiId: r.phan_loai_id ?? "",
      nhomId: r.nhom_he_thong_id ?? "",
      lvId: "",
      donViId: r.don_vi_id ?? "",
      gpSo: r.gp_so ?? "",
      gpHan: r.gp_han ?? "",
      maBravo: r.ma_tai_san_bravo ?? "",
    })),
    viTriList: vt.map((r) => ({ id: r.id, ma: r.ma, ten: r.ten, mo_ta: r.mo_ta ?? "" })),
    trangThaiList: tt.map((r) => r.ten),
  };
}

export function useDbTaxonomy() {
  return useQuery({
    queryKey: ["db_taxonomy"],
    queryFn: loadBaseTaxonomy,
    staleTime: 5 * 60_000,
  });
}

export function invalidateTaxonomy(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
  qc.invalidateQueries({ queryKey: ["ht_name_overrides"] });
  qc.invalidateQueries({ queryKey: ["tb_name_overrides"] });
  qc.invalidateQueries({ queryKey: ["ref_id_options"] });
  qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
}

export function buildSystemNameOverrideMap(
  rows: Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
  realIds: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    const sysId = r.ma;
    if (!sysId || realIds.has(sysId)) continue;
    const name =
      r.ten?.trim() ||
      (typeof r.du_lieu?.ten_mindmap === "string" ? String(r.du_lieu.ten_mindmap).trim() : "");
    if (name) map.set(sysId, name);
  }
  return map;
}

export function buildDeviceNameOverrideMap(
  rows: Array<{ ma: string; ten: string | null; du_lieu: Record<string, unknown> | null }>,
  realDeviceMa: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (!r.ma || realDeviceMa.has(r.ma)) continue;
    const name =
      r.ten?.trim() ||
      (typeof r.du_lieu?.ten_mindmap === "string" ? String(r.du_lieu.ten_mindmap).trim() : "");
    if (name) map.set(r.ma, name);
  }
  return map;
}

export function useSystemNameOverrides() {
  return useQuery({
    queryKey: ["ht_name_overrides"],
    queryFn: async (): Promise<Map<string, string>> => {
      const [editRes, htRes] = await Promise.all([
        supabase.from("cay_node_edit").select("ma,ten,du_lieu").eq("kind", "ht"),
        supabase.from("dm_he_thong").select("id"),
      ]);
      if (editRes.error) throw editRes.error;
      if (htRes.error) throw htRes.error;
      const realIds = new Set<string>((htRes.data ?? []).map((r) => r.id as string));
      return buildSystemNameOverrideMap(editRes.data as any, realIds);
    },
    staleTime: 30_000,
  });
}

export function useDeviceNameOverrides() {
  return useQuery({
    queryKey: ["tb_name_overrides"],
    queryFn: async (): Promise<Map<string, string>> => {
      const [editRes, tbRows] = await Promise.all([
        supabase.from("cay_node_edit").select("ma,ten,du_lieu").eq("kind", "tb"),
        fetchAllRows<{ ma_thiet_bi: string }>((from, to) =>
          supabase.from("thiet_bi").select("ma_thiet_bi").range(from, to),
        ),
      ]);
      if (editRes.error) throw editRes.error;
      const realMa = new Set<string>(tbRows.map((r) => r.ma_thiet_bi));
      return buildDeviceNameOverrideMap(editRes.data as any, realMa);
    },
    staleTime: 30_000,
  });
}

/** 
 * Typed resolvers for Phase 10L - Normalizing Taxonomy References
 * Resolves ID or Code to a canonical { id, ma, label } object.
 */

export interface TaxonomyResolved {
  id: string;
  ma: string;
  label: string;
}

export function resolvePhanLoai(ref: string | null | undefined, taxonomy: DbTaxonomy | undefined): TaxonomyResolved {
  const id = ref || "KHAC";
  const label = taxonomy?.plNameMap.get(id) || id;
  return { id, ma: id, label };
}

export function resolveNhom(ref: string | null | undefined, taxonomy: DbTaxonomy | undefined): TaxonomyResolved {
  const id = ref || "KHAC";
  const label = taxonomy?.nhomNameMap.get(id) || taxonomy?.nhomMaMap.get(id) || id;
  const ma = taxonomy?.nhomList.find(n => n.id === id)?.ma || id;
  return { id, ma, label };
}

export function resolveHeThong(ref: string | null | undefined, taxonomy: DbTaxonomy | undefined): TaxonomyResolved {
  const ma = ref || NONE_HT;
  const parsed = parseHtSysMa(ma);
  const sysId = parsed.sysName;
  
  if (!sysId || sysId === NONE_HT) {
    return { id: NONE_HT, ma: NONE_HT, label: "Hệ thống khác" };
  }

  const label = taxonomy?.htNameMap.get(sysId) || taxonomy?.htMaMap.get(sysId) || sysId;
  const canonicalMa = taxonomy?.htList.find(h => h.id === sysId || h.ma === sysId)?.ma || sysId;
  
  return { id: sysId, ma: canonicalMa, label };

}

export function resolveThietBi(d: DbDevice, overrides?: Map<string, any>): TaxonomyResolved {
  const label = overrides?.get(`tb:${d.ma_thiet_bi}`)?.ten || d.ten || d.ma_thiet_bi;
  return { id: d.id, ma: d.ma_thiet_bi, label };
}

