// ============================================================================
// Máy trạng thái thuần (pure) cho luồng xử lý tệp trước/khi tải lên.
//
// Tách khỏi React để test được và để mọi entry point đính kèm tệp dùng chung:
//   chọn tệp → kiểm tra → nhận diện PDF scan → OCR trên thiết bị (nếu cần)
//   → tải lên → xác nhận lưu trữ → hoàn tất/thất bại.
//
// ponytail: Giới hạn OCR ở `OCR_MAX_PAGES` trang đầu để không treo tab trên
// máy yếu. Muốn OCR toàn bộ tài liệu dài, chạy qua pipeline nền
// (src/lib/mirats/document-ocr/batch-processor.ts) thay vì nới hằng số này.
// ============================================================================

import type { StorageConfig } from "@/lib/mirats/storage-config";

/** Các pha xử lý của MỘT tệp. */
export type FileProcessPhase =
  | "selected"
  | "validating"
  | "detecting"
  | "ocr"
  | "uploading"
  | "verifying"
  | "completed"
  | "failed"
  | "cancelled";

/** Trạng thái hiển thị của một bước trong Process Box. */
export type StepState = "pending" | "active" | "completed" | "skipped" | "warning" | "failed";

export type OcrOutcome =
  | { kind: "not-needed" }
  | { kind: "extracted"; text: string; pages: number; truncated: boolean }
  | { kind: "failed"; message: string }
  | { kind: "skipped-limit"; reason: string };

export interface FileProcessState {
  /** Khoá cục bộ, độc lập theo từng tệp (chọn lại cùng tên vẫn tách biệt). */
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  phase: FileProcessPhase;
  /** 0..1 cho pha đang chạy (OCR hoặc upload). */
  progress: number;
  ocr: OcrOutcome | null;
  /** Nhà cung cấp lưu trữ đã xác minh; null = chưa xác định được. */
  storageProvider: StorageProviderId | null;
  errorMessage: string | null;
}

export type StorageProviderId = "supabase" | "r2" | "dual";

export const STORAGE_PROVIDER_LABEL: Record<StorageProviderId, string> = {
  supabase: "Đã lưu trên Lovable Cloud Storage",
  r2: "Đã lưu trên Cloudflare R2",
  dual: "Đã lưu trên Lovable Cloud Storage và Cloudflare R2",
};

/** Nhãn an toàn: không bịa nhà cung cấp khi chưa xác minh được. */
export function storageProviderLabel(provider: StorageProviderId | null): string {
  return provider ? STORAGE_PROVIDER_LABEL[provider] : "Đã lưu trữ thành công";
}

/** Suy ra nhà cung cấp thực tế từ cấu hình lưu trữ của hệ thống. */
export function resolveStorageProvider(
  config: Pick<StorageConfig, "primary" | "dualWrite"> | null | undefined,
): StorageProviderId | null {
  if (!config) return null;
  if (config.dualWrite) return "dual";
  return config.primary === "r2" ? "r2" : "supabase";
}

export const OCR_MAX_PAGES = 5;
/** Ngưỡng ký tự/trang để coi PDF là "có text layer" (dưới ngưỡng ⇒ nghi PDF scan). */
export const TEXT_LAYER_MIN_CHARS_PER_PAGE = 40;

