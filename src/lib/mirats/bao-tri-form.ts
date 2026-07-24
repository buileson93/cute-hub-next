// ============================================================================
// bao-tri-form.ts — Logic THUẦN (pure) của luồng "phiếu bảo dưỡng theo mẫu".
//
// Mục tiêu: tách các quyết định nghiệp vụ ra khỏi component để KIỂM CHỨNG được
// bằng unit test, GIỮ NGUYÊN hành vi hiện tại (characterization baseline):
//
//   1. Chọn hệ thống → lọc đúng mẫu (chỉ mẫu active + nhóm "bao_duong").
//   2. Lưu → tạo form_submission và các dòng bao_tri (sổ lý lịch) liên kết.
//   3. Mẫu "phẳng" cũ (form_field) vẫn map được nhãn/giá trị để render & xuất Word.
//
// KHÔNG đổi schema, KHÔNG đổi giao diện. Đây chỉ là bóc tách để test.
// ============================================================================

import { compileSchema, type CompiledSchema, type RawFieldRow } from "@/lib/mirats/form-schema";

/** Nhóm mẫu dùng cho phiếu bảo dưỡng theo hệ thống. */
export const NHOM_BAO_DUONG = "bao_duong" as const;

export type FormTemplateLite = {
  id: string;
  code: string;
  ten: string;
  mo_ta: string | null;
  version: number;
  active: boolean;
  nhom: string;
};

/** 1 dòng join từ form_template_he_thong -> form_template. */
export type BaoTriTemplateJoinRow = {
  form_template: FormTemplateLite | null;
};

export type MatchedTemplate = {
  id: string;
  code: string;
  ten: string;
  mo_ta: string | null;
  version: number;
};

/**
 * #1 — Từ danh sách mẫu đã gắn với 1 hệ thống, chỉ giữ mẫu ĐANG kích hoạt và
 * thuộc nhóm bảo dưỡng. Bảo đảm người dùng chỉ thấy mẫu hợp lệ của hệ thống đó.
 */
export function filterBaoTriTemplates(
  rows: readonly BaoTriTemplateJoinRow[] | null | undefined,
): MatchedTemplate[] {
  const out: MatchedTemplate[] = [];
  for (const row of rows ?? []) {
    const t = row.form_template;
    if (t && t.active && t.nhom === NHOM_BAO_DUONG) {
      out.push({ id: t.id, code: t.code, ten: t.ten, mo_ta: t.mo_ta, version: t.version });
    }
  }
  return out;
}

export type RequiredFieldLite = {
  key: string;
  label: string;
  required: boolean;
};

/**
 * Kiểm tra trường bắt buộc của mẫu. Trả về NHÃN của trường bắt buộc đầu tiên
 * còn thiếu, hoặc null nếu đủ. (rỗng, null, hoặc mảng rỗng = thiếu)
 */
export function findMissingRequired(
  fields: readonly RequiredFieldLite[] | null | undefined,
  values: Record<string, unknown>,
): string | null {
  for (const f of fields ?? []) {
    if (!f.required) continue;
    const v = values[f.key];
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) {
      return f.label;
    }
  }
  return null;
}

export type SubmissionDeviceLite = {
  id: string;
  ma_thiet_bi: string;
  ten: string;
  don_vi?: string | null;
};

export type BuildSubmissionArgs = {
  template: MatchedTemplate;
  heThongId: string;
  heThongTen: string;
  userId: string;
  values: Record<string, unknown>;
  submittedAt: string;
  /** Danh sách field hiện tại của mẫu — để ghim snapshot cấu trúc vào phiếu. */
  fields?: readonly RawFieldRow[] | null;
};

export type SubmissionInsert = {
  template_id: string;
  template_code: string;
  template_version: number;
  template_snapshot: CompiledSchema;
  he_thong_id: string;
  created_by: string;
  status: "submitted";
  submitted_at: string;
  tieu_de: string;
  data: Record<string, unknown>;
};

