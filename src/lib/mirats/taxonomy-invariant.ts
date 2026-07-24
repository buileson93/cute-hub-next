// ============================================================================
// taxonomy-invariant.ts — NGUỒN CHÂN LÝ (pure, không I/O) cho phân cấp taxonomy.
//
// INVARIANT phân cấp (một chiều, khóa ngoại là nguồn chân lý duy nhất):
//
//     Phân loại (dm_phan_loai)
//        └─ Nhóm hệ thống (dm_nhom_he_thong.phan_loai_id → dm_phan_loai.id)
//             └─ Hệ thống (dm_he_thong.nhom_he_thong_id → dm_nhom_he_thong.id)
//                  └─ Tài sản (thiet_bi.he_thong_id → dm_he_thong.id)
//
// Quy tắc dẫn xuất (derive), KHÔNG suy từ tên:
//   • dm_he_thong.phan_loai_id  ==  phan_loai_id của NHÓM cha (nhom_he_thong_id).
//   • thiet_bi.nhom_he_thong_id ==  nhom_he_thong_id của HỆ THỐNG cha.
//   • thiet_bi.phan_loai_id     ==  phan_loai_id của HỆ THỐNG cha (đã canonical).
//
// Bất kỳ "tổ hợp FK" nào lệch khỏi các quy tắc trên là MÂU THUẪN (conflict) và
// bị trigger CSDL tự đồng bộ lại theo cha. Module này encode chính xác luật đó
// để (a) test được không cần DB, (b) app dùng chung một định nghĩa.
//
// Lưu ý về "suy nhóm từ tên": xem `deriveNhom` trong db-taxonomy.ts — đó CHỈ còn
// là ADAPTER đọc dữ liệu cũ (hệ thống legacy chưa gán nhom_he_thong_id). Nó
// KHÔNG tham gia vào invariant này và không được dùng để ghi FK mới.
// ============================================================================

/** Một nhóm hệ thống tối giản dùng để dẫn xuất. */
export interface NhomRef {
  id: string;
  phanLoaiId: string | null;
}

/** Một hệ thống tối giản dùng để dẫn xuất. */
export interface HeThongRef {
  id: string;
  nhomId: string | null;
  phanLoaiId: string | null;
}

/** Bộ khóa taxonomy chuẩn hóa của một bản ghi. */
export interface TaxonomyKeys {
  nhomId: string | null;
  phanLoaiId: string | null;
}

const norm = (v: string | null | undefined): string | null => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

/**
 * Dẫn xuất phan_loai_id chuẩn của MỘT HỆ THỐNG từ nhóm cha.
 * Nếu chưa gán nhóm → giữ nguyên phan_loai_id đang có (không phá dữ liệu legacy).
 */
export function canonicalPhanLoaiForHeThong(
  heThong: HeThongRef,
  nhomById: Map<string, NhomRef>,
): string | null {
  const nhomId = norm(heThong.nhomId);
  if (!nhomId) return norm(heThong.phanLoaiId);
  const nhom = nhomById.get(nhomId);
  const nhomPl = nhom ? norm(nhom.phanLoaiId) : null;
  // Nhóm có phân loại → theo nhóm; nhóm chưa có → giữ giá trị hệ thống hiện tại.
  return nhomPl ?? norm(heThong.phanLoaiId);
}

/**
 * Dẫn xuất bộ khóa taxonomy chuẩn của MỘT THIẾT BỊ từ hệ thống cha.
 * Nếu chưa gán hệ thống → giữ nguyên khóa hiện tại (adapter dữ liệu cũ).
 */
export function canonicalKeysForThietBi(
  heThongId: string | null,
  current: TaxonomyKeys,
  htById: Map<string, HeThongRef>,
  nhomById: Map<string, NhomRef>,
): TaxonomyKeys {
  const hid = norm(heThongId);
  if (!hid) return { nhomId: norm(current.nhomId), phanLoaiId: norm(current.phanLoaiId) };
  const ht = htById.get(hid);
  if (!ht) return { nhomId: norm(current.nhomId), phanLoaiId: norm(current.phanLoaiId) };
  return {
    nhomId: norm(ht.nhomId),
    phanLoaiId: canonicalPhanLoaiForHeThong(ht, nhomById),
  };
}

export interface ConflictReport {
  /** id hệ thống có phan_loai_id lệch nhóm cha. */
  heThongPhanLoai: string[];
  /** id tài sản có nhom_he_thong_id lệch hệ thống cha. */
  thietBiNhom: string[];
  /** id tài sản có phan_loai_id lệch hệ thống cha. */
  thietBiPhanLoai: string[];
  get total(): number;
}

/**
 * Rà toàn bộ tổ hợp FK, trả về danh sách bản ghi mâu thuẫn invariant.
 * Dùng cho báo cáo conflict TRƯỚC khi backfill (không tự sửa gì).
 */
export function findTaxonomyConflicts(
  heThongList: HeThongRef[],
  thietBiList: Array<{ id: string; heThongId: string | null } & TaxonomyKeys>,
  nhomById: Map<string, NhomRef>,
): ConflictReport {
  const htById = new Map(heThongList.map((h) => [h.id, h]));
  const heThongPhanLoai: string[] = [];
  const thietBiNhom: string[] = [];
  const thietBiPhanLoai: string[] = [];

  for (const ht of heThongList) {
    const want = canonicalPhanLoaiForHeThong(ht, nhomById);
    const have = norm(ht.phanLoaiId);
    if (norm(ht.nhomId) && want && have && want !== have) heThongPhanLoai.push(ht.id);
  }

  for (const tb of thietBiList) {
    if (!norm(tb.heThongId)) continue;
    const want = canonicalKeysForThietBi(tb.heThongId, tb, htById, nhomById);
    if (want.nhomId && norm(tb.nhomId) && want.nhomId !== norm(tb.nhomId)) thietBiNhom.push(tb.id);
    if (want.phanLoaiId && norm(tb.phanLoaiId) && want.phanLoaiId !== norm(tb.phanLoaiId))
      thietBiPhanLoai.push(tb.id);
  }

  return {
    heThongPhanLoai,
    thietBiNhom,
    thietBiPhanLoai,
    get total() {
      return this.heThongPhanLoai.length + this.thietBiNhom.length + this.thietBiPhanLoai.length;
    },
  };
}
