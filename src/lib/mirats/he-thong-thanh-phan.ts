// ============================================================================
// Vị trí chức năng (he_thong_thanh_phan) + lịch sử gán (gan_chuc_nang).
// Mô hình 3 lớp: Hệ thống -> Vị trí chức năng -> Tài sản cụ thể.
//   - NHỊP I (cấu trúc): khai thêm / sửa / ngừng vị trí chức năng.
//   - NHỊP II (vận hành): lắp / tháo / thay thế / điều chuyển tài sản (RPC atomic).
// Ô "tài sản đang lắp" là CHỈ-ĐỌC, suy ra từ dòng gan_chuc_nang hiệu lực.
// ============================================================================
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "./paginate";
import { logThanhPhanInsertFailure } from "./thanh-phan-log.functions";


export type TrangThaiViTri = "hoat_dong" | "ngung";

/**
 * Lọc tài sản ĐỦ ĐIỀU KIỆN gán vào một vị trí:
 *  - danh sách `ranh` đã là tài sản RẢNH (không có dòng gán hiệu lực);
 *  - nếu vị trí yêu cầu loại (`loaiYeuCau`) thì chỉ giữ tài sản đúng loại.
 * Hàm thuần để test độc lập (không phụ thuộc React/CSDL).
 */
export function filterEligibleDevices<T extends { loai_thiet_bi_id: string | null }>(
  ranh: T[],
  loaiYeuCau: string | null,
): T[] {
  if (!loaiYeuCau) return ranh;
  return ranh.filter((r) => r.loai_thiet_bi_id === loaiYeuCau);
}

/**
 * Xếp hạng tài sản RẢNH để lắp/thay thế vào vị trí: KHÔNG loại bỏ tài sản
 * khác loại (CSDL không ràng buộc loại) — giữ TẤT CẢ, đưa tài sản đúng loại
 * yêu cầu lên đầu, kèm cờ `khopLoai` để giao diện gợi ý. Cho phép đổi sang
 * bất kỳ tài sản nào đang rảnh.
 */
export function rankEligibleDevices<T extends { loai_thiet_bi_id: string | null }>(
  ranh: T[],
  loaiYeuCau: string | null,
): (T & { khopLoai: boolean })[] {
  return ranh
    .map((r) => ({ ...r, khopLoai: !loaiYeuCau || r.loai_thiet_bi_id === loaiYeuCau }))
    .sort((a, b) => Number(b.khopLoai) - Number(a.khopLoai));
}

/**
 * Xếp hạng cho picker "chọn tất cả": KHÔNG lọc bỏ tài sản đang lắp nơi khác.
 * Thứ tự ưu tiên: (1) tài sản RẢNH lên trên tài sản đang lắp, (2) trong mỗi
 * nhóm, tài sản đúng phân loại yêu cầu lên đầu. Cho phép tìm & chọn mọi thiết
 * bị; nếu chọn tài sản đang lắp nơi khác thì giao diện sẽ điều chuyển.
 */
export function rankChonDevices<T extends { loai_thiet_bi_id: string | null; dangLap: boolean }>(
  list: T[],
  loaiYeuCau: string | null,
): (T & { khopLoai: boolean })[] {
  return list
    .map((r) => ({ ...r, khopLoai: !loaiYeuCau || r.loai_thiet_bi_id === loaiYeuCau }))
    .sort(
      (a, b) =>
        Number(a.dangLap) - Number(b.dangLap) || Number(b.khopLoai) - Number(a.khopLoai),
    );
}

export interface ViTriChucNang {
  id: string;
  he_thong_id: string;
  ma_thanh_phan: string;
  ten: string;
  loai_thiet_bi_yeu_cau: string | null;
  thanh_phan_cha: string | null;
  bat_buoc: boolean;
  thu_tu: number | null;
  mo_ta: string | null;
  trang_thai: TrangThaiViTri;
  hieu_luc_tu: string | null;
  hieu_luc_den: string | null;
  vi_tri_id: string | null;
  trang_thai_id: string | null;
}

/** Tài sản đang giữ một vị trí (đọc từ dòng gan_chuc_nang den_ngay IS NULL). */
export interface ThietBiDangLap {
  gan_id: string;
  thanh_phan_id: string;
  thiet_bi_id: string;
  tu_ngay: string;
  ly_do: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
  ma_serial: string | null;
}

export interface ThietBiRanh {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
  ma_serial: string | null;
  loai_thiet_bi_id: string | null;
  don_vi_quan_ly_id: string | null;
  trang_thai_ma: string | null;
  trang_thai_ten: string | null;
  /** Số vị trí chức năng tài sản này đang đảm trách (0 = chưa lắp ở đâu). */
  soLanLap: number;
  /** Một vị trí đang lắp làm ví dụ hiển thị (null nếu chưa lắp). */
  viTriHienTai: string | null;
}

const KEY = {
  viTri: (htId: string) => ["vi-tri-chuc-nang", htId] as const,
  dangLap: (htId: string) => ["thiet-bi-dang-lap", htId] as const,
  ranh: ["thiet-bi-ranh"] as const,
};

