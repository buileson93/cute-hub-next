// ============================================================================
// Pure builder cho payload INSERT vào bảng `su_co`.
//
// Mỗi báo cáo ban đầu có thể tạo N dòng sự cố (mỗi tài sản bị ảnh hưởng
// một dòng, cùng `ma_nhom_bc`). Module này KHÔNG chạm Supabase — chỉ dựng
// payload — để dùng lại được ở test và ở form `/su-co/moi`.
//
// Quan hệ Sự cố ↔ Vấn đề (RCA): khi người dùng chọn "Vấn đề liên quan",
// mọi dòng con của cùng nhóm báo cáo đều được gắn `van_de_id` để view
// `v_van_de.so_su_co` đếm không bị mồ côi.
// ============================================================================

export interface SuCoDevice {
  id: string;
  ma_thiet_bi: string;
  don_vi?: string | null;
  /** ID hệ thống của tài sản (nếu có) — dùng cho snapshot `he_thong_id`. */
  _htId?: string | null;
  _htTen?: string | null;
}

export interface SuCoInsertForm {
  ma_nhom_bc: string;
  ngay_phat_hien: string;
  nguoi_bao_cao: string;
  muc_do: string;
  anh_huong_dhb: string;
  hien_tuong: string;
  nguyen_nhan?: string | null;
  bien_phap_xu_ly?: string | null;
  bao_cao_ban_dau?: unknown;
  /** Vấn đề (RCA) được gắn cho cả nhóm báo cáo. */
  van_de_id?: string | null;
  selected: readonly SuCoDevice[];
  /** Trạng thái khởi tạo — mặc định "Mới". */
  trang_thai?: string;
}

export interface SuCoInsertRow {
  ma_su_co: string;
  thiet_bi: string;
  thiet_bi_id: string;
  he_thong: string | null;
  he_thong_id: string | null;
  don_vi: string | null;
  ngay_phat_hien: string;
  nguoi_bao_cao: string;
  muc_do: string;
  anh_huong_dhb: string;
  hien_tuong: string;
  nguyen_nhan: string | null;
  bien_phap_xu_ly: string | null;
  trang_thai: string;
  ma_nhom_bc: string;
  bao_cao_ban_dau: unknown;
  /** CHỈ có mặt khi form.van_de_id được chọn (chuỗi không rỗng). */
  van_de_id?: string;
}

/** Chuẩn hoá giá trị van_de_id: rỗng / null / undefined → không set. */
function normalizeVanDeId(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

/**
 * @deprecated Kể từ Task 50, các form khai KHÔNG được insert thẳng vào
 * bảng `su_co`. Hãy dùng `buildSuCoPayload` (ghi-payload.ts) + gọi RPC
 * `ghi_su_co_atomic(p_payload jsonb)` qua `ghiSuCoFull`. Hàm này chỉ còn
 * dùng cho test cũ và các đường ghi legacy chưa migrate.
 */
export function buildSuCoInsert(form: SuCoInsertForm): SuCoInsertRow[] {
  const vdid = normalizeVanDeId(form.van_de_id ?? null);
  const trang_thai = form.trang_thai ?? "Mới";

  return form.selected.map((d, i) => {
    const row: SuCoInsertRow = {
      ma_su_co: `${form.ma_nhom_bc}-${String(i + 1).padStart(2, "0")}`,
      thiet_bi: d.ma_thiet_bi,
      thiet_bi_id: d.id,
      he_thong: d._htTen ?? null,
      he_thong_id: d._htId ?? null,
      don_vi: d.don_vi ?? null,
      ngay_phat_hien: form.ngay_phat_hien,
      nguoi_bao_cao: form.nguoi_bao_cao,
      muc_do: form.muc_do,
      anh_huong_dhb: form.anh_huong_dhb,
      hien_tuong: form.hien_tuong,
      nguyen_nhan: form.nguyen_nhan ?? null,
      bien_phap_xu_ly: form.bien_phap_xu_ly ?? null,
      trang_thai,
      ma_nhom_bc: form.ma_nhom_bc,
      bao_cao_ban_dau: form.bao_cao_ban_dau ?? null,
    };
    if (vdid) row.van_de_id = vdid;
    return row;
  });
}
