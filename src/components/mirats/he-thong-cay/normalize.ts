// ============================================================================
// Chuẩn hoá & kiểm tra dữ liệu cây hệ thống tại "trust boundary".
//
// Mọi payload từ API/DB (bảng `thiet_bi`) đều đi qua đây trước khi vào
// buildTree/TreeView/CayMindMap. Mục tiêu: một bản ghi hỏng KHÔNG được phép
// làm sập cả trang "Cây Hệ thống".
//
// Nguyên tắc:
// - Không dùng `any` ở API công khai; đầu vào nhận `unknown`.
// - Giữ tối đa dữ liệu hợp lệ; chỉ loại bỏ bản ghi thực sự không dùng được.
// - Ghi log kỹ thuật ở môi trường DEV, im lặng ở PROD (đã có thống kê trả về).
//
// ponytail: chỉ chuẩn hoá lớp thiết bị (nguồn duy nhất gây crash trong thực
// tế); nâng cấp sang schema validation đầy đủ khi cây nhận thêm nguồn dữ liệu
// ngoài (import CSV, API bên thứ ba).
// ============================================================================

/** Bản ghi thiết bị thô sau khi chuẩn hoá — vẫn giữ nguyên các trường mở rộng. */
export type RawDeviceRow = Record<string, unknown> & {
  id: string;
  ma_thiet_bi: string;
};

export interface NormalizeReport {
  /** Số bản ghi đầu vào (0 nếu payload không phải mảng). */
  input: number;
  /** Số bản ghi giữ lại. */
  kept: number;
  /** Bị loại vì không phải object hoặc thiếu khoá định danh. */
  invalid: number;
  /** Bị loại vì trùng `id` (giữ bản ghi đầu tiên). */
  duplicate: number;
  /** Payload không phải mảng (null/undefined/object sai shape). */
  malformedPayload: boolean;
}

export interface NormalizeResult {
  rows: RawDeviceRow[];
  report: NormalizeReport;
}

function toKey(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

/**
 * Chuẩn hoá danh sách thiết bị thô.
 * - Bỏ phần tử null/không phải object.
 * - Ép `id` và `ma_thiet_bi` về chuỗi (chấp nhận number từ schema cũ).
 * - Bản ghi thiếu cả `id` lẫn `ma_thiet_bi` bị loại (không thể định danh node).
 * - Bản ghi thiếu một trong hai được bù bằng khoá còn lại.
 * - Loại `id` trùng lặp để tránh key trùng khi render cây/sơ đồ.
 */
export function normalizeDeviceRows(payload: unknown): NormalizeResult {
  const report: NormalizeReport = {
    input: 0,
    kept: 0,
    invalid: 0,
    duplicate: 0,
    malformedPayload: false,
  };

  if (!Array.isArray(payload)) {
    report.malformedPayload = payload != null;
    return { rows: [], report };
  }

  report.input = payload.length;
  const seen = new Set<string>();
  const rows: RawDeviceRow[] = [];

  for (const item of payload) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      report.invalid += 1;
      continue;
    }
    const record = item as Record<string, unknown>;
    const id = toKey(record["id"]);
    const ma = toKey(record["ma_thiet_bi"]);
    if (!id && !ma) {
      report.invalid += 1;
      continue;
    }
    const finalId = id || ma;
    if (seen.has(finalId)) {
      report.duplicate += 1;
      continue;
    }
    seen.add(finalId);
    rows.push({ ...record, id: finalId, ma_thiet_bi: ma || finalId });
  }

  report.kept = rows.length;

  if (import.meta.env.DEV && (report.invalid > 0 || report.duplicate > 0 || report.malformedPayload)) {
    console.warn("[CayHeThong] Dữ liệu thiết bị có bản ghi không hợp lệ", report);
  }

  return { rows, report };
}

/** Có bất thường dữ liệu đáng cảnh báo cho người dùng hay không. */
export function hasDataAnomaly(report: NormalizeReport): boolean {
  return report.malformedPayload || report.invalid > 0 || report.duplicate > 0;
}

/** Khoá localStorage do màn hình Cây Hệ thống sở hữu (dùng khi reset an toàn). */
export const CAY_LOCAL_KEYS = ["mirats_cay_display"] as const;

/** Xoá trạng thái hiển thị cục bộ — dùng khi dữ liệu cũ gây lỗi render. */
export function resetCayLocalState(): void {
  if (typeof window === "undefined") return;
  for (const key of CAY_LOCAL_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // localStorage bị chặn (private mode) — bỏ qua, không ảnh hưởng luồng chính.
    }
  }
}