/** Danh sách vị trí chức năng của một hệ thống. */
export function useViTriChucNang(heThongId: string) {
  return useQuery({
    queryKey: KEY.viTri(heThongId),
    enabled: Boolean(heThongId),
    queryFn: async (): Promise<ViTriChucNang[]> => {
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, he_thong_id, ma_thanh_phan, ten, loai_thiet_bi_yeu_cau, thanh_phan_cha, bat_buoc, thu_tu, mo_ta, trang_thai, hieu_luc_tu, hieu_luc_den, vi_tri_id, trang_thai_id")
        .eq("he_thong_id", heThongId)
        .is("deleted_at" as never, null)
        .order("thu_tu", { ascending: true, nullsFirst: false })
        .order("ma_thanh_phan", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ViTriChucNang[];
    },
  });
}

/** Tài sản đang lắp tại các vị trí của một hệ thống (map theo thanh_phan_id). */
export function useThietBiDangLap(heThongId: string) {
  return useQuery({
    queryKey: KEY.dangLap(heThongId),
    enabled: Boolean(heThongId),
    queryFn: async (): Promise<Map<string, ThietBiDangLap>> => {
      const { data, error } = await supabase
        .from("gan_chuc_nang")
        .select("id, thanh_phan_id, thiet_bi_id, tu_ngay, ly_do, he_thong_thanh_phan!inner(he_thong_id), thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi, ma_serial)")
        .is("den_ngay", null)
        .eq("he_thong_thanh_phan.he_thong_id", heThongId);
      if (error) throw error;
      const m = new Map<string, ThietBiDangLap>();
      for (const r of (data ?? []) as unknown as Array<{
        id: string; thanh_phan_id: string; thiet_bi_id: string; tu_ngay: string; ly_do: string;
        thiet_bi: { ma_thiet_bi: string; ten_thiet_bi: string | null; ma_serial: string | null } | null;
      }>) {
        m.set(r.thanh_phan_id, {
          gan_id: r.id, thanh_phan_id: r.thanh_phan_id, thiet_bi_id: r.thiet_bi_id,
          tu_ngay: r.tu_ngay, ly_do: r.ly_do,
          ma_thiet_bi: r.thiet_bi?.ma_thiet_bi ?? "",
          ten_thiet_bi: r.thiet_bi?.ten_thiet_bi ?? null,
          ma_serial: r.thiet_bi?.ma_serial ?? null,
        });
      }
      return m;
    },
  });
}

/** Tài sản có thể gán: TẤT CẢ tài sản chưa thanh lý.
 *  Với mô hình many-to-one (nhiều thành phần → 1 tài sản), một tài sản vật
 *  lý có thể đảm trách nhiều chức năng, nên KHÔNG chủng loại đang lắp ở
 *  nơi khác. Trả kèm số vị trí đang phục vụ (soLanLap) và tên vị trí gần nhất
 *  (viTriHienTai) để UI hiển thị badge. */
export function useThietBiRanh() {
  return useQuery({
    queryKey: KEY.ranh,
    queryFn: async (): Promise<ThietBiRanh[]> => {
      const [busyRows, tbRows] = await Promise.all([
        fetchAllRows<{
          thiet_bi_id: string;
          he_thong_thanh_phan: { ten: string | null; dm_he_thong: { ten: string | null } | null } | null;
        }>((from, to) =>
          supabase
            .from("gan_chuc_nang")
            .select("thiet_bi_id, he_thong_thanh_phan:thanh_phan_id(ten, dm_he_thong:he_thong_id(ten))")
            .is("den_ngay", null)
            .range(from, to),
        ),
        fetchAllRows<{
          id: string; ma_thiet_bi: string; ten_thiet_bi: string | null; ma_serial: string | null;
          loai_thiet_bi_id: string | null; don_vi_quan_ly_id: string | null;
          dm_trang_thai_thiet_bi: { ma: string; ten: string } | null;
        }>((from, to) =>
          supabase
            .from("thiet_bi")
            .select("id, ma_thiet_bi, ten_thiet_bi, ma_serial, loai_thiet_bi_id, don_vi_quan_ly_id, dm_trang_thai_thiet_bi:trang_thai_id(ma, ten)")
            .order("ma_thiet_bi")
            .range(from, to),
        ),
      ]);
      const busyLabel = new Map<string, string | null>();
      const busyCount = new Map<string, number>();
      for (const b of busyRows) {
        const ht = b.he_thong_thanh_phan?.dm_he_thong?.ten ?? "";
        const tp = b.he_thong_thanh_phan?.ten ?? "";
        busyLabel.set(b.thiet_bi_id, [ht, tp].filter(Boolean).join(" · ") || null);
        busyCount.set(b.thiet_bi_id, (busyCount.get(b.thiet_bi_id) ?? 0) + 1);
      }
      return tbRows
        .filter((r) => r.dm_trang_thai_thiet_bi?.ma !== "THANH_LY")
        .map((r) => ({
          id: r.id, ma_thiet_bi: r.ma_thiet_bi, ten_thiet_bi: r.ten_thiet_bi, ma_serial: r.ma_serial,
          loai_thiet_bi_id: r.loai_thiet_bi_id, don_vi_quan_ly_id: r.don_vi_quan_ly_id,
          trang_thai_ma: r.dm_trang_thai_thiet_bi?.ma ?? null,
          trang_thai_ten: r.dm_trang_thai_thiet_bi?.ten ?? null,
          soLanLap: busyCount.get(r.id) ?? 0,
          viTriHienTai: busyLabel.get(r.id) ?? null,
        }));
    },
  });
}


/** Tài sản có thể CHỌN để lắp/thay: TẤT CẢ tài sản chưa thanh lý (kể cả
 *  đang lắp ở nơi khác). Kèm cờ `dangLap` + vị trí hiện tại để giao diện gợi ý. */
export interface ThietBiChon extends ThietBiRanh {
  dangLap: boolean;
}

export function useThietBiChon() {
  return useQuery({
    queryKey: ["thiet-bi-chon"] as const,
    queryFn: async (): Promise<ThietBiChon[]> => {
      const [busyRows, tbRows] = await Promise.all([
        fetchAllRows<{
          thiet_bi_id: string;
          he_thong_thanh_phan: { ten: string | null; dm_he_thong: { ten: string | null } | null } | null;
        }>((from, to) =>
          supabase
            .from("gan_chuc_nang")
            .select("thiet_bi_id, he_thong_thanh_phan:thanh_phan_id(ten, dm_he_thong:he_thong_id(ten))")
            .is("den_ngay", null)
            .range(from, to),
        ),
        fetchAllRows<{
          id: string; ma_thiet_bi: string; ten_thiet_bi: string | null; ma_serial: string | null;
          loai_thiet_bi_id: string | null; don_vi_quan_ly_id: string | null;
          dm_trang_thai_thiet_bi: { ma: string; ten: string } | null;
        }>((from, to) =>
          supabase
            .from("thiet_bi")
            .select("id, ma_thiet_bi, ten_thiet_bi, ma_serial, loai_thiet_bi_id, don_vi_quan_ly_id, dm_trang_thai_thiet_bi:trang_thai_id(ma, ten)")
            .order("ma_thiet_bi")
            .range(from, to),
        ),
      ]);
      const busyLabel = new Map<string, string | null>();
      const busyCount = new Map<string, number>();
      for (const b of busyRows) {
        const ht = b.he_thong_thanh_phan?.dm_he_thong?.ten ?? "";
        const tp = b.he_thong_thanh_phan?.ten ?? "";
        busyLabel.set(b.thiet_bi_id, [ht, tp].filter(Boolean).join(" · ") || null);
        busyCount.set(b.thiet_bi_id, (busyCount.get(b.thiet_bi_id) ?? 0) + 1);
      }
      return tbRows
        .filter((r) => r.dm_trang_thai_thiet_bi?.ma !== "THANH_LY")
        .map((r) => ({
          id: r.id, ma_thiet_bi: r.ma_thiet_bi, ten_thiet_bi: r.ten_thiet_bi, ma_serial: r.ma_serial,
          loai_thiet_bi_id: r.loai_thiet_bi_id, don_vi_quan_ly_id: r.don_vi_quan_ly_id,
          trang_thai_ma: r.dm_trang_thai_thiet_bi?.ma ?? null,
          trang_thai_ten: r.dm_trang_thai_thiet_bi?.ten ?? null,
          soLanLap: busyCount.get(r.id) ?? 0,
          viTriHienTai: busyLabel.get(r.id) ?? null,
          dangLap: busyLabel.has(r.id),
        }));
    },
  });
}


/** Vị trí chức năng kèm tài sản đang lắp (nếu có), dùng cho cây tổng. */
export interface ViTriChucNangTree extends ViTriChucNang {
  device: { thiet_bi_id: string; ma_thiet_bi: string; ten_thiet_bi: string | null; ma_serial: string | null } | null;
}

/**
 * Nạp TOÀN BỘ vị trí chức năng của mọi hệ thống trong 1 lượt, gom theo
 * he_thong_id, kèm tài sản đang lắp (gan_chuc_nang hiệu lực). Dùng cho cây
 * tổng nơi không thể gọi hook theo từng hệ thống.
 */
export function useAllViTriChucNang() {
  return useQuery({
    queryKey: ["vi-tri-chuc-nang-all"] as const,
    queryFn: async (): Promise<Map<string, ViTriChucNangTree[]>> => {
      const fetchAll = async <T,>(build: (from: number, to: number) => any): Promise<T[]> => {
        const pageSize = 1000;
        let from = 0;
        const out: T[] = [];
        for (;;) {
          const { data, error } = await build(from, from + pageSize - 1);
          if (error) throw error;
          const rows = (data ?? []) as T[];
          out.push(...rows);
          if (rows.length < pageSize) break;
          from += pageSize;
        }
        return out;
      };
      const [vtRows, ganRows] = await Promise.all([
        fetchAll<ViTriChucNang>((from, to) =>
          supabase
            .from("he_thong_thanh_phan")
            .select("id, he_thong_id, ma_thanh_phan, ten, loai_thiet_bi_yeu_cau, thanh_phan_cha, bat_buoc, thu_tu, mo_ta, trang_thai, hieu_luc_tu, hieu_luc_den, vi_tri_id, trang_thai_id")
            .is("deleted_at" as never, null)
            .order("thu_tu", { ascending: true, nullsFirst: false })
            .order("ma_thanh_phan", { ascending: true })
            .range(from, to),
        ),
        fetchAll<{
          thanh_phan_id: string; thiet_bi_id: string;
          thiet_bi: { ma_thiet_bi: string; ten_thiet_bi: string | null; ma_serial: string | null } | null;
        }>((from, to) =>
          supabase
            .from("gan_chuc_nang")
            .select("thanh_phan_id, thiet_bi_id, thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi, ma_serial)")
            .is("den_ngay", null)
            .range(from, to),
        ),
      ]);

      const devByPos = new Map<string, ViTriChucNangTree["device"]>();
      for (const g of ganRows) {
        devByPos.set(g.thanh_phan_id, {
          thiet_bi_id: g.thiet_bi_id,
          ma_thiet_bi: g.thiet_bi?.ma_thiet_bi ?? "",
          ten_thiet_bi: g.thiet_bi?.ten_thiet_bi ?? null,
          ma_serial: g.thiet_bi?.ma_serial ?? null,
        });
      }
      const out = new Map<string, ViTriChucNangTree[]>();
      for (const v of vtRows) {
        const row: ViTriChucNangTree = { ...v, device: devByPos.get(v.id) ?? null };
        const arr = out.get(v.he_thong_id) ?? [];
        arr.push(row);
        out.set(v.he_thong_id, arr);
      }
      return out;
    },
  });
}

/** Làm mới toàn bộ dữ liệu liên quan sau một thao tác. */
function useInvalidate(heThongId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY.viTri(heThongId) });
    qc.invalidateQueries({ queryKey: KEY.dangLap(heThongId) });
    qc.invalidateQueries({ queryKey: KEY.ranh });
    qc.invalidateQueries({ queryKey: ["thiet-bi-chon"] });
    qc.invalidateQueries({ queryKey: ["thiet-bi-picker"] });
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    // Cây/list view tổng đọc từ useAllViTriChucNang — phải làm mới cùng lúc,
    // tránh trạng thái sidebar còn "pin" tài sản đã tháo trong CSDL.
    qc.invalidateQueries({ queryKey: ["vi-tri-chuc-nang-all"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-vi-tri"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-thanh-phan"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-he-thong"] });
    qc.invalidateQueries({ queryKey: ["ly-lich-thiet-bi"] });
    qc.invalidateQueries({ queryKey: ["vai-tro-thiet-bi"] });
    // Các view/graph khác cùng đọc gan_chuc_nang / he_thong_thanh_phan.
    qc.invalidateQueries({ queryKey: ["thanh_phan_cua_he_thong"] });
    qc.invalidateQueries({ queryKey: ["thanh-phan-toan-cuc"] });
    qc.invalidateQueries({ queryKey: ["net-all-thanh-phan"] });
    qc.invalidateQueries({ queryKey: ["net-inline-inner"] });
    qc.invalidateQueries({ queryKey: ["operations_data"] });
  };
}

// ---- NHỊP I: CRUD vị trí chức năng ----------------------------------------
export function useLuuViTri(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (input: Partial<ViTriChucNang> & { he_thong_id: string; ma_thanh_phan: string; ten: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("he_thong_thanh_phan").update(rest).eq("id", id);
        if (error) throw error;
        return id;
      }
      // don_vi_id_snapshot được trigger `trg_sync_thanh_phan_don_vi` (BEFORE INSERT)
      // tự điền từ dm_he_thong.don_vi_id; cast để bỏ qua yêu cầu NOT NULL trong type sinh tự động.
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .insert(input as never)
        .select("id")
        .single();
      if (error) {
        // Ghi log server-side (bypass RLS) để truy vết — không chặn luồng lỗi UI.
        void logThanhPhanInsertFailure({
          data: {
            reason: error.message,
            code: (error as { code?: string }).code ?? null,
            payload: input as unknown as Record<string, unknown>,
            he_thong_id: input.he_thong_id,
            ma_thanh_phan: input.ma_thanh_phan,
          },
        }).catch(() => {
          /* nuốt lỗi log — không được che lỗi gốc */
        });
        throw error;
      }
      return data.id as string;

    },
    onSuccess: invalidate,
  });
}

