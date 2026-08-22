// ============================================================================
// N6 — Máy trạng thái vòng đời SỰ CỐ / HỎNG HÓC (module thuần).
// Xem docs/superpowers/specs/n6-su-co-workflow.md để hiểu ràng buộc & test.
// KHÔNG import React / Supabase — dùng chung cho UI, RPC caller và test.
// ============================================================================

export const SU_CO_WORKFLOW_STATES = [
  "bao_cao",
  "tiep_nhan",
  "dang_xu_ly",
  "cho_vat_tu",
  "hoan_thanh",
  "nghiem_thu",
  "huy",
] as const;

export type SuCoTrangThai = (typeof SU_CO_WORKFLOW_STATES)[number];

/** Nhãn hiển thị VN (giữ ngắn để đặt trên nút/timeline). */
export const SU_CO_TRANG_THAI_LABEL: Record<SuCoTrangThai, string> = {
  bao_cao: "Đã báo cáo",
  tiep_nhan: "Đã tiếp nhận",
  dang_xu_ly: "Đang xử lý",
  cho_vat_tu: "Chờ vật tư",
  hoan_thanh: "Hoàn thành xử lý",
  nghiem_thu: "Đã nghiệm thu",
  huy: "Đã huỷ",
};

/** Ma trận chuyển hợp lệ — nguồn duy nhất cho canTransition & RPC. */
export const TRANSITIONS: Record<SuCoTrangThai, SuCoTrangThai[]> = {
  bao_cao: ["tiep_nhan", "huy"],
  tiep_nhan: ["dang_xu_ly", "huy"],
  dang_xu_ly: ["cho_vat_tu", "hoan_thanh"],
  cho_vat_tu: ["dang_xu_ly", "hoan_thanh"],
  hoan_thanh: ["nghiem_thu", "dang_xu_ly"],
  nghiem_thu: ["dang_xu_ly"],
  huy: [],
};

/** Các trạng thái được coi là "đang mở" (còn cần xử lý). */
export const OPEN_WORKFLOW_STATES: ReadonlySet<SuCoTrangThai> = new Set([
  "bao_cao",
  "tiep_nhan",
  "dang_xu_ly",
  "cho_vat_tu",
]);

/** Trạng thái kết thúc (terminal — không đi tiếp trừ khi mở lại thủ công). */
export const TERMINAL_STATES: ReadonlySet<SuCoTrangThai> = new Set(["nghiem_thu", "huy"]);

function isState(v: unknown): v is SuCoTrangThai {
  return typeof v === "string" && (SU_CO_WORKFLOW_STATES as readonly string[]).includes(v);
}

/** True nếu cặp (from,to) nằm trong ma trận. Không throw khi input lạ. */
export function canTransition(
  from: string | null | undefined,
  to: string | null | undefined,
): boolean {
  if (!isState(from) || !isState(to)) return false;
  if (from === to) return false;
  return TRANSITIONS[from].includes(to);
}

/** Danh sách trạng thái đích hợp lệ từ `from`. */
export function nextStates(from: string | null | undefined): SuCoTrangThai[] {
  if (!isState(from)) return [];
  return [...TRANSITIONS[from]];
}

// ---------------------------------------------------------------------------
// Backfill giá trị cũ về enum mới (dùng ở migration + UI đọc bản ghi legacy).
// ---------------------------------------------------------------------------
const LEGACY_MAP: Record<string, SuCoTrangThai> = {
  moi: "bao_cao",
  mới: "bao_cao",
  new: "bao_cao",
  bao_cao: "bao_cao",
  tiep_nhan: "tiep_nhan",
  "đã tiếp nhận": "tiep_nhan",
  dang_xu_ly: "dang_xu_ly",
  "đang xử lý": "dang_xu_ly",
  in_progress: "dang_xu_ly",
  cho_vat_tu: "cho_vat_tu",
  "chờ vật tư": "cho_vat_tu",
  hoan_thanh: "hoan_thanh",
  "hoàn thành xử lý": "hoan_thanh",
  da_khac_phuc: "hoan_thanh",
  "đã khắc phục": "hoan_thanh",
  resolved: "hoan_thanh",
  nghiem_thu: "nghiem_thu",
  "đã nghiệm thu": "nghiem_thu",
  dong: "nghiem_thu",
  đóng: "nghiem_thu",
  closed: "nghiem_thu",
  da_dong: "nghiem_thu",
  huy: "huy",
  huỷ: "huy",
  hủy: "huy",
  cancelled: "huy",
  "hoàn thành": "hoan_thanh",
};

