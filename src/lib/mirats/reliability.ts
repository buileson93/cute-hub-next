/**
 * N9 — Reliability: MTBF, MTTR, Availability (pure).
 *
 * Cùng công thức với RPC `reliability_by_scope` phía CSDL để test đơn vị
 * có oracle độc lập. Xem `docs/superpowers/specs/n9-reliability.md` §4.
 */

export interface FailureEvent {
  id: string;
  /** Thời điểm chuyển sang `dang_xu_ly` — mốc bắt đầu downtime. */
  downtime_start: Date;
  /** Thời điểm chuyển sang `hoan_thanh` — mốc kết thúc downtime; `null` = còn mở. */
  downtime_end: Date | null;
  /** Đồng nhất với `downtime_end` khi đã đóng; giữ tách rời để test rõ ràng. */
  closed_at?: Date | null;
}

export interface ReliabilityWindow {
  from: Date;
  to: Date;
}

export interface ReliabilityResult {
  mtbf_h: number | null;
  mttr_h: number | null;
  availability: number | null;
  downtime_s: number;
  failures: number;
  failures_closed: number;
  uptime_s: number;
  operational_s: number;
}

const SECONDS_PER_HOUR = 3600;

/** Cắt xén khoảng downtime vào cửa sổ quan sát. */
function clip(startMs: number, endMs: number, fromMs: number, toMs: number): number {
  return Math.max(0, Math.min(endMs, toMs) - Math.max(startMs, fromMs)) / 1000;
}

export function computeReliability(
  events: FailureEvent[],
  window: ReliabilityWindow,
  operationalSeconds: number,
): ReliabilityResult {
  const fromMs = window.from.getTime();
  const toMs = window.to.getTime();
  if (toMs <= fromMs) {
    return {
      mtbf_h: null,
      mttr_h: null,
      availability: null,
      downtime_s: 0,
      failures: 0,
      failures_closed: 0,
      uptime_s: 0,
      operational_s: Math.max(0, operationalSeconds),
    };
  }

  let downtime_s = 0;
  let failures = 0;
  let failures_closed = 0;
  let mttrNumeratorSeconds = 0;

  for (const ev of events) {
    const startMs = ev.downtime_start.getTime();
    // Sự cố còn mở → dùng `to` làm mốc kết thúc để cộng downtime đã trôi qua.
    const endMs = ev.downtime_end ? ev.downtime_end.getTime() : toMs;
    // Loại các sự cố hoàn toàn nằm ngoài cửa sổ.
    if (endMs < fromMs || startMs > toMs) continue;

    downtime_s += clip(startMs, endMs, fromMs, toMs);

    // §4: failures đếm theo `downtime_start in [from,to]`.
    if (startMs >= fromMs && startMs <= toMs) failures += 1;

    // MTTR chỉ tính sự cố đã ĐÓNG trong cửa sổ (theo closed_at ≡ downtime_end).
    if (ev.downtime_end && endMs >= fromMs && endMs <= toMs) {
      failures_closed += 1;
      mttrNumeratorSeconds += Math.max(0, (endMs - startMs) / 1000);
    }
  }

  const opSec = Math.max(0, operationalSeconds);
  const uptime_s = Math.max(0, opSec - downtime_s);

  const mtbf_h = failures === 0 ? null : round(uptime_s / failures / SECONDS_PER_HOUR, 2);
  const mttr_h =
    failures_closed === 0
      ? null
      : round(mttrNumeratorSeconds / failures_closed / SECONDS_PER_HOUR, 2);
  const availability = opSec === 0 ? null : round(Math.max(0, 1 - downtime_s / opSec), 4);

  return {
    mtbf_h,
    mttr_h,
    availability,
    downtime_s: Math.round(downtime_s),
    failures,
    failures_closed,
    uptime_s: Math.round(uptime_s),
    operational_s: Math.round(opSec),
  };
}