export function useNgungViTri(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (viTriId: string) => {
      const { error } = await supabase.from("he_thong_thanh_phan").update({ trang_thai: "ngung" }).eq("id", viTriId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/**
 * Xoá thành phần (chỉ khi CHƯA có lịch sử gán tài sản). Dùng cho trường hợp
 * khai nhầm trong Edit Mode — nếu đã có lịch sử, dùng "Ngừng" thay vì xoá.
 */
export function useXoaViTri(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (viTriId: string) => {
      const { count, error: cErr } = await supabase
        .from("gan_chuc_nang").select("id", { count: "exact", head: true }).eq("thanh_phan_id", viTriId);
      if (cErr) throw cErr;
      if ((count ?? 0) > 0) throw new Error("Thành phần đã có lịch sử lắp/tháo tài sản — không xoá được. Hãy dùng 'Ngừng'.");
      const { error } = await supabase.from("he_thong_thanh_phan").delete().eq("id", viTriId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/**
 * Xoá thành phần KỂ CẢ khi đã có lịch sử — chỉ dùng cho admin (UI phải confirm).
 * FK cascade sẽ tự xoá `gan_chuc_nang` liên quan; `su_co/bao_tri/hong_hoc` set null.
 * Cũng đếm sẵn số bản ghi lịch sử để UI cảnh báo trước khi xoá.
 */
export function useDemLichSuThanhPhan(viTriId: string | null) {
  return useQuery({
    queryKey: ["thanh-phan-history-count", viTriId],
    enabled: !!viTriId,
    queryFn: async () => {
      const [g, s, b, h] = await Promise.all([
        supabase.from("gan_chuc_nang").select("id", { count: "exact", head: true }).eq("thanh_phan_id", viTriId!),
        supabase.from("su_co").select("id", { count: "exact", head: true }).eq("thanh_phan_id", viTriId!),
        supabase.from("bao_tri").select("id", { count: "exact", head: true }).eq("thanh_phan_id", viTriId!),
        supabase.from("hong_hoc").select("id", { count: "exact", head: true }).eq("thanh_phan_id", viTriId!),
      ]);
      return {
        gan: g.count ?? 0,
        suCo: s.count ?? 0,
        baoTri: b.count ?? 0,
        hongHoc: h.count ?? 0,
      };
    },
  });
}

export interface XoaCuongBucKetQua {
  affected: { gan_chuc_nang: number; gan_chuc_nang_detached: number; su_co: number; bao_tri: number; hong_hoc: number };
}

/** Xoá cưỡng bức (soft-delete) qua RPC — kiểm quyền, đóng gan_chuc_nang đang hoạt động,
 *  ghi audit_log kèm số bản ghi liên quan + lý do. Trả về số bản ghi bị ảnh hưởng. */
export function useXoaViTriForce(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (args: { viTriId: string; lyDo?: string }): Promise<XoaCuongBucKetQua> => {
      const { data, error } = await (supabase.rpc as any)("xoa_thanh_phan_cuong_buc", {
        v_id: args.viTriId,
        v_reason: args.lyDo ?? null,
      });
      if (error) throw error;
      return data as XoaCuongBucKetQua;
    },
    onSuccess: invalidate,
  });
}

export interface XemTruocXoaTP {
  thanh_phan: { id: string; ma_thanh_phan: string; ten: string; he_thong_id: string; trang_thai: string; deleted_at: string | null };
  counts: { gan: number; su_co: number; bao_tri: number; hong_hoc: number };
  samples: {
    gan: Array<{ id: string; thiet_bi_id: string; ma_thiet_bi: string | null; ma_serial: string | null; tu_ngay: string | null; den_ngay: string | null; ly_do: string | null }>;
    su_co: Array<{ id: string; ma_su_co: string | null; tieu_de: string | null; trang_thai: string | null; thoi_diem_phat_hien: string | null }>;
    bao_tri: Array<{ id: string; ma_bao_tri: string | null; tieu_de: string | null; trang_thai: string | null; ngay_thuc_hien: string | null }>;
    hong_hoc: Array<{ id: string; ma_hong_hoc: string | null; mo_ta: string | null; trang_thai: string | null; ngay_phat_hien: string | null }>;
  };
}

/** Xem trước hậu quả xoá: đếm và lấy tối đa 5 dòng mẫu cho mỗi bảng liên quan. */
export function useXemTruocXoaThanhPhan(viTriId: string | null) {
  return useQuery({
    queryKey: ["xem-truoc-xoa-thanh-phan", viTriId],
    enabled: !!viTriId,
    queryFn: async (): Promise<XemTruocXoaTP> => {
      const { data, error } = await (supabase.rpc as any)("xem_truoc_xoa_thanh_phan", { v_id: viTriId });
      if (error) throw error;
      return data as XemTruocXoaTP;
    },
  });
}

/** Khôi phục thành phần đã xoá mềm (trong 30 ngày). */
export function useKhoiPhucThanhPhan(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (viTriId: string) => {
      const { error } = await (supabase.rpc as any)("khoi_phuc_thanh_phan", { v_id: viTriId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Danh sách thành phần đã xoá mềm còn trong thời hạn khôi phục 30 ngày. */
export interface ThanhPhanDaXoa {
  id: string; ma_thanh_phan: string; ten: string; he_thong_id: string;
  deleted_at: string; deleted_by: string | null; deleted_reason: string | null;
}
export function useThanhPhanDaXoa(heThongId: string) {
  return useQuery({
    queryKey: ["thanh-phan-da-xoa", heThongId],
    enabled: !!heThongId,
    queryFn: async (): Promise<ThanhPhanDaXoa[]> => {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten, he_thong_id, deleted_at, deleted_by, deleted_reason" as never)
        .eq("he_thong_id", heThongId)
        .not("deleted_at" as never, "is", null)
        .gte("deleted_at" as never, cutoff)
        .order("deleted_at" as never, { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ThanhPhanDaXoa[];
    },
  });
}


/**
 * Đổi vị trí hai thành phần trong cùng hệ thống (nhấn Lên / Xuống).
 * Ghi lại toàn bộ thu_tu = index để đảm bảo tính nhất quán ngay cả khi
 * các bản ghi cũ chưa có thu_tu.
 */
export function useDoiThuTuViTri(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("he_thong_thanh_phan").update({ thu_tu: i } as never).eq("id", id).then(({ error }) => {
            if (error) throw error;
          }),
        ),
      );
    },
    // Optimistic: cập nhật thứ tự ngay trong cache để UI phản hồi tức thì.
    onMutate: async (orderedIds: string[]) => {
      await qc.cancelQueries({ queryKey: KEY.viTri(heThongId) });
      const prev = qc.getQueryData<ViTriChucNang[]>(KEY.viTri(heThongId));
      if (prev) {
        const byId = new Map(prev.map((x) => [x.id, x]));
        const next: ViTriChucNang[] = [];
        orderedIds.forEach((id, i) => {
          const row = byId.get(id);
          if (row) next.push({ ...row, thu_tu: i });
        });
        for (const r of prev) if (!orderedIds.includes(r.id)) next.push(r);
        qc.setQueryData(KEY.viTri(heThongId), next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY.viTri(heThongId), ctx.prev);
    },
    onSettled: invalidate,
  });
}

// ---- NHỊP II: RPC nghiệp vụ (atomic) --------------------------------------
// Ghi audit chi tiết vào audit_log qua RPC log_app_event (bao gồm gan_id,
// từ–vị trí, đến–vị trí, tài sản, thành phần). Bỏ qua lỗi log để không chặn.
async function ghiLogLapThao(
  action: "lap_tai_san" | "thao_tai_san" | "thay_the_tai_san",
  detail: Record<string, unknown>,
  entityId: string | null,
) {
  try {
    await supabase.rpc("log_app_event", {
      _action: action, _entity: "gan_chuc_nang", _entity_id: entityId ?? "", _detail: detail as never,
    });
  } catch { /* bỏ qua */ }
}

/** Lắp tài sản: RPC `lap_tai_san_vao_thanh_phan` — tự đóng bản ghi active
 *  hiện có của tài sản, mở bản ghi mới, cascade `thiet_bi.vi_tri_id` theo
 *  vị trí của thành phần đích. Trả về `gan_id` mới (phục vụ undo). */
export function useLapThietBi(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (p: { thanhPhanId: string; thietBiId: string; lyDo?: string; ghiChu?: string }): Promise<string> => {
      const [tbSnap, tpSnap] = await Promise.all([
        supabase.from("thiet_bi").select("ma_thiet_bi, vi_tri_id").eq("id", p.thietBiId).maybeSingle(),
        supabase.from("he_thong_thanh_phan").select("ma_thanh_phan, vi_tri_id").eq("id", p.thanhPhanId).maybeSingle(),
      ]);
      const { data, error } = await supabase.rpc("lap_tai_san_vao_thanh_phan", {
        p_thanh_phan_id: p.thanhPhanId,
        p_thiet_bi_id: p.thietBiId,
        p_ly_do: p.lyDo ?? "lắp mới",
        p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
      const ganId = String(data ?? "");
      if (ganId) {
        await ghiLogLapThao("lap_tai_san", {
          gan_id: ganId, thanh_phan_id: p.thanhPhanId, thiet_bi_id: p.thietBiId,
          ma_thiet_bi: tbSnap.data?.ma_thiet_bi ?? null, ma_thanh_phan: tpSnap.data?.ma_thanh_phan ?? null,
          vi_tri_tu_id: tbSnap.data?.vi_tri_id ?? null, vi_tri_den_id: tpSnap.data?.vi_tri_id ?? null,
          ly_do: p.lyDo ?? "lắp mới", ghi_chu: p.ghiChu ?? null,
        }, ganId);
      }
      return ganId;
    },
    onSuccess: invalidate,
  });
}

/** Tháo (LEGACY, dùng cho undo): tìm gan_chuc_nang active tại thành phần,
 *  chọn `new_vi_tri_id` ưu tiên tham số → vị trí hiện tại của tài sản → vị
 *  trí của thành phần. Gọi RPC mới `thao_tai_san_khoi_thanh_phan`. */
export function useThaoThietBi(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (p: { thanhPhanId: string; lyDo?: string; ghiChu?: string; newViTriId?: string | null }) => {
      const { data: ganRow, error: ganErr } = await supabase
        .from("gan_chuc_nang")
        .select("id, thiet_bi_id, thiet_bi:thiet_bi_id(ma_thiet_bi, vi_tri_id), he_thong_thanh_phan:thanh_phan_id(ma_thanh_phan, vi_tri_id)")
        .eq("thanh_phan_id", p.thanhPhanId).is("den_ngay", null).maybeSingle();
      if (ganErr) throw ganErr;
      if (!ganRow) throw new Error("Không tìm thấy bản ghi lắp đang hoạt động để tháo");
      const gan = ganRow as unknown as {
        id: string; thiet_bi_id: string;
        thiet_bi: { ma_thiet_bi: string; vi_tri_id: string | null } | null;
        he_thong_thanh_phan: { ma_thanh_phan: string; vi_tri_id: string | null } | null;
      };
      const newVt = p.newViTriId ?? gan.thiet_bi?.vi_tri_id ?? gan.he_thong_thanh_phan?.vi_tri_id ?? null;
      if (!newVt) throw new Error("Không xác định được vị trí đích khi tháo — cần chọn thủ công");
      const { error } = await supabase.rpc("thao_tai_san_khoi_thanh_phan", {
        p_gan_id: gan.id, p_new_vi_tri_id: newVt,
        p_ly_do: p.lyDo ?? "tháo", p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
      await ghiLogLapThao("thao_tai_san", {
        gan_id: gan.id, thanh_phan_id: p.thanhPhanId, thiet_bi_id: gan.thiet_bi_id,
        ma_thiet_bi: gan.thiet_bi?.ma_thiet_bi ?? null, ma_thanh_phan: gan.he_thong_thanh_phan?.ma_thanh_phan ?? null,
        vi_tri_tu_id: gan.he_thong_thanh_phan?.vi_tri_id ?? null, vi_tri_den_id: newVt,
        ly_do: p.lyDo ?? "tháo", ghi_chu: p.ghiChu ?? null,
      }, gan.id);
    },
    onSuccess: invalidate,
  });
}

/** Tháo tài sản với `vi_tri_id` đích do người dùng chọn (entry-point chuẩn
 *  cho các nút "Tháo" trên UI — kèm dialog chọn vị trí kho/xưởng). */
export function useThaoTaiSan(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (p: {
      ganId: string; newViTriId: string; lyDo?: string; ghiChu?: string;
      thanhPhanId?: string; thietBiId?: string; viTriTuId?: string | null;
      maThietBi?: string | null; maThanhPhan?: string | null;
    }) => {
      const { error } = await supabase.rpc("thao_tai_san_khoi_thanh_phan", {
        p_gan_id: p.ganId, p_new_vi_tri_id: p.newViTriId,
        p_ly_do: p.lyDo ?? "tháo", p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
      await ghiLogLapThao("thao_tai_san", {
        gan_id: p.ganId, thanh_phan_id: p.thanhPhanId ?? null, thiet_bi_id: p.thietBiId ?? null,
        ma_thiet_bi: p.maThietBi ?? null, ma_thanh_phan: p.maThanhPhan ?? null,
        vi_tri_tu_id: p.viTriTuId ?? null, vi_tri_den_id: p.newViTriId,
        ly_do: p.lyDo ?? "tháo", ghi_chu: p.ghiChu ?? null,
      }, p.ganId);
    },
    onSuccess: invalidate,
  });
}

export function useThayTheThietBi(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (p: {
      thanhPhanId: string;
      thietBiMoiId: string;
      hongHocId?: string | null;
      ghiChu?: string;
      /** Vị trí đích cho tài sản CŨ bị thay ra (kho sửa chữa/xưởng…). Bỏ trống = giữ nguyên vị trí. */
      viTriTaiSanCuId?: string | null;
      /** Thông tin cho audit log (không bắt buộc). */
      thietBiCuId?: string | null;
      maThietBiCu?: string | null;
      maThietBiMoi?: string | null;
      maThanhPhan?: string | null;
      viTriTuId?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("thay_the_thiet_bi", {
        p_thanh_phan_id: p.thanhPhanId,
        p_thiet_bi_moi_id: p.thietBiMoiId,
        p_hong_hoc_id: p.hongHocId ?? undefined,
        p_ghi_chu: p.ghiChu ?? undefined,
        p_vi_tri_tai_san_cu_id: p.viTriTaiSanCuId ?? undefined,
      });
      if (error) throw error;
      const newGanId = (data as string | null) ?? null;
      await ghiLogLapThao("thay_the_tai_san", {
        gan_id_moi: newGanId,
        thanh_phan_id: p.thanhPhanId,
        ma_thanh_phan: p.maThanhPhan ?? null,
        thiet_bi_cu_id: p.thietBiCuId ?? null,
        ma_thiet_bi_cu: p.maThietBiCu ?? null,
        thiet_bi_moi_id: p.thietBiMoiId,
        ma_thiet_bi_moi: p.maThietBiMoi ?? null,
        vi_tri_tu_id: p.viTriTuId ?? null,
        vi_tri_den_tai_san_cu_id: p.viTriTaiSanCuId ?? null,
        hong_hoc_id: p.hongHocId ?? null,
        ghi_chu: p.ghiChu ?? null,
      }, newGanId);
      return newGanId;
    },
    onSuccess: invalidate,
  });
}

export function useDieuChuyen(heThongId: string) {
  const invalidate = useInvalidate(heThongId);
  return useMutation({
    mutationFn: async (p: { thietBiId: string; thanhPhanDich: string; ghiChu?: string }) => {
      const { error } = await supabase.rpc("dieu_chuyen", {
        p_thiet_bi_id: p.thietBiId, p_thanh_phan_dich: p.thanhPhanDich, p_ghi_chu: p.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

// ---- BƯỚC 7: read model "Lý lịch" -----------------------------------------
export interface LyLichViTriRow {
  gan_id: string;
  thiet_bi_id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ma_serial: string | null;
  tu_ngay: string;
  den_ngay: string | null;
  ly_do: string;
  hong_hoc_id: string | null;
}

/** Lý lịch một vị trí chức năng: các tài sản đã/đang giữ, theo thời gian. */
export function useLyLichViTri(thanhPhanId: string | null) {
  return useQuery({
    queryKey: ["ly-lich-vi-tri", thanhPhanId],
    enabled: Boolean(thanhPhanId),
    queryFn: async (): Promise<LyLichViTriRow[]> => {
      const { data, error } = await supabase
        .from("v_ly_lich_vi_tri_chuc_nang")
        .select("gan_id, thiet_bi_id, ma_thiet_bi, ten_thiet_bi, ma_serial, tu_ngay, den_ngay, ly_do, hong_hoc_id")
        .eq("thanh_phan_id", thanhPhanId!)
        .order("tu_ngay", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LyLichViTriRow[];
    },
  });
}

export interface LyLichThietBiRow {
  thoi_diem: string | null;
  loai_su_kien: string;
  tieu_de: string;
  mo_ta: string | null;
  nguon: string;
  nguon_id: string;
}

/** Lý lịch một tài sản: hợp nhất mọi sự kiện theo thời gian. */
export function useLyLichThietBi(thietBiId: string | null) {
  return useQuery({
    queryKey: ["ly-lich-thiet-bi", thietBiId],
    enabled: Boolean(thietBiId),
    queryFn: async (): Promise<LyLichThietBiRow[]> => {
      const { data, error } = await supabase
        .from("v_ly_lich_thiet_bi")
        .select("thoi_diem, loai_su_kien, tieu_de, mo_ta, nguon, nguon_id")
        .eq("thiet_bi_id", thietBiId!)
        .order("thoi_diem", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LyLichThietBiRow[];
    },
  });
}

// ── Sổ lý lịch theo lớp Thành phần / Hệ thống (mô hình 3 lớp) ────────────────

export interface LyLichEventRow {
  thoi_diem: string | null;
  loai_su_kien: string;
  tieu_de: string;
  mo_ta: string | null;
  nguon: string;
  nguon_id: string;
  thiet_bi_id: string | null;
  ma_thiet_bi?: string | null;
  thanh_phan_id?: string | null;
}

/** Sổ lý lịch một Thành phần hệ thống: sự cố/bảo dưỡng/hỏng hóc + lắp–tháo tài sản. */
export function useLyLichThanhPhan(thanhPhanId: string | null) {
  return useQuery({
    queryKey: ["ly-lich-thanh-phan", thanhPhanId],
    enabled: Boolean(thanhPhanId),
    queryFn: async (): Promise<LyLichEventRow[]> => {
      const { data, error } = await supabase
        .from("v_ly_lich_thanh_phan")
        .select("thoi_diem, loai_su_kien, tieu_de, mo_ta, nguon, nguon_id, thiet_bi_id, ma_thiet_bi")
        .eq("thanh_phan_id", thanhPhanId!)
        .order("thoi_diem", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LyLichEventRow[];
    },
  });
}

/** Sổ lý lịch một Hệ thống: gộp toàn bộ sự kiện của hệ thống + các thành phần con. */
export function useLyLichHeThong(heThongId: string | null) {
  return useQuery({
    queryKey: ["ly-lich-he-thong", heThongId],
    enabled: Boolean(heThongId),
    queryFn: async (): Promise<LyLichEventRow[]> => {
      const { data, error } = await supabase
        .from("v_ly_lich_he_thong")
        .select("thoi_diem, loai_su_kien, tieu_de, mo_ta, nguon, nguon_id, thiet_bi_id, thanh_phan_id")
        .eq("he_thong_id", heThongId!)
        .order("thoi_diem", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LyLichEventRow[];
    },
  });
}

/**
 * Sửa lại NGÀY LẮP (tu_ngay) của một lần lắp tài sản (dòng gan_chuc_nang).
 * Chỉ admin / phòng KT mới gọi được (RPC kiểm tra quyền). Dùng để chỉnh lại
 * mốc lắp về đúng ngày thực tế thay vì thời điểm nhập liệu.
 */
export function useSuaNgayLap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ganId: string; tuNgay: string; ghiChu?: string | null }) => {
      const { error } = await supabase.rpc("sua_ngay_lap", {
        p_gan_id: args.ganId,
        p_tu_ngay: args.tuNgay,
        p_ghi_chu: args.ghiChu ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ly-lich-thanh-phan"] });
      qc.invalidateQueries({ queryKey: ["ly-lich-he-thong"] });
      qc.invalidateQueries({ queryKey: ["vai-tro-thiet-bi"] });
    },
  });
}




// ---------------------------------------------------------------------------
// VAI TRÒ HIỆN TẠI của một tài sản cụ thể: tài sản này đang được lắp vào
// thành phần nào, thuộc hệ thống nào (đọc dòng gan_chuc_nang hiệu lực).
// Dùng cho trang/drawer tài sản để trả lời: "tài sản đang đảm nhận vai trò gì".
// ---------------------------------------------------------------------------
export interface VaiTroThietBi {
  gan_id: string;
  thanh_phan_id: string;
  ma_thanh_phan: string;
  ten_thanh_phan: string;
  he_thong_id: string;
  ten_he_thong: string;
  tu_ngay: string;
  ly_do: string;
}

/**
 * TẤT CẢ vai trò hiện hành của một tài sản (nhiều vai trò song song).
 * Trả mảng rỗng khi chưa lắp ở đâu; giao diện tự chọn cách hiển thị.
 */
export function useVaiTroThietBi(thietBiId: string | null) {
  return useQuery({
    queryKey: ["vai-tro-thiet-bi", thietBiId],
    enabled: Boolean(thietBiId),
    queryFn: async (): Promise<VaiTroThietBi[]> => {
      const { data, error } = await supabase
        .from("gan_chuc_nang")
        .select(
          "id, thanh_phan_id, tu_ngay, ly_do, he_thong_thanh_phan:thanh_phan_id(ma_thanh_phan, ten, he_thong_id, dm_he_thong:he_thong_id(ten))",
        )
        .eq("thiet_bi_id", thietBiId!)
        .is("den_ngay", null)
        .order("tu_ngay", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{
        id: string; thanh_phan_id: string; tu_ngay: string; ly_do: string;
        he_thong_thanh_phan: {
          ma_thanh_phan: string; ten: string; he_thong_id: string;
          dm_he_thong: { ten: string } | null;
        } | null;
      }>;
      return rows
        .filter((r) => !!r.he_thong_thanh_phan)
        .map((r) => ({
          gan_id: r.id,
          thanh_phan_id: r.thanh_phan_id,
          ma_thanh_phan: r.he_thong_thanh_phan!.ma_thanh_phan,
          ten_thanh_phan: r.he_thong_thanh_phan!.ten,
          he_thong_id: r.he_thong_thanh_phan!.he_thong_id,
          ten_he_thong: r.he_thong_thanh_phan!.dm_he_thong?.ten ?? "",
          tu_ngay: r.tu_ngay,
          ly_do: r.ly_do,
        }));
    },
  });
}

// ---------------------------------------------------------------------------
// TIỆN ÍCH CÂY: build cây thành phần theo `thanh_phan_cha`.
// Trả về danh sách gốc + children đệ quy + độ sâu; ổn định thứ tự theo
// `thu_tu` rồi `ma_thanh_phan` (giữ đúng thứ tự sắp xếp gốc từ query).
// ---------------------------------------------------------------------------
export type ThanhPhanNode<T extends { id: string; thanh_phan_cha: string | null }> = T & {
  depth: number;
  children: ThanhPhanNode<T>[];
};

export function buildThanhPhanTree<T extends { id: string; thanh_phan_cha: string | null }>(
  rows: T[],
): ThanhPhanNode<T>[] {
  const byId = new Map<string, ThanhPhanNode<T>>();
  for (const r of rows) byId.set(r.id, { ...r, depth: 0, children: [] });
  const roots: ThanhPhanNode<T>[] = [];
  for (const r of rows) {
    const node = byId.get(r.id)!;
    const parent = r.thanh_phan_cha ? byId.get(r.thanh_phan_cha) : null;
    if (parent && parent.id !== r.id) parent.children.push(node);
    else roots.push(node);
  }
  const setDepth = (n: ThanhPhanNode<T>, d: number) => {
    n.depth = d;
    for (const c of n.children) setDepth(c, d + 1);
  };
  for (const r of roots) setDepth(r, 0);
  return roots;
}

/** Flatten cây theo thứ tự DFS để render bảng phẳng nhưng vẫn có depth. */
export function flattenThanhPhanTree<T extends { id: string; thanh_phan_cha: string | null }>(
  roots: ThanhPhanNode<T>[],
  collapsed?: Set<string>,
): ThanhPhanNode<T>[] {
  const out: ThanhPhanNode<T>[] = [];
  const walk = (n: ThanhPhanNode<T>) => {
    out.push(n);
    if (collapsed?.has(n.id)) return;
    for (const c of n.children) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

/** Chặn vòng lặp khi chọn thành phần cha (không tự làm cha, không xuống dòng con). */
export function isDescendantOf<T extends { id: string; thanh_phan_cha: string | null }>(
  rows: T[],
  candidateAncestor: string,
  nodeId: string,
): boolean {
  if (candidateAncestor === nodeId) return true;
  const childrenOf = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.thanh_phan_cha) continue;
    const arr = childrenOf.get(r.thanh_phan_cha) ?? [];
    arr.push(r.id);
    childrenOf.set(r.thanh_phan_cha, arr);
  }
  const stack = [nodeId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === candidateAncestor) return true;
    const children = childrenOf.get(cur) ?? [];
    stack.push(...children);
  }
  return false;
}

// ---------------------------------------------------------------------------
// MULTI-ROLE MAP: tra cứu nhanh tài sản nào đang giữ ≥2 vai trò song song
// (dùng để tô màu / hiện badge trong cây/bảng thành phần).
// ---------------------------------------------------------------------------
export interface MultiRoleInfo {
  count: number;                     // tổng vai trò hiện hành của tài sản
  roles: Array<{                    // danh sách vai trò để popover
    thanh_phan_id: string;
    ma_thanh_phan: string;
    ten_thanh_phan: string;
    he_thong_id: string;
    ten_he_thong: string;
  }>;
}

/**
 * Toàn cục: bản đồ `thiet_bi_id → MultiRoleInfo`. Chỉ chứa tài sản có count ≥ 2.
 * Đọc `gan_chuc_nang` hiệu lực + JOIN thành phần/hệ thống. Cache 60s.
 */
export function useMultiRoleMap() {
  return useQuery({
    queryKey: ["thiet-bi-multi-role"] as const,
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, MultiRoleInfo>> => {
      const rows = await fetchAllRows<{
        thiet_bi_id: string;
        thanh_phan_id: string;
        he_thong_thanh_phan: {
          ma_thanh_phan: string;
          ten: string;
          he_thong_id: string;
          dm_he_thong: { ten: string | null } | null;
        } | null;
      }>((from, to) =>
        supabase
          .from("gan_chuc_nang")
          .select(
            "thiet_bi_id, thanh_phan_id, he_thong_thanh_phan:thanh_phan_id(ma_thanh_phan, ten, he_thong_id, dm_he_thong:he_thong_id(ten))",
          )
          .is("den_ngay", null)
          .range(from, to),
      );
      const acc = new Map<string, MultiRoleInfo>();
      for (const r of rows) {
        const info = acc.get(r.thiet_bi_id) ?? { count: 0, roles: [] };
        info.count += 1;
        if (r.he_thong_thanh_phan) {
          info.roles.push({
            thanh_phan_id: r.thanh_phan_id,
            ma_thanh_phan: r.he_thong_thanh_phan.ma_thanh_phan,
            ten_thanh_phan: r.he_thong_thanh_phan.ten,
            he_thong_id: r.he_thong_thanh_phan.he_thong_id,
            ten_he_thong: r.he_thong_thanh_phan.dm_he_thong?.ten ?? "",
          });
        }
        acc.set(r.thiet_bi_id, info);
      }
      // Giữ chỉ những tài sản đa vai để giảm re-render.
      const multi = new Map<string, MultiRoleInfo>();
      acc.forEach((v, k) => { if (v.count >= 2) multi.set(k, v); });
      return multi;
    },
  });
}

// ---------------------------------------------------------------------------
// SỔ LÝ LỊCH THÀNH PHẦN — KPI + lịch sử tài sản đã gắn.
// Đọc từ 2 RPC `thanh_phan_kpi` và `thanh_phan_tai_san_history` (SECURITY INVOKER).
// ---------------------------------------------------------------------------
export interface ThanhPhanKpi {
  so_su_co_12m: number;
  so_su_co_mo: number;
  so_bao_tri_12m: number;
  so_hong_hoc: number;
  so_gan_tong: number;
  so_gan_active: number;
  mtbf_days: number | null;
  mttr_hours: number | null;
  ti_le_dat: number | null;
  su_co_by_month: Array<{ thang: string; so_su_co: number }>;
}

export function useThanhPhanKpi(thanhPhanId: string | null) {
  return useQuery({
    queryKey: ["thanh-phan-kpi", thanhPhanId],
    enabled: Boolean(thanhPhanId),
    queryFn: async (): Promise<ThanhPhanKpi> => {
      const { data, error } = await (supabase.rpc as any)("thanh_phan_kpi", { _tp_id: thanhPhanId });
      if (error) throw error;
      return (data ?? {}) as ThanhPhanKpi;
    },
  });
}

export interface ThanhPhanTaiSanHistoryRow {
  gan_id: string;
  thiet_bi_id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string | null;
  ma_serial: string | null;
  tu_ngay: string | null;
  den_ngay: string | null;
  ly_do: string | null;
  ghi_chu: string | null;
  dang_lap: boolean;
}

export function useThanhPhanTaiSanHistory(thanhPhanId: string | null) {
  return useQuery({
    queryKey: ["thanh-phan-tai-san-history", thanhPhanId],
    enabled: Boolean(thanhPhanId),
    queryFn: async (): Promise<ThanhPhanTaiSanHistoryRow[]> => {
      const { data, error } = await (supabase.rpc as any)("thanh_phan_tai_san_history", { _tp_id: thanhPhanId });
      if (error) throw error;
      return (data ?? []) as ThanhPhanTaiSanHistoryRow[];
    },
  });
}