/** Chuẩn hoá về enum mới; giá trị không nhận diện → `bao_cao`. */
export function normalizeWorkflowState(raw: string | null | undefined): SuCoTrangThai {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "bao_cao";
  return LEGACY_MAP[s] ?? "bao_cao";
}

// ---------------------------------------------------------------------------
// Metrics — tính từ lịch sử chuyển trạng thái (không đọc DB).
// ---------------------------------------------------------------------------
export interface LichSuBuoc {
  tu: SuCoTrangThai | null;
  den: SuCoTrangThai;
  /** ISO timestamp. */
  at: string;
}

export interface TimeMetrics {
  response_time_phut: number | null; // bao_cao → tiep_nhan
  repair_time_phut: number | null; // tiep_nhan → hoan_thanh (lần cuối)
  downtime_phut: number | null; // Σ (dang_xu_ly → hoan_thanh)
  wait_parts_phut: number; // Σ cho_vat_tu
  wrench_time_phut: number | null; // downtime - wait_parts
}

function toMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

function diffMinutes(fromIso: string, toIso: string): number {
  return Math.round((toMs(toIso) - toMs(fromIso)) / 60_000);
}

/**
 * Tính chỉ số thời gian từ lịch sử vòng đời.
 * Quy ước:
 *   - `response_time` = at(first tiep_nhan) - at(first bao_cao)
 *   - `downtime`      = Σ đoạn dang_xu_ly → hoan_thanh (cộng dồn nếu mở lại)
 *   - `wait_parts`    = Σ đoạn cho_vat_tu → (dang_xu_ly | hoan_thanh)
 *   - `repair_time`   = at(hoan_thanh cuối) - at(first tiep_nhan)
 *   - `wrench_time`   = downtime - wait_parts
 * Nếu chưa hoàn thành, các chỉ số phụ thuộc "hoan_thanh cuối" trả `null`.
 */
export function computeMetrics(lich_su: readonly LichSuBuoc[]): TimeMetrics {
  const empty: TimeMetrics = {
    response_time_phut: null,
    repair_time_phut: null,
    downtime_phut: null,
    wait_parts_phut: 0,
    wrench_time_phut: null,
  };
  if (!lich_su || lich_su.length === 0) return empty;

  const firstBaoCao = lich_su.find((b) => b.den === "bao_cao");
  const firstTiepNhan = lich_su.find((b) => b.den === "tiep_nhan");
  const lastHoanThanh = [...lich_su].reverse().find((b) => b.den === "hoan_thanh");

  const response =
    firstBaoCao && firstTiepNhan ? diffMinutes(firstBaoCao.at, firstTiepNhan.at) : null;
  const repair =
    firstTiepNhan && lastHoanThanh ? diffMinutes(firstTiepNhan.at, lastHoanThanh.at) : null;

  // Downtime: đi qua các đoạn dang_xu_ly → hoan_thanh (chấp nhận cho_vat_tu xen giữa).
  let downtimeCounted = 0;
  let downtimeStart: string | null = null;
  // Wait parts: đoạn cho_vat_tu → next
  let waitStart: string | null = null;
  let waitTotal = 0;
  let hasCompletedSegment = false;

  for (const step of lich_su) {
    if (step.den === "dang_xu_ly" && downtimeStart === null) {
      downtimeStart = step.at;
    }
    if (step.den === "cho_vat_tu") {
      waitStart = step.at;
    }
    if (waitStart && step.den !== "cho_vat_tu" && step.tu === "cho_vat_tu") {
      waitTotal += diffMinutes(waitStart, step.at);
      waitStart = null;
    }
    if (step.den === "hoan_thanh" && downtimeStart) {
      downtimeCounted += diffMinutes(downtimeStart, step.at);
      downtimeStart = null;
      hasCompletedSegment = true;
    }
  }

  const downtime = hasCompletedSegment ? downtimeCounted : null;
  const wrench = downtime === null ? null : Math.max(0, downtime - waitTotal);

  return {
    response_time_phut: response,
    repair_time_phut: repair,
    downtime_phut: downtime,
    wait_parts_phut: waitTotal,
    wrench_time_phut: wrench,
  };
}