function round(v: number, decimals: number): number {
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

/** Đổi giây → giờ, 1 chữ số thập phân, dùng cho hiển thị (không dùng tính toán). */
export function formatHours(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  return `${(seconds / SECONDS_PER_HOUR).toFixed(1)} h`;
}

/** Đổi availability (0..1) → %, 2 chữ số. */
export function formatAvailability(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

// ===========================================================================
// LEGACY KPI API — dùng bởi bao-tri-kpi, pl04-metrics, _app.index và các
// route sự cố. Giữ tương thích với code hiện có: KpiResult / KpiSourceRecord /
// ReliabilityIncident + mtbf/mttr/availability/rangeHours/formatKpiValue.
// ===========================================================================

export interface ReliabilityIncident {
  id?: string;
  ma_su_co?: string | null;
  ngay_phat_hien: string | null;
  thoi_diem_khac_phuc?: string | null;
  /** Downtime (phút) do người dùng nhập; ưu tiên hơn diff mốc thời gian. */
  thoi_gian_gian_doan?: number | null;
}

export interface KpiSourceRecord {
  id: string | null;
  ma: string | null;
  ngay: string | null;
  downtimeMinutes: number | null;
  onTime?: boolean;
}

export type KpiUnit = "percent" | "min" | "count" | "hour" | "day" | "per-year";

export interface KpiResult {
  value: number | null;
  unit: KpiUnit;
  sampleSize: number;
  sources: KpiSourceRecord[];
  insufficient: boolean;
  reason: string | null;
}

/** (endIso - startIso) → giờ. Trả 0 nếu tham số không hợp lệ. */
export function rangeHours(startIso: string, endIso: string): number {
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 0;
  return (e - s) / 3_600_000;
}

/** Downtime (phút) của 1 sự cố: ưu tiên `thoi_gian_gian_doan`. */
export function incidentDowntimeMinutes(inc: ReliabilityIncident): number | null {
  if (typeof inc.thoi_gian_gian_doan === "number" && inc.thoi_gian_gian_doan >= 0) {
    return inc.thoi_gian_gian_doan;
  }
  if (inc.ngay_phat_hien && inc.thoi_diem_khac_phuc) {
    const s = Date.parse(inc.ngay_phat_hien);
    const e = Date.parse(inc.thoi_diem_khac_phuc);
    if (Number.isFinite(s) && Number.isFinite(e) && e >= s) {
      return Math.round((e - s) / 60_000);
    }
  }
  return null;
}

function toSource(inc: ReliabilityIncident): KpiSourceRecord {
  return {
    id: inc.id ?? null,
    ma: inc.ma_su_co ?? inc.id ?? null,
    ngay: inc.ngay_phat_hien ?? null,
    downtimeMinutes: incidentDowntimeMinutes(inc),
  };
}

export interface AvailabilityInput {
  assetCount: number;
  windowHours: number;
  incidents: readonly ReliabilityIncident[];
}

/**
 * Availability (%) trong cửa sổ: 100 * (1 - downtime / totalUp).
 * totalUp = assetCount * windowHours * 60 (phút).
 */
export function availability(input: AvailabilityInput): KpiResult {
  const { assetCount, windowHours, incidents } = input;
  const sources = incidents.map(toSource);
  if (assetCount <= 0 || windowHours <= 0) {
    return {
      value: null,
      unit: "percent",
      sampleSize: incidents.length,
      sources,
      insufficient: true,
      reason: "Chưa đủ dữ liệu tài sản/cửa sổ thời gian để tính availability",
    };
  }
  const totalUpMinutes = assetCount * windowHours * 60;
  let downtime = 0;
  for (const inc of incidents) {
    const dt = incidentDowntimeMinutes(inc);
    if (dt != null) downtime += dt;
  }
  const raw = 100 * (1 - downtime / totalUpMinutes);
  const clamped = Math.max(0, Math.min(100, raw));
  return {
    value: Math.round(clamped * 100) / 100,
    unit: "percent",
    sampleSize: incidents.length,
    sources,
    insufficient: false,
    reason: null,
  };
}

/** MTTR (phút) — trung bình downtime của các sự cố có đủ dữ liệu. */
export function mttr(incidents: readonly ReliabilityIncident[]): KpiResult {
  const sources: KpiSourceRecord[] = [];
  let sum = 0;
  let n = 0;
  for (const inc of incidents) {
    const dt = incidentDowntimeMinutes(inc);
    if (dt == null) continue;
    sum += dt;
    n += 1;
    sources.push(toSource(inc));
  }
  if (n === 0) {
    return {
      value: null,
      unit: "min",
      sampleSize: 0,
      sources: [],
      insufficient: true,
      reason: "Chưa có sự cố đủ mốc thời gian để tính MTTR",
    };
  }
  return {
    value: Math.round((sum / n) * 10) / 10,
    unit: "min",
    sampleSize: n,
    sources,
    insufficient: false,
    reason: null,
  };
}

/**
 * MTBF (ngày) — trung bình khoảng cách giữa hai lần phát hiện sự cố liên tiếp.
 * Insufficient nếu <2 sự cố có `ngay_phat_hien`.
 */
export function mtbf(incidents: readonly ReliabilityIncident[]): KpiResult {
  const stamps = incidents
    .map((inc) => ({ inc, t: inc.ngay_phat_hien ? Date.parse(inc.ngay_phat_hien) : NaN }))
    .filter((r) => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);
  if (stamps.length < 2) {
    return {
      value: null,
      unit: "day",
      sampleSize: stamps.length,
      sources: stamps.map((s) => toSource(s.inc)),
      insufficient: true,
      reason: "Cần ≥ 2 sự cố có ngày phát hiện để tính MTBF",
    };
  }
  let sumMs = 0;
  for (let i = 1; i < stamps.length; i++) sumMs += stamps[i].t - stamps[i - 1].t;
  const meanDays = sumMs / (stamps.length - 1) / 86_400_000;
  return {
    value: Math.round(meanDays * 10) / 10,
    unit: "day",
    sampleSize: stamps.length,
    sources: stamps.map((s) => toSource(s.inc)),
    insufficient: false,
    reason: null,
  };
}

/**
 * Định dạng giá trị KPI cho hiển thị. Truyền `customFmt` khi cần override
 * (ví dụ MTTR muốn format "2h 30'").
 */
export function formatKpiValue(
  res: KpiResult | null | undefined,
  customFmt?: (value: number) => string,
): string {
  if (!res || res.value == null) return "Chưa đủ dữ liệu";
  if (customFmt) return customFmt(res.value);
  switch (res.unit) {
    case "percent":
      return `${res.value.toFixed(2)}%`;
    case "min":
      return `${res.value.toFixed(1)} phút`;
    case "hour":
      return `${res.value.toFixed(1)} giờ`;
    case "day":
      return `${res.value.toFixed(1)} ngày`;
    case "count":
      return `${res.value}`;
    case "per-year":
      return `${res.value.toFixed(2)}/năm`;
    default:
      return `${res.value}`;
  }
}
