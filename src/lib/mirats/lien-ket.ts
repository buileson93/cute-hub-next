// ============================================================================
// Liên kết hệ thống — DỊCH VỤ ĐỌC/GHI (React Query hooks).
// Bảng `lien_ket_he_thong` là nguồn chuẩn; view `v_do_thi_he_thong` dùng để vẽ.
// RLS lọc theo đơn vị người dùng (hoặc người quản lý xem tất cả).
// Logic thuần (dựng đồ thị, phân tích tác động) nằm ở system-graph.ts.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import type { DoThiRow, Lop, Huong, TrangThaiLienKet } from "./system-graph";

export interface LoaiLienKet {
  id: string;
  ma: string;
  ten: string;
  mo_ta: string | null;
  mau_sac: string;
  kieu_net: string;
  thu_tu: number;
}

export interface LienKetRow {
  id: string;
  he_thong_nguon_id: string;
  he_thong_dich_id: string;
  loai_lien_ket_id: string;
  lop: Lop;
  huong: Huong;
  giao_dien_nguon: string | null;
  giao_dien_dich: string | null;
  giao_thuc: string | null;
  mo_ta_tin_hieu: string | null;
  vai_tro_du_phong: "chinh" | "du_phong" | null;
  trang_thai: TrangThaiLienKet;
  hieu_luc_tu: string | null;
  hieu_luc_den: string | null;
  don_vi_id_snapshot: string | null;
  ghi_chu: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeThongOption {
  id: string;
  ma: string;
  ten: string;
}

/** Danh mục loại liên kết. */
export function useLoaiLienKet() {
  const q = useQuery({
    queryKey: ["dm_loai_lien_ket"],
    staleTime: 300_000,
    queryFn: async (): Promise<LoaiLienKet[]> => {
      const { data, error } = await supabase
        .from("dm_loai_lien_ket")
        .select("id, ma, ten, mo_ta, mau_sac, kieu_net, thu_tu")
        .eq("active", true)
        .order("thu_tu", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LoaiLienKet[];
    },
  });
  return { ...q, loaiList: q.data ?? [] };
}

/** Đồ thị hệ thống (đọc từ view, RLS lọc theo đơn vị) — dùng để vẽ & phân tích. */
export function useDoThiHeThong() {
  const q = useQuery({
    queryKey: ["v_do_thi_he_thong"],
    staleTime: 20_000,
    queryFn: async (): Promise<DoThiRow[]> => {
      const { data, error } = await supabase.from("v_do_thi_he_thong").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as DoThiRow[];
    },
  });
  return { ...q, rows: q.data ?? [] };
}

/** Danh sách hệ thống cho ô chọn nguồn/đích. */
export function useHeThongPickList() {
  const q = useQuery({
    queryKey: ["lien_ket_he_thong_pick"],
    staleTime: 60_000,
    queryFn: async (): Promise<HeThongOption[]> => {
      const { data, error } = await supabase
        .from("dm_he_thong")
        .select("id, ma, ten")
        .eq("active", true)
        .order("ten", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HeThongOption[];
    },
  });
  return { ...q, heThongList: q.data ?? [] };
}

/** Liên kết đi/đến của một hệ thống cụ thể (cho tab chi tiết). */
export function useLienKetCuaHeThong(heThongId: string | undefined) {
  const q = useQuery({
    queryKey: ["lien_ket_he_thong_cua", heThongId],
    enabled: !!heThongId,
    staleTime: 20_000,
    queryFn: async (): Promise<DoThiRow[]> => {
      const { data, error } = await supabase
        .from("v_do_thi_he_thong")
        .select("*")
        .or(`nguon_id.eq.${heThongId},dich_id.eq.${heThongId}`);
      if (error) throw error;
      return (data ?? []) as unknown as DoThiRow[];
    },
  });
  return { ...q, rows: q.data ?? [] };
}

export interface ImpactRpcRow {
  he_thong_id: string;
  ma: string;
  ten: string;
  do_sau: number;
  duong_dan: string[];
}

/** Gọi RPC phân tích tác động (server-side). */
export function usePhanTichTacDong(heThongId: string | undefined) {
  const q = useQuery({
    queryKey: ["phan_tich_tac_dong", heThongId],
    enabled: !!heThongId,
    staleTime: 20_000,
    queryFn: async (): Promise<ImpactRpcRow[]> => {
      const { data, error } = await supabase.rpc("phan_tich_tac_dong", {
        p_he_thong_id: heThongId!,
      });
      if (error) throw error;
      return (data ?? []) as ImpactRpcRow[];
    },
  });
  return { ...q, impact: q.data ?? [] };
}

export interface AddLienKetInput {
  he_thong_nguon_id: string;
  he_thong_dich_id: string;
  loai_lien_ket_id: string;
  lop: Lop;
  huong: Huong;
  giao_dien_nguon?: string | null;
  giao_dien_dich?: string | null;
  giao_thuc?: string | null;
  mo_ta_tin_hieu?: string | null;
  vai_tro_du_phong?: "chinh" | "du_phong" | null;
  ghi_chu?: string | null;
}

export function useAddLienKet() {
  const qc = useQueryClient();
  return useMutation({
    meta: {
      invalidates: [["v_do_thi_he_thong"], ["lien_ket_he_thong_cua"]],
      successMessage: "Đã tạo liên kết hệ thống",
      errorMessage: "Không tạo được liên kết",
    },
    mutationFn: async (input: AddLienKetInput) => {
      const { error } = await supabase.from("lien_ket_he_thong").insert(input);
      if (error) throw error;
    },
    // Optimistic: chèn ngay 1 cạnh tạm vào view `v_do_thi_he_thong`.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["v_do_thi_he_thong"] });
      const prev = qc.getQueryData<DoThiRow[]>(["v_do_thi_he_thong"]);
      const optimistic: DoThiRow = {
        // Các trường không có sẽ được ghi đè khi refetch, chỉ cần đủ để render.
        id: `optimistic-${Date.now()}`,
        nguon_id: input.he_thong_nguon_id,
        dich_id: input.he_thong_dich_id,
        lop: input.lop,
        huong: input.huong,
        trang_thai: "hoat_dong",
      } as unknown as DoThiRow;
      qc.setQueryData<DoThiRow[]>(["v_do_thi_he_thong"], (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["v_do_thi_he_thong"], ctx.prev);
    },
  });
}

export function useUpdateLienKet() {
  return useMutation({
    meta: {
      invalidates: [["v_do_thi_he_thong"], ["lien_ket_he_thong_cua"]],
      successMessage: "Đã cập nhật liên kết",
      errorMessage: "Không cập nhật được liên kết",
    },
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AddLienKetInput & { trang_thai: TrangThaiLienKet }> }) => {
      const { error } = await supabase.from("lien_ket_he_thong").update(patch).eq("id", id);
      if (error) throw error;
    },
  });
}

export function useDeleteLienKet() {
  const qc = useQueryClient();
  return useMutation({
    meta: {
      invalidates: [["v_do_thi_he_thong"], ["lien_ket_he_thong_cua"]],
      successMessage: "Đã gỡ liên kết",
      errorMessage: "Không gỡ được liên kết",
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lien_ket_he_thong").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["v_do_thi_he_thong"] });
      const prev = qc.getQueryData<DoThiRow[]>(["v_do_thi_he_thong"]);
      qc.setQueryData<DoThiRow[]>(["v_do_thi_he_thong"], (old) => (old ?? []).filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["v_do_thi_he_thong"], ctx.prev);
    },
  });
}

export const LOP_LABEL: Record<Lop, string> = {
  vat_ly: "Vật lý",
  logic: "Logic",
};

export const HUONG_LABEL: Record<Huong, string> = {
  mot_chieu: "Một chiều",
  hai_chieu: "Hai chiều",
};

// ============================================================================
// Prompt 6 — TỔ CHỨC ĐA TẦNG + VIEW TOÀN CẢNH (nguồn từ DB, không hình vẽ tĩnh)
// ============================================================================

export interface ToChucRow {
  id: string;
  ma: string;
  ten: string;
  loai: "tong_cong_ty" | "don_vi_thanh_vien" | "co_quan_ngoai";
  to_chuc_cha_id: string | null;
  mau_sac: string | null;
  ghi_chu: string | null;
}

/** Cây tổ chức (dm_to_chuc) — dùng để gom cụm super-node. */
export function useToChuc() {
  const q = useQuery({
    queryKey: ["dm_to_chuc"],
    staleTime: 300_000,
    queryFn: async (): Promise<ToChucRow[]> => {
      const { data, error } = await supabase
        .from("dm_to_chuc")
        .select("id, ma, ten, loai, to_chuc_cha_id, mau_sac, ghi_chu")
        .eq("active", true)
        .order("thu_tu", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ToChucRow[];
    },
  });
  return { ...q, toChucList: q.data ?? [] };
}

/** Một node hệ thống toàn cảnh (từ view v_do_thi_toan_canh). */
export interface ToanCanhNode {
  id: string;
  ma: string;
  ten: string;
  pham_vi_quan_ly: string | null;
  ben_ngoai: boolean;
  nhom_ten: string | null;
  don_vi_ten: string | null;
  to_chuc_id: string | null;
  to_chuc_ma: string | null;
  to_chuc_ten: string | null;
  to_chuc_loai: string | null;
  to_chuc_mau: string | null;
  to_chuc_cha_id: string | null;
  to_chuc_so_huu: string | null;
  bac_lien_ket: number;
}

/** Nodes hệ thống toàn cảnh (kèm tổ chức + bậc liên kết). RLS lọc theo quyền. */
export function useDoThiToanCanh() {
  const q = useQuery({
    queryKey: ["v_do_thi_toan_canh"],
    staleTime: 20_000,
    queryFn: async (): Promise<ToanCanhNode[]> => {
      const { data, error } = await supabase.from("v_do_thi_toan_canh").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as ToanCanhNode[];
    },
  });
  return { ...q, nodes: q.data ?? [] };
}

/** Chi tiết 1 hệ thống + thành phần/khe + tài sản đang gắn (cho panel bên phải). */
export interface KheThietBi {
  thanh_phan_id: string;
  ma_thanh_phan: string | null;
  thanh_phan_ten: string;
  thiet_bi_id: string | null;
  thiet_bi_ten: string | null;
  thiet_bi_ma: string | null;
}
export interface HeThongChiTiet {
  id: string;
  ma: string;
  ten: string;
  pham_vi_quan_ly: string | null;
  don_vi_ten: string | null;
  nhom_ten: string | null;
  to_chuc_ten: string | null;
  khe: KheThietBi[];
}

export function useHeThongChiTiet(heThongId: string | undefined) {
  const q = useQuery({
    queryKey: ["he_thong_chi_tiet", heThongId],
    enabled: !!heThongId,
    staleTime: 20_000,
    queryFn: async (): Promise<HeThongChiTiet | null> => {
      const { data: ht, error: e1 } = await supabase
        .from("v_do_thi_toan_canh")
        .select("id, ma, ten, pham_vi_quan_ly, don_vi_ten, nhom_ten, to_chuc_ten")
        .eq("id", heThongId!)
        .maybeSingle();
      if (e1) throw e1;
      if (!ht) return null;

      // Thành phần (khe) đang hiệu lực của hệ thống
      const { data: tps, error: e2 } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten")
        .eq("he_thong_id", heThongId!)
        .is("hieu_luc_den", null)
        .order("thu_tu", { ascending: true });
      if (e2) throw e2;

      const tpIds = (tps ?? []).map((t) => t.id);
      const gan = new Map<string, { thiet_bi_id: string; ten: string | null; ma: string | null }>();
      if (tpIds.length) {
        const { data: g, error: e3 } = await supabase
          .from("gan_chuc_nang")
          .select("thanh_phan_id, thiet_bi_id, den_ngay, thiet_bi:thiet_bi_id(ten_thiet_bi, ma_thiet_bi)")
          .in("thanh_phan_id", tpIds)
          .is("den_ngay", null);
        if (e3) throw e3;
        for (const row of (g ?? []) as unknown as Array<{
          thanh_phan_id: string; thiet_bi_id: string;
          thiet_bi: { ten_thiet_bi: string | null; ma_thiet_bi: string | null } | null;
        }>) {
          gan.set(row.thanh_phan_id, {
            thiet_bi_id: row.thiet_bi_id,
            ten: row.thiet_bi?.ten_thiet_bi ?? null,
            ma: row.thiet_bi?.ma_thiet_bi ?? null,
          });
        }
      }

      const khe: KheThietBi[] = (tps ?? []).map((t) => {
        const g = gan.get(t.id);
        return {
          thanh_phan_id: t.id,
          ma_thanh_phan: t.ma_thanh_phan,
          thanh_phan_ten: t.ten,
          thiet_bi_id: g?.thiet_bi_id ?? null,
          thiet_bi_ten: g?.ten ?? null,
          thiet_bi_ma: g?.ma ?? null,
        };
      });

      return {
        id: ht.id ?? heThongId!,
        ma: ht.ma ?? "",
        ten: ht.ten ?? "",
        pham_vi_quan_ly: ht.pham_vi_quan_ly,
        don_vi_ten: ht.don_vi_ten,
        nhom_ten: ht.nhom_ten,
        to_chuc_ten: ht.to_chuc_ten,
        khe,
      };
    },
  });
  return { ...q, chiTiet: q.data ?? null };
}


// ============================================================================
// DRILL TẦNG 3 — Liên kết THÀNH PHẦN/KHE bên trong MỘT hệ thống.
// Bảng nguồn: `lien_ket_khe` (khe_nguon_id / khe_dich_id -> he_thong_thanh_phan).
// Phạm vi: chỉ các thành phần thuộc CÙNG một hệ thống.
// ============================================================================

/** Một thành phần (khe) của hệ thống + tài sản vật lý đang gắn (nếu có). */
export interface KheNode {
  id: string;
  ma: string | null;
  ten: string;
  thiet_bi_ten: string | null;
  thiet_bi_ma: string | null;
}

/** Một liên kết giữa hai thành phần trong cùng hệ thống. */
export interface KheLink {
  id: string;
  khe_nguon_id: string;
  khe_dich_id: string;
  loai_lien_ket_id: string;
  loai_ten: string | null;
  mau_sac: string;
  giao_dien_nguon: string | null;
  giao_dien_dich: string | null;
  ghi_chu: string | null;
}

export interface KheDoThi {
  don_vi_id: string | null;
  nodes: KheNode[];
  links: KheLink[];
}

/** Đọc đồ thị nội bộ (thành phần + liên kết khe) của một hệ thống. */
export function useKheDoThi(heThongId: string | undefined) {
  const q = useQuery({
    queryKey: ["khe_do_thi", heThongId],
    enabled: !!heThongId,
    staleTime: 15_000,
    queryFn: async (): Promise<KheDoThi> => {
      // Đơn vị của hệ thống — để gán snapshot khi tạo liên kết (cho người xem cùng đơn vị).
      const { data: ht, error: eHt } = await supabase
        .from("dm_he_thong").select("don_vi_id").eq("id", heThongId!).maybeSingle();
      if (eHt) throw eHt;

      // Thành phần đang hiệu lực của hệ thống.
      const { data: tps, error: e2 } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten")
        .eq("he_thong_id", heThongId!)
        .is("hieu_luc_den", null)
        .order("thu_tu", { ascending: true });
      if (e2) throw e2;

      const tpIds = (tps ?? []).map((t) => t.id);
      const idSet = new Set(tpIds);

      // Tài sản vật lý đang gắn ở từng thành phần.
      const gan = new Map<string, { ten: string | null; ma: string | null }>();
      if (tpIds.length) {
        const { data: g, error: e3 } = await supabase
          .from("gan_chuc_nang")
          .select("thanh_phan_id, thiet_bi:thiet_bi_id(ten_thiet_bi, ma_thiet_bi)")
          .in("thanh_phan_id", tpIds)
          .is("den_ngay", null);
        if (e3) throw e3;
        for (const row of (g ?? []) as unknown as Array<{
          thanh_phan_id: string;
          thiet_bi: { ten_thiet_bi: string | null; ma_thiet_bi: string | null } | null;
        }>) {
          gan.set(row.thanh_phan_id, {
            ten: row.thiet_bi?.ten_thiet_bi ?? null,
            ma: row.thiet_bi?.ma_thiet_bi ?? null,
          });
        }
      }

      const nodes: KheNode[] = (tps ?? []).map((t) => {
        const g = gan.get(t.id);
        return {
          id: t.id,
          ma: t.ma_thanh_phan,
          ten: t.ten,
          thiet_bi_ten: g?.ten ?? null,
          thiet_bi_ma: g?.ma ?? null,
        };
      });

      // Liên kết khe: nguồn thuộc hệ thống này, giữ lại các cạnh có đích cũng thuộc hệ thống.
      let links: KheLink[] = [];
      if (tpIds.length) {
        const { data: lk, error: e4 } = await supabase
          .from("lien_ket_khe")
          .select("id, khe_nguon_id, khe_dich_id, loai_lien_ket_id, giao_dien_nguon, giao_dien_dich, ghi_chu, loai:loai_lien_ket_id(ten, mau_sac)")
          .in("khe_nguon_id", tpIds)
          .is("hieu_luc_den", null);
        if (e4) throw e4;
        links = ((lk ?? []) as unknown as Array<{
          id: string; khe_nguon_id: string; khe_dich_id: string; loai_lien_ket_id: string;
          giao_dien_nguon: string | null; giao_dien_dich: string | null; ghi_chu: string | null;
          loai: { ten: string | null; mau_sac: string | null } | null;
        }>)
          .filter((r) => idSet.has(r.khe_dich_id))
          .map((r) => ({
            id: r.id,
            khe_nguon_id: r.khe_nguon_id,
            khe_dich_id: r.khe_dich_id,
            loai_lien_ket_id: r.loai_lien_ket_id,
            loai_ten: r.loai?.ten ?? null,
            mau_sac: r.loai?.mau_sac ?? "#94a3b8",
            giao_dien_nguon: r.giao_dien_nguon,
            giao_dien_dich: r.giao_dien_dich,
            ghi_chu: r.ghi_chu,
          }));
      }

      return { don_vi_id: (ht?.don_vi_id as string | null) ?? null, nodes, links };
    },
  });
  return { ...q, doThi: q.data ?? { don_vi_id: null, nodes: [], links: [] } };
}

export interface ThemKheLienKetInput {
  he_thong_id: string;
  khe_nguon_id: string;
  khe_dich_id: string;
  loai_lien_ket_id: string;
  don_vi_id_snapshot: string | null;
  giao_dien_nguon?: string | null;
  giao_dien_dich?: string | null;
  ghi_chu?: string | null;
}

/** Tạo liên kết giữa hai thành phần (khe) trong cùng hệ thống. */
export function useThemKheLienKet() {
  const qc = useQueryClient();
  return useMutation({
    meta: {
      successMessage: "Đã tạo liên kết thành phần",
      errorMessage: "Không tạo được liên kết",
    },
    mutationFn: async (input: ThemKheLienKetInput) => {
      const { he_thong_id: _ht, ...rest } = input;
      const { data, error } = await supabase
        .from("lien_ket_khe")
        .insert({
          khe_nguon_id: rest.khe_nguon_id,
          khe_dich_id: rest.khe_dich_id,
          loai_lien_ket_id: rest.loai_lien_ket_id,
          don_vi_id_snapshot: rest.don_vi_id_snapshot,
          giao_dien_nguon: rest.giao_dien_nguon ?? null,
          giao_dien_dich: rest.giao_dien_dich ?? null,
          ghi_chu: rest.ghi_chu ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    // Optimistic: chèn ngay cạnh vào đồ thị nội bộ để UI kéo-thả phản hồi tức thì.
    onMutate: async (input) => {
      const key = ["khe_do_thi", input.he_thong_id] as const;
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<KheDoThi>(key);
      const loai = qc.getQueryData<LoaiLienKet[]>(["dm_loai_lien_ket"])?.find(
        (l) => l.id === input.loai_lien_ket_id,
      );
      const optimistic: KheLink = {
        id: `optimistic-${Date.now()}`,
        khe_nguon_id: input.khe_nguon_id,
        khe_dich_id: input.khe_dich_id,
        loai_lien_ket_id: input.loai_lien_ket_id,
        loai_ten: loai?.ten ?? null,
        mau_sac: loai?.mau_sac ?? "#94a3b8",
        giao_dien_nguon: input.giao_dien_nguon ?? null,
        giao_dien_dich: input.giao_dien_dich ?? null,
        ghi_chu: input.ghi_chu ?? null,
      };
      qc.setQueryData<KheDoThi>(key, (old) =>
        old ? { ...old, links: [...old.links, optimistic] } : old,
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ["khe_do_thi", v.he_thong_id] });
    },
  });
}

/** Gỡ (xóa) một liên kết khe. */
export function useXoaKheLienKet() {
  const qc = useQueryClient();
  return useMutation({
    meta: {
      successMessage: "Đã gỡ liên kết thành phần",
      errorMessage: "Không gỡ được liên kết",
    },
    mutationFn: async (input: { id: string; he_thong_id: string }) => {
      const { error } = await supabase.from("lien_ket_khe").delete().eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const key = ["khe_do_thi", input.he_thong_id] as const;
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<KheDoThi>(key);
      qc.setQueryData<KheDoThi>(key, (old) =>
        old ? { ...old, links: old.links.filter((l) => l.id !== input.id) } : old,
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ["khe_do_thi", v.he_thong_id] });
    },
  });
}
