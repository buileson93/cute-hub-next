// ============================================================================
// checklist.ts — Logic THUẦN (pure) cho mẫu phiếu dạng BẢNG KIỂM (checklist).
//
// Một mẫu bảo dưỡng có thể gồm nhiều SECTION (VD "Cảm biến", "Tủ phụ trợ"),
// mỗi section có nhiều ITEM kiểm tra. Mỗi item khi lập phiếu cho ra 1 KẾT QUẢ:
//   tên • hướng dẫn • kiểu kết quả • giá trị đo • đơn vị • tiêu chuẩn •
//   kết luận (đạt/không đạt/không áp dụng) • ghi chú • hành động khắc phục.
//
// Quy tắc quan trọng:
//   • KHÔNG ĐẠT ⇒ BẮT BUỘC có HÀNH ĐỘNG.
//   • Giá trị số (result_kind = "so") phải lưu dạng NUMBER, không lưu chuỗi.
//
// Module KHÔNG phụ thuộc DB → test được & dùng chung server/client.
// ============================================================================

/** Kiểu kết quả của 1 hạng mục kiểm tra. */
export type ResultKind = "so" | "dat_khong_dat" | "chon" | "text";

/** Kết luận của 1 hạng mục. */
export type KetQua = "dat" | "khong_dat" | "khong_ap_dung";

export const RESULT_KIND_LABEL: Record<ResultKind, string> = {
  so: "Giá trị đo",
  dat_khong_dat: "Đạt / Không đạt",
  chon: "Lựa chọn",
  text: "Ghi nhận",
};

export const KET_QUA_LABEL: Record<KetQua, string> = {
  dat: "Đạt",
  khong_dat: "Không đạt",
  khong_ap_dung: "Không áp dụng",
};

/** 1 hạng mục kiểm tra (định nghĩa trong mẫu). */
export type ChecklistItem = {
  item_code: string;
  ten: string;
  huong_dan: string | null;
  result_kind: ResultKind;
  don_vi: string | null;
  tieu_chuan: string | null;
  tuy_chon: string[] | null;
  bat_buoc: boolean;
  position: number;
};

/** 1 nhóm hạng mục trong mẫu. */
export type ChecklistSection = {
  ma_section: string;
  ten: string;
  mo_ta: string | null;
  position: number;
  items: ChecklistItem[];
};

/** Giá trị người dùng nhập cho 1 hạng mục (dạng thô, controlled từ UI). */
export type ItemInput = {
  /** Giá trị đo (chuỗi thô từ input số) — sẽ ép về number khi lưu. */
  gia_tri_so?: string | number | null;
  /** Giá trị chữ / lựa chọn. */
  gia_tri_text?: string | null;
  ket_qua?: KetQua | null;
  ghi_chu?: string | null;
  hanh_dong?: string | null;
};

/** Bản ghi kết quả để LƯU vào form_submission_item_result. */
export type ItemResultInsert = {
  submission_id: string;
  section_code: string;
  section_ten: string | null;
  item_code: string;
  ten: string;
  result_kind: ResultKind;
  gia_tri_so: number | null;
  gia_tri_text: string | null;
  don_vi: string | null;
  tieu_chuan: string | null;
  ket_qua: KetQua | null;
  ghi_chu: string | null;
  hanh_dong: string | null;
  position: number;
};

const isEmpty = (v: unknown): boolean =>
  v == null || (typeof v === "string" && v.trim() === "");

/**
 * Ép giá trị đo về number. Trả về null nếu rỗng, hoặc NaN sentinel nếu KHÔNG
 * phải số hợp lệ (dùng để báo lỗi "phải là số").
 */
