// Import/Export cột `dac_tinh` cấp Mẫu — pure logic (không đụng DB).
// Format: cell dạng "MA1;MA2;MA3" (phân cách ';'), thứ tự không quan trọng.
// Idempotent: gọi apply nhiều lần với cùng đầu vào không sinh thêm bản ghi.

import { diffModelDacTinh } from "./dac-tinh";

/** Chuẩn hoá 1 mã nhãn tài sản: trim + uppercase + gạt ký tự trắng thừa. */
export function normalizeMa(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

/**
 * Tách ô nhãn tài sản "MA1; MA2 ;ma3" → ["MA1","MA2","MA3"] (uppercased, dedupe,
 * bỏ rỗng, giữ thứ tự xuất hiện đầu tiên).
 */
export function parseDacTinhCell(cell: string | null | undefined): string[] {
  if (!cell) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of String(cell).split(";")) {
    const ma = normalizeMa(raw);
    if (!ma) continue;
    if (seen.has(ma)) continue;
    seen.add(ma);
    out.push(ma);
  }
  return out;
}

/** Nối mảng mã thành cell "MA1;MA2" — luôn sort để export ổn định (roundtrip). */
export function serializeDacTinhCell(codes: readonly string[]): string {
  const uniq = Array.from(new Set(codes.map(normalizeMa).filter(Boolean)));
  uniq.sort();
  return uniq.join(";");
}

// ---------------------------------------------------------------------------
// Plan import — sinh diff cho dm_model_dac_tinh theo `ma`, idempotent.
// ---------------------------------------------------------------------------

export interface ImportRow {
  /** Mã Mẫu (dm_model.ma) — dùng để tra model_id. */
  model_ma: string;
  /** Chuỗi nhãn tài sản, phân cách ';'. */
  dac_tinh: string | null | undefined;
}

export interface ImportPlanOp {
  model_id: string;
  model_ma: string;
  toInsert: string[]; // dac_tinh_id
  toDelete: string[]; // dac_tinh_id
}

export interface ImportPlan {
  operations: ImportPlanOp[];
  /** Các mã nhãn tài sản không có trong danh mục — cảnh báo, bỏ qua. */
  unknownTags: Array<{ model_ma: string; ma: string }>;
  /** Các model_ma không tồn tại — cảnh báo, bỏ qua toàn bộ dòng. */
  missingModels: string[];
  /** Số dòng đã xử lý thành công (có ít nhất 1 op hoặc idempotent 0-op). */
  processedRows: number;
}

export interface PlanInput {
  rows: readonly ImportRow[];
  /** Map dm_model.ma (uppercase) → id */
  modelIdByMa: ReadonlyMap<string, string>;
  /** Map dm_dac_tinh.ma (uppercase) → id */
  tagIdByMa: ReadonlyMap<string, string>;
  /** Liên kết hiện tại: model_id → tập dac_tinh_id */
  existingLinks: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Sinh kế hoạch import cho dm_model_dac_tinh.
 * - Bỏ dòng có model_ma không tồn tại (ghi nhận vào missingModels).
 * - Bỏ qua các mã nhãn tài sản lạ (ghi vào unknownTags) NHƯNG vẫn xử lý các mã hợp lệ.
 * - Với mỗi model, so sánh set `next` (mã hợp lệ) với `prev` từ existingLinks →
 *   toInsert / toDelete.
 * - Idempotent: nếu next === prev thì toInsert=[] & toDelete=[] (op rỗng — có
 *   thể bỏ khi ghi DB); chạy lại KHÔNG tạo bản ghi mới.
 * - Nếu cùng model xuất hiện nhiều dòng, dòng SAU CÙNG thắng (chuẩn CSV).
 */
export function planImportDacTinh(input: PlanInput): ImportPlan {
  const { rows, modelIdByMa, tagIdByMa, existingLinks } = input;
  const unknownTags: ImportPlan["unknownTags"] = [];
  const missingModels: string[] = [];
  // Gom theo model_id — dòng sau ghi đè dòng trước cho cùng model.
  const nextByModel = new Map<string, { model_ma: string; ids: Set<string> }>();
  let processed = 0;
  for (const row of rows) {
    const ma = normalizeMa(row.model_ma ?? "");
    if (!ma) continue;
    const modelId = modelIdByMa.get(ma);
    if (!modelId) {
      if (!missingModels.includes(ma)) missingModels.push(ma);
      continue;
    }
    const codes = parseDacTinhCell(row.dac_tinh);
    const nextIds = new Set<string>();
    for (const c of codes) {
      const id = tagIdByMa.get(c);
      if (id) nextIds.add(id);
      else unknownTags.push({ model_ma: ma, ma: c });
    }
    nextByModel.set(modelId, { model_ma: ma, ids: nextIds });
    processed++;
  }

  const operations: ImportPlanOp[] = [];
  for (const [model_id, { model_ma, ids }] of nextByModel) {
    const prev = existingLinks.get(model_id) ?? new Set<string>();
    const { toInsert, toDelete } = diffModelDacTinh(
      Array.from(prev),
      Array.from(ids),
    );
    // Vẫn giữ op rỗng để phía UI đếm "đã xử lý idempotent" nếu cần.
    operations.push({ model_id, model_ma, toInsert, toDelete });
  }
  return { operations, unknownTags, missingModels, processedRows: processed };
}

/**
 * Serialize danh sách Mẫu → mảng dòng CSV/xlsx {model_ma, dac_tinh}.
 * Đảm bảo roundtrip: parse(serialize(x)) sinh cùng set mã.
 */
export interface ExportModelRow {
  model_ma: string;
  dac_tinh_codes: readonly string[];
}
export function serializeExport(rows: readonly ExportModelRow[]): Array<{ model_ma: string; dac_tinh: string }> {
  return rows.map((r) => ({
    model_ma: r.model_ma,
    dac_tinh: serializeDacTinhCell(r.dac_tinh_codes),
  }));
}
