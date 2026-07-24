// Pure builder: form state → payload cho các RPC ghi_*_atomic (bản jsonb).
//
// Không chạm Supabase — dùng lại được ở test.
// Các builder này thay thế `buildSuCoInsert` / `buildBaoTriRows` (đã @deprecated):
// thay vì trả về mảng row để INSERT thẳng, chúng trả về 1 payload để gọi
// RPC nguyên tử (mọi INSERT nằm trong 1 transaction phía DB).

export interface SuCoDeviceRef {
  id: string;
  ma_thiet_bi: string;
  don_vi?: string | null;
  he_thong_id?: string | null;
  he_thong_ten?: string | null;
}

export interface BuildSuCoPayloadArgs {
  ma_nhom_bc: string;
  ngay_phat_hien: string;
  nguoi_bao_cao: string;
  muc_do: string;
  anh_huong_dhb: string;
  hien_tuong: string;
  nguyen_nhan?: string | null;
  bien_phap_xu_ly?: string | null;
  bao_cao_ban_dau?: unknown;
  van_de_id?: string | null;
  trang_thai?: string;
  devices: readonly SuCoDeviceRef[];
  vat_tu?: readonly { vat_tu_id: string; kho_id: string; so_luong: number }[];
}

/** Payload cho ghi_su_co_atomic(p_payload jsonb). */
export function buildSuCoPayload(a: BuildSuCoPayloadArgs): Record<string, unknown> {
  const vdid = (a.van_de_id ?? "").trim();
  return {
    ma_nhom_bc: a.ma_nhom_bc,
    ngay_phat_hien: a.ngay_phat_hien,
    nguoi_bao_cao: a.nguoi_bao_cao,
    muc_do: a.muc_do,
    anh_huong_dhb: a.anh_huong_dhb,
    hien_tuong: a.hien_tuong,
    nguyen_nhan: a.nguyen_nhan ?? null,
    bien_phap_xu_ly: a.bien_phap_xu_ly ?? null,
    bao_cao_ban_dau: a.bao_cao_ban_dau ?? null,
    van_de_id: vdid || null,
    trang_thai: a.trang_thai ?? "Mới",
    devices: a.devices.map((d) => ({
      id: d.id,
      ma_thiet_bi: d.ma_thiet_bi,
      don_vi: d.don_vi ?? null,
      he_thong_id: d.he_thong_id ?? null,
      he_thong_ten: d.he_thong_ten ?? null,
    })),
    vat_tu: (a.vat_tu ?? []).map((v) => ({ ...v })),
  };
}

export interface BaoDuongDeviceRef {
  id: string;
  ma_thiet_bi: string;
  don_vi?: string | null;
}

export interface BuildBaoDuongPayloadArgs {
  submission: {
    template_id: string;
    template_code: string;
    template_version: number;
    template_snapshot: unknown;
    template_version_id?: string | null;
    he_thong_id: string;
    tieu_de: string;
    data: Record<string, unknown>;
    submitted_at?: string;
  };
  ma_base: string;
  he_thong_ten: string;
  loai_bao_tri: string;
  ngay_bat_dau: string;
  ngay_hoan_thanh?: string | null;
  ket_qua?: string | null;
  trang_thai: string;
  nguoi_thuc_hien: string | string[];
  don_vi_thuc_hien: string;
  mo_ta_cong_viec?: string | null;
  devices: readonly BaoDuongDeviceRef[];
  /** Mỗi phần tử khớp schema `form_submission_item_result` (không kèm submission_id). */
  item_results?: readonly Record<string, unknown>[];
  vat_tu?: readonly { vat_tu_id: string; kho_id: string; so_luong: number }[];
}

export function buildBaoDuongPayload(a: BuildBaoDuongPayloadArgs): Record<string, unknown> {
  return {
    submission: {
      ...a.submission,
      template_version_id: a.submission.template_version_id ?? null,
      submitted_at: a.submission.submitted_at ?? new Date().toISOString(),
    },
    ma_base: a.ma_base,
    he_thong_ten: a.he_thong_ten,
    loai_bao_tri: a.loai_bao_tri,
    ngay_bat_dau: a.ngay_bat_dau,
    ngay_hoan_thanh: a.ngay_hoan_thanh ?? null,
    ket_qua: a.ket_qua ?? null,
    trang_thai: a.trang_thai,
    nguoi_thuc_hien: a.nguoi_thuc_hien,
    don_vi_thuc_hien: a.don_vi_thuc_hien,
    mo_ta_cong_viec: a.mo_ta_cong_viec ?? null,
    devices: a.devices.map((d) => ({
      id: d.id,
      ma_thiet_bi: d.ma_thiet_bi,
      don_vi: d.don_vi ?? null,
    })),
    item_results: (a.item_results ?? []).map((r) => ({ ...r })),
    vat_tu: (a.vat_tu ?? []).map((v) => ({ ...v })),
  };
}

export interface BuildHongHocPayloadArgs {
  ma_hong_hoc: string;
  ngay_hong: string;
  mo_ta_hong_hoc: string;
  phuong_an: string;
  thiet_bi_hong_ids: readonly string[];
  thiet_bi_thay_the_id?: string | null;
  he_thong_id?: string | null;
  he_thong_ten?: string | null;
  thanh_phan_id?: string | null;
  bo_phan_hong?: string | null;
  su_co?: string | null;
  trang_thai?: string;
  nguoi_thuc_hien?: readonly string[];
  vat_tu?: readonly { vat_tu_id: string; kho_id: string; so_luong: number }[];
}

export function buildHongHocPayload(a: BuildHongHocPayloadArgs): Record<string, unknown> {
  return {
    ma_hong_hoc: a.ma_hong_hoc,
    ngay_hong: a.ngay_hong,
    mo_ta_hong_hoc: a.mo_ta_hong_hoc,
    phuong_an: a.phuong_an,
    thiet_bi_hong_ids: [...a.thiet_bi_hong_ids],
    thiet_bi_thay_the_id: a.thiet_bi_thay_the_id ?? null,
    he_thong_id: a.he_thong_id ?? null,
    he_thong_ten: a.he_thong_ten ?? null,
    thanh_phan_id: a.thanh_phan_id ?? null,
    bo_phan_hong: a.bo_phan_hong ?? null,
    su_co: a.su_co ?? null,
    trang_thai: a.trang_thai ?? "Mới",
    nguoi_thuc_hien: [...(a.nguoi_thuc_hien ?? [])],
    vat_tu: (a.vat_tu ?? []).map((v) => ({ ...v })),
  };
}
