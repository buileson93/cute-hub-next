// ============================================================================
// Cờ tính năng (feature flags) đơn giản, đọc từ localStorage với giá trị mặc
// định an toàn. Dùng để giữ luồng "wizard" nhập liệu hiện tại trong khi bật
// dần lớp staging (import_batch/import_item).
// ============================================================================

export type FeatureFlag =
  // Ghi staging (import_batch/import_item) khi tải & phân tích file. Mặc định bật.
  | "importStaging"
  // Giữ nút/luồng wizard nhập liệu trực tiếp (xem trước → ghi). Mặc định bật.
  | "importWizard"
  // Cho các nút "Nhập" rải rác (Nhà sản xuất, danh mục, mẫu…) đi qua ImportEngine
  // chung (runBulkImport) thay vì upsert trực tiếp. Mặc định TẮT để không đổi
  // hành vi hiện tại; bật khi đã kiểm chứng parity với Import Studio.
  | "importEngineUnified"
  // Cho Dashboard lấy MTTR / MTBF / Availability từ nguồn tính toán thuần duy
  // nhất (src/lib/mirats/reliability.ts) thay cho công thức nội tuyến cũ. Mặc
  // định TẮT để không đổi con số đang hiển thị; bật khi đã kiểm chứng parity.
  | "reliabilityKpiV2"
  // Cho Dashboard lấy "PM hoàn thành đúng hạn" từ nguồn tính toán thuần duy nhất
  // (src/lib/mirats/bao-tri-kpi.ts) dựa trên phiếu công việc bảo dưỡng
  // (cong_viec_bao_tri) có ngày đến hạn thực. Mặc định TẮT để không đổi con số
  // đang hiển thị; bật khi đã kiểm chứng parity.
  | "baoTriKpiV2";

const DEFAULTS: Record<FeatureFlag, boolean> = {
  importStaging: true,
  importWizard: true,
  importEngineUnified: false,
  reliabilityKpiV2: false,
  baoTriKpiV2: false,
};

const KEY = "mirats.features";

function readOverrides(): Partial<Record<FeatureFlag, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<FeatureFlag, boolean>>) : {};
  } catch {
    return {};
  }
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const ov = readOverrides();
  return ov[flag] ?? DEFAULTS[flag];
}

export function setFeatureFlag(flag: FeatureFlag, value: boolean): void {
  if (typeof window === "undefined") return;
  const ov = readOverrides();
  ov[flag] = value;
  window.localStorage.setItem(KEY, JSON.stringify(ov));
}
