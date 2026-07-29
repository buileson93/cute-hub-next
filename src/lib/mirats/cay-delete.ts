import { supabase } from "@/integrations/backend/client";

// ============================================================================
// cay-delete.ts — Xoá tài sản AN TOÀN từ cây Hệ thống tài sản.
//
// NGUYÊN TẮC: KHÔNG BAO GIỜ xoá trực tiếp `thiet_bi`. Trước đây cây gọi
// `supabase.from("thiet_bi").delete()` — vì không có FK trỏ về thiet_bi.id nên
// thao tác đó xoá mất hồ sơ lý lịch tài sản mà vẫn để lại các bản ghi sự cố /
// bảo dưỡng / bàn giao… mồ côi (orphan). Đây là nguy cơ mất dữ liệu.
//
// Cơ chế mới (mặc định giữ hồ sơ):
//   1) `purge_thiet_bi` (SECURITY DEFINER) chỉ XOÁ VĨNH VIỄN tài sản CHƯA
//      phát sinh bất kỳ quan hệ nghiệp vụ nào (bản ghi nhập nhầm). Tài sản đã
//      có lịch sử được RPC trả về trong `bo_qua` và KHÔNG bị xoá.
//   2) Tài sản bị từ chối (đã có lịch sử) được chuyển "Ngừng khai thác" để
//      giữ nguyên toàn bộ lý lịch, thay vì xoá.
// ============================================================================

export interface XoaThietBiKetQua {
  /** Đã xoá vĩnh viễn (bản ghi nhập nhầm, chưa có lịch sử). */
  purged: string[];
  /** Đã chuyển "Ngừng khai thác" vì đã có lịch sử — hồ sơ được giữ nguyên. */
  retired: string[];
}

/** Tập quan hệ nghiệp vụ dùng để xác định "đã có lịch sử" — KHỚP với purge_thiet_bi. */
const HISTORY_RELATIONS: ReadonlyArray<{ table: string; cols: string[] }> = [
  { table: "su_co", cols: ["thiet_bi_id"] },
  { table: "bao_tri", cols: ["thiet_bi_id"] },
  { table: "hong_hoc", cols: ["thiet_bi_hong_id", "thiet_bi_thay_the_id"] },
  { table: "ban_giao", cols: ["thiet_bi_id"] },
  { table: "kiem_ke", cols: ["thiet_bi_id"] },
  { table: "giay_phep", cols: ["thiet_bi_id"] },
  { table: "form_submission", cols: ["thiet_bi_id"] },
  { table: "form_submission_thiet_bi", cols: ["thiet_bi_id"] },
  { table: "thiet_bi_do_dac", cols: ["thiet_bi_id"] },
];

export interface XoaThietBiPreview {
  /** Mã tài sản đã có lịch sử → sẽ được chuyển "Ngừng khai thác" (giữ hồ sơ). */
  coLichSu: string[];
  /** Mã tài sản chưa có lịch sử → sẽ bị xoá vĩnh viễn. */
  sach: string[];
}

/** Chia danh sách mã theo tập "đã có lịch sử" (thuần, dễ test). */
export function partitionByHistory(mas: string[], coLichSuSet: Set<string>): XoaThietBiPreview {
  const coLichSu: string[] = [];
  const sach: string[] = [];
  for (const m of mas) (coLichSuSet.has(m) ? coLichSu : sach).push(m);
  return { coLichSu, sach };
}

/**
 * Xem trước (best-effort) việc xoá: tài sản nào có lịch sử, tài sản nào sạch.
 * Chỉ phục vụ hiển thị — kết quả THẬT khi thực thi luôn do purge_thiet_bi quyết
 * định (an toàn tuyệt đối, không phụ thuộc preview này).
 */
export async function xemTruocXoaThietBi(mas: string[]): Promise<XoaThietBiPreview> {
  if (mas.length === 0) return { coLichSu: [], sach: [] };

  const { data: devs, error } = await supabase
    .from("thiet_bi")
    .select("id, ma_thiet_bi")
    .in("ma_thiet_bi", mas);
  if (error) throw error;
  const rows = (devs ?? []) as { id: string; ma_thiet_bi: string }[];
  const idToMa = new Map(rows.map((r) => [r.id, r.ma_thiet_bi]));
  const ids = rows.map((r) => r.id);
  const coLichSuSet = new Set<string>();

  if (ids.length > 0) {
    await Promise.all(
      HISTORY_RELATIONS.flatMap(({ table, cols }) =>
        cols.map(async (col) => {
          const { data } = await supabase
            .from(table as never)
            .select(col)
            .in(col, ids as never);
          for (const r of (data ?? []) as Record<string, string>[]) {
            const ma = idToMa.get(r[col]);
            if (ma) coLichSuSet.add(ma);
          }
        }),
      ),
    );
  }

  return partitionByHistory(mas, coLichSuSet);
}

/**
 * Thực hiện xoá an toàn: xoá vĩnh viễn tài sản chưa có lịch sử, và chuyển
 * "Ngừng khai thác" cho tài sản đã có lịch sử. Không bao giờ xoá mất lý lịch.
 */
export async function xoaThietBiAnToan(mas: string[]): Promise<XoaThietBiKetQua> {
  if (mas.length === 0) return { purged: [], retired: [] };

  const { data, error } = await supabase.rpc("purge_thiet_bi", { _mas: mas });
  if (error) throw error;
  const d = (data ?? {}) as { da_xoa?: string[] | null; bo_qua?: string[] | null };
  const purged = d.da_xoa ?? [];
  const retired = d.bo_qua ?? [];

  if (retired.length > 0) {
    const { error: rErr } = await supabase.rpc("ngung_khai_thac_thiet_bi", {
      _mas: retired,
      _ly_do: "Xoá nhánh trong cây — tài sản đã có lịch sử nên được giữ hồ sơ (Ngừng khai thác)",
      _thanh_ly: false,
    });
    if (rErr) throw rErr;
  }

  return { purged, retired };
}