export function coerceNumber(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : Number.NaN;
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Validate 1 hạng mục. Trả về thông báo lỗi (chuỗi) hoặc null nếu hợp lệ.
 * Quy tắc:
 *   - bắt buộc còn trống ⇒ lỗi.
 *   - result_kind = "so": giá trị đo phải là SỐ hợp lệ (không lưu chuỗi).
 *   - kết luận "không đạt" ⇒ bắt buộc có hành động khắc phục.
 */
export function validateItemInput(
  item: ChecklistItem,
  input: ItemInput | undefined,
): string | null {
  const inp = input ?? {};

  // KHÔNG ĐẠT ⇒ bắt buộc hành động (áp dụng cho MỌI hạng mục).
  if (inp.ket_qua === "khong_dat" && isEmpty(inp.hanh_dong)) {
    return `"${item.ten}": Không đạt phải nêu hành động khắc phục`;
  }

  if (item.result_kind === "so") {
    const n = coerceNumber(inp.gia_tri_so ?? null);
    if (Number.isNaN(n)) {
      return `"${item.ten}": giá trị đo phải là số`;
    }
    if (item.bat_buoc && n === null) {
      return `"${item.ten}": bắt buộc nhập giá trị đo`;
    }
    return null;
  }

  // Các kiểu còn lại: kiểm tra bắt buộc theo giá trị tương ứng.
  if (!item.bat_buoc) return null;
  if (item.result_kind === "dat_khong_dat") {
    if (isEmpty(inp.ket_qua)) return `"${item.ten}": bắt buộc chọn kết quả`;
  } else {
    if (isEmpty(inp.gia_tri_text) && isEmpty(inp.ket_qua)) {
      return `"${item.ten}": bắt buộc điền nội dung`;
    }
  }
  return null;
}

/** Trả về lỗi ĐẦU TIÊN trong toàn bộ checklist, hoặc null nếu hợp lệ. */
export function findChecklistError(
  sections: readonly ChecklistSection[] | null | undefined,
  inputs: Record<string, ItemInput> | null | undefined,
): string | null {
  const map = inputs ?? {};
  for (const sec of sections ?? []) {
    for (const item of sec.items) {
      const err = validateItemInput(item, map[item.item_code]);
      if (err) return err;
    }
  }
  return null;
}

/**
 * Dựng bản ghi kết quả để lưu. Giá trị số được ép về NUMBER (không lưu chuỗi).
 * Bỏ qua giá trị số không hợp lệ (đã được validate chặn trước đó) → lưu null.
 */
export function buildItemResult(
  submissionId: string,
  section: ChecklistSection,
  item: ChecklistItem,
  input: ItemInput | undefined,
): ItemResultInsert {
  const inp = input ?? {};
  let gia_tri_so: number | null = null;
  let gia_tri_text: string | null = null;

  if (item.result_kind === "so") {
    const n = coerceNumber(inp.gia_tri_so ?? null);
    gia_tri_so = n != null && !Number.isNaN(n) ? n : null;
  } else if (item.result_kind === "dat_khong_dat") {
    gia_tri_text = null;
  } else {
    gia_tri_text = isEmpty(inp.gia_tri_text) ? null : String(inp.gia_tri_text).trim();
  }

  return {
    submission_id: submissionId,
    section_code: section.ma_section,
    section_ten: section.ten ?? null,
    item_code: item.item_code,
    ten: item.ten,
    result_kind: item.result_kind,
    gia_tri_so,
    gia_tri_text,
    don_vi: item.don_vi ?? null,
    tieu_chuan: item.tieu_chuan ?? null,
    ket_qua: (inp.ket_qua ?? null) as KetQua | null,
    ghi_chu: isEmpty(inp.ghi_chu) ? null : String(inp.ghi_chu).trim(),
    hanh_dong: isEmpty(inp.hanh_dong) ? null : String(inp.hanh_dong).trim(),
    position: item.position,
  };
}

/** Dựng toàn bộ bản ghi kết quả cho 1 phiếu (theo thứ tự section → item). */
export function buildItemResults(
  submissionId: string,
  sections: readonly ChecklistSection[] | null | undefined,
  inputs: Record<string, ItemInput> | null | undefined,
): ItemResultInsert[] {
  const map = inputs ?? {};
  const out: ItemResultInsert[] = [];
  for (const sec of sections ?? []) {
    for (const item of sec.items) {
      out.push(buildItemResult(submissionId, sec, item, map[item.item_code]));
    }
  }
  return out;
}
