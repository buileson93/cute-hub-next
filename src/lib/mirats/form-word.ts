// ============================================================================
// form-word.ts — Logic THUẦN dựng dữ liệu BẢNG cho biên bản Word (checklist).
//
// Tách phần "gom kết quả → hàng bảng theo section" ra khỏi hàm sinh .docx để
// KIỂM CHỨNG được bằng snapshot test (không cần chạy docx).
//
// Mỗi section xuất 1 bảng gồm các cột:
//   STT · Hạng mục · Hướng dẫn · Giá trị · Đơn vị · Tiêu chuẩn · Kết quả · Hành động
//
// Nguồn giá trị: form_submission_item_result (đã ghim snapshot, bất biến).
// Hướng dẫn (huong_dan) không lưu trong kết quả → tra từ định nghĩa mẫu theo
// item_code (best-effort); thiếu thì để trống.
// ============================================================================

import { KET_QUA_LABEL, type KetQua } from "./checklist";

/** 1 dòng kết quả đã lưu (hình dạng tối thiểu cần cho Word). */
export type WordResultRow = {
  section_code: string;
  section_ten?: string | null;
  item_code: string;
  ten: string;
  gia_tri_so?: number | null;
  gia_tri_text?: string | null;
  don_vi?: string | null;
  tieu_chuan?: string | null;
  ket_qua?: string | null;
  ghi_chu?: string | null;
  hanh_dong?: string | null;
  position?: number | null;
};

export type WordItemRow = {
  stt: number;
  ten: string;
  huong_dan: string;
  gia_tri: string;
  don_vi: string;
  tieu_chuan: string;
  ket_qua: string;
  hanh_dong: string;
};

export type WordSection = {
  ma_section: string;
  ten: string;
  rows: WordItemRow[];
};

function ketQuaLabel(v: string | null | undefined): string {
  if (!v) return "";
  return KET_QUA_LABEL[v as KetQua] ?? String(v);
}

function giaTri(r: WordResultRow): string {
  if (r.gia_tri_so != null && Number.isFinite(r.gia_tri_so)) return String(r.gia_tri_so);
  if (r.gia_tri_text != null && String(r.gia_tri_text).trim() !== "") return String(r.gia_tri_text);
  return "";
}

/**
 * Gom kết quả đã lưu thành các section (giữ thứ tự xuất hiện = thứ tự position),
 * đánh STT theo từng section. `huongDanByCode` bổ sung cột Hướng dẫn.
 */
export function buildChecklistWordSections(
  results: readonly WordResultRow[] | null | undefined,
  huongDanByCode?: Readonly<Record<string, string | null | undefined>> | null,
): WordSection[] {
  const hd = huongDanByCode ?? {};
  const order: string[] = [];
  const map = new Map<string, WordSection>();

  for (const r of results ?? []) {
    let sec = map.get(r.section_code);
    if (!sec) {
      sec = { ma_section: r.section_code, ten: r.section_ten ?? r.section_code, rows: [] };
      map.set(r.section_code, sec);
      order.push(r.section_code);
    }
    sec.rows.push({
      stt: sec.rows.length + 1,
      ten: r.ten,
      huong_dan: (hd[r.item_code] ?? "").toString(),
      gia_tri: giaTri(r),
      don_vi: r.don_vi ?? "",
      tieu_chuan: r.tieu_chuan ?? "",
      ket_qua: ketQuaLabel(r.ket_qua),
      hanh_dong: r.hanh_dong ?? "",
    });
  }

  return order.map((c) => map.get(c)!);
}

/** Tiêu đề cột bảng checklist (dùng chung cho Word). */
export const CHECKLIST_WORD_HEADERS = [
  "STT",
  "Hạng mục",
  "Hướng dẫn",
  "Giá trị",
  "Đơn vị",
  "Tiêu chuẩn",
  "Kết quả",
  "Hành động",
] as const;