/** #2a — Dựng bản ghi form_submission (bản khai form) gắn với hệ thống. */
export function buildSubmissionInsert(args: BuildSubmissionArgs): SubmissionInsert {
  return {
    template_id: args.template.id,
    template_code: args.template.code,
    template_version: args.template.version,
    template_snapshot: compileSchema(
      { id: args.template.id, code: args.template.code, ten: args.template.ten, version: args.template.version },
      args.fields ?? [],
    ),
    he_thong_id: args.heThongId,
    created_by: args.userId,
    status: "submitted",
    submitted_at: args.submittedAt,
    tieu_de: `${args.template.ten} — ${args.heThongTen}`,
    data: args.values,
  };
}

export type BuildBaoTriArgs = {
  submissionId: string;
  devices: readonly SubmissionDeviceLite[];
  template: MatchedTemplate;
  heThongId: string;
  heThongTen: string;
  userId: string;
  loaiBaoTri: string;
  trangThai: string;
  ngayBatDau: string;
  ngayHoanThanh: string | null;
  ketQua: string | null;
  nguoiThucHien: string;
  donViThucHien: string;
  /** Mã gốc để tạo mã phiếu; tách ra để test cho kết quả xác định. */
  maBase: string;
};

export type BaoTriRow = {
  ma_bao_tri: string;
  thiet_bi: string;
  thiet_bi_id: string;
  he_thong: string | null;
  he_thong_id: string;
  don_vi: string | null;
  loai_bao_tri: string;
  ngay_bat_dau: string;
  ngay_hoan_thanh: string | null;
  mo_ta_cong_viec: string;
  ket_qua: string | null;
  nguoi_thuc_hien: string[];
  don_vi_thuc_hien: string;
  trang_thai: string;
  created_by: string;
  form_submission_id: string;
};

/**
 * @deprecated Kể từ Task 50, form /bao-tri/moi không insert thẳng vào
 * `bao_tri`. Dùng `buildBaoDuongPayload` + `ghiBaoDuongFull` (RPC
 * `ghi_bao_duong_atomic(p_payload jsonb)`).
 */
export function buildBaoTriRows(args: BuildBaoTriArgs): BaoTriRow[] {
  const nguoi = args.nguoiThucHien
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return args.devices.map((d, i) => ({
    ma_bao_tri: `${args.maBase}-${String(i + 1).padStart(2, "0")}`,
    thiet_bi: d.ma_thiet_bi,
    thiet_bi_id: d.id,
    he_thong: args.heThongTen || null,
    he_thong_id: args.heThongId,
    don_vi: d.don_vi || null,
    loai_bao_tri: args.loaiBaoTri,
    ngay_bat_dau: args.ngayBatDau,
    ngay_hoan_thanh: args.ngayHoanThanh || null,
    mo_ta_cong_viec: args.template.ten,
    ket_qua: args.ketQua || null,
    nguoi_thuc_hien: nguoi,
    don_vi_thuc_hien: args.donViThucHien,
    trang_thai: args.trangThai,
    created_by: args.userId,
    form_submission_id: args.submissionId,
  }));
}

// ---------------------------------------------------------------------------
// #3 — Mẫu "phẳng" cũ: map trường -> nhãn/giá trị để render UI & xuất Word.
// ---------------------------------------------------------------------------

/** Định dạng 1 giá trị field về chuỗi cho biên bản Word / render. */
export function fmtFieldValue(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export type ContentFieldLite = { key: string; label: string };

/** Cặp nhãn–giá trị theo đúng thứ tự field của mẫu (dùng cho bảng nội dung). */
export function buildContentPairs(
  fields: readonly ContentFieldLite[] | null | undefined,
  data: Record<string, unknown> | null | undefined,
): Array<{ label: string; value: string }> {
  const obj = data ?? {};
  return (fields ?? []).map((f) => ({ label: f.label, value: fmtFieldValue(obj[f.key]) }));
}