export function isPdf(file: Pick<File, "name" | "type">): boolean {
  // Không tin hoàn toàn MIME của trình duyệt: kiểm tra thêm đuôi tệp.
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export interface ValidationRules {
  maxBytes: number;
  /** Đuôi tệp cho phép; bỏ trống = nhận mọi loại. */
  accept?: readonly string[];
}

export function validateFile(
  file: Pick<File, "name" | "size" | "type">,
  rules: ValidationRules,
): { ok: true } | { ok: false; message: string } {
  if (file.size <= 0) return { ok: false, message: "Tệp rỗng hoặc không đọc được" };
  if (file.size > rules.maxBytes) {
    const mb = Math.round(rules.maxBytes / (1024 * 1024));
    return { ok: false, message: `Tệp vượt quá ${mb}MB` };
  }
  if (rules.accept?.length) {
    const lower = file.name.toLowerCase();
    const ok = rules.accept.some((ext) => lower.endsWith(ext.toLowerCase()));
    if (!ok) return { ok: false, message: `Chỉ nhận tệp ${rules.accept.join(", ")}` };
  }
  return { ok: true };
}

/** Quyết định có cần OCR không dựa trên lượng text đọc được từ PDF. */
export function needsOcr(totalChars: number, pageCount: number): boolean {
  if (pageCount <= 0) return false;
  return totalChars / pageCount < TEXT_LAYER_MIN_CHARS_PER_PAGE;
}

export interface StepDescriptor {
  key: "selected" | "validating" | "detecting" | "ocr" | "uploading" | "verifying" | "done";
  label: string;
  state: StepState;
}

const PHASE_ORDER: FileProcessPhase[] = [
  "selected",
  "validating",
  "detecting",
  "ocr",
  "uploading",
  "verifying",
  "completed",
];

function rank(phase: FileProcessPhase): number {
  const i = PHASE_ORDER.indexOf(phase);
  return i === -1 ? PHASE_ORDER.length : i;
}

/** Sinh danh sách bước cho Process Box từ state hiện tại. */
export function buildSteps(state: FileProcessState): StepDescriptor[] {
  const isPdfFile = isPdf({ name: state.fileName, type: state.fileType });
  const current = rank(state.phase);
  const failed = state.phase === "failed";
  const cancelled = state.phase === "cancelled";

  const stateFor = (phase: FileProcessPhase): StepState => {
    const r = rank(phase);
    if (failed && r === current) return "failed";
    if ((failed || cancelled) && r > current) return "pending";
    if (state.phase === "completed") return "completed";
    if (r < current) return "completed";
    if (r === current) return "active";
    return "pending";
  };

  const steps: StepDescriptor[] = [
    { key: "selected", label: "Đã chọn tệp", state: stateFor("selected") },
    { key: "validating", label: "Đang kiểm tra tệp", state: stateFor("validating") },
  ];

  if (isPdfFile) {
    steps.push({ key: "detecting", label: "Đang nhận diện PDF scan", state: stateFor("detecting") });
    steps.push({ key: "ocr", label: "Đang OCR trên thiết bị", state: ocrStepState(state) });
  }

  steps.push({ key: "uploading", label: "Đang tải lên", state: stateFor("uploading") });
  steps.push({ key: "verifying", label: "Đang xác nhận lưu trữ", state: stateFor("verifying") });
  steps.push({
    key: "done",
    label: failed ? "Thất bại" : cancelled ? "Đã huỷ" : "Hoàn tất",
    state:
      state.phase === "completed"
        ? "completed"
        : failed
          ? "failed"
          : cancelled
            ? "warning"
            : "pending",
  });

  return steps;
}

function ocrStepState(state: FileProcessState): StepState {
  if (state.phase === "ocr") return "active";
  const outcome = state.ocr;
  if (!outcome) return rank(state.phase) > rank("ocr") ? "skipped" : "pending";
  switch (outcome.kind) {
    case "not-needed":
      return "skipped";
    case "extracted":
      return outcome.truncated ? "warning" : "completed";
    case "failed":
      return "warning";
    case "skipped-limit":
      return "warning";
  }
}

/** Mô tả ngắn kết quả OCR cho phần tóm tắt sau khi hoàn tất. */
export function ocrSummary(outcome: OcrOutcome | null): string {
  if (!outcome) return "Không áp dụng OCR";
  switch (outcome.kind) {
    case "not-needed":
      return "Không cần OCR (PDF có sẵn văn bản)";
    case "extracted":
      return outcome.truncated
        ? `Đã trích xuất văn bản (${outcome.pages} trang đầu)`
        : "Đã trích xuất văn bản";
    case "failed":
      return `OCR thất bại: ${outcome.message}`;
    case "skipped-limit":
      return `Bỏ qua do giới hạn: ${outcome.reason}`;
  }
}

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
