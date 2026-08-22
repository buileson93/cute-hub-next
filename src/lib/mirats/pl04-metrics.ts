// ============================================================================
// pl04-metrics.ts — Logic THUẦN cho PHỤ LỤC PL04 (báo cáo độ tin cậy 6 THÁNG).
//
// PL04 KHÔNG cho nhập tay các con số kỹ thuật; nó TỰ LẤY từ NGUỒN CHUẨN:
//   • số sự cố  — đếm sự cố phát hiện trong cửa sổ 6 tháng.
//   • downtime  — tổng phút gián đoạn (qua reliability.incidentDowntimeMinutes).
//   • availability 6 tháng — reliability.availability() với windowHours thực tế.
//
// Kết quả được "đóng băng" thành METRIC SNAPSHOT (metric_key + value + unit +
// sample_size + cửa sổ thời gian + danh sách record nguồn) để lưu vào
// form_submission_metric — con số trên biên bản KHÔNG đổi khi dữ liệu sau này
// thay đổi. Người dùng chỉ nhập ĐÁNH GIÁ / VẤN ĐỀ TỒN TẠI / KIẾN NGHỊ (text).
//
// KHÔNG phụ thuộc React/Supabase → test được, dùng chung server/client.
// ============================================================================

import {
  availability,
  incidentDowntimeMinutes,
  rangeHours,
  type KpiSourceRecord,
  type ReliabilityIncident,
} from "./reliability";

export const PL04_METRIC_KEYS = {
  SO_SU_CO: "so_su_co",
  DOWNTIME_PHUT: "downtime_phut",
  AVAILABILITY_6THANG: "availability_6thang",
} as const;

export type Pl04MetricKey = (typeof PL04_METRIC_KEYS)[keyof typeof PL04_METRIC_KEYS];

/** 1 dòng metric snapshot để lưu vào form_submission_metric. */
export type MetricSnapshot = {
  metric_key: Pl04MetricKey;
  /** null = chưa đủ dữ liệu (không ép 0). */
  value: number | null;
  unit: "count" | "min" | "percent";
  sample_size: number;
  window_start: string;
  window_end: string;
  insufficient: boolean;
  reason: string | null;
  /** Bản ghi nguồn (drill-down) — đóng băng cùng con số. */
  sources: KpiSourceRecord[];
};

/** Đầu ngày UTC (ms) từ "YYYY-MM-DD". */
function dayMs(v: string | null | undefined): number | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const t = new Date(`${s.slice(0, 10)}T00:00:00Z`).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Cửa sổ 6 tháng (mặc định 180 ngày) kết thúc tại `endISO` (mặc định hôm nay).
 * Trả về chuỗi ISO đầy đủ để tính windowHours chính xác.
 */
export function sixMonthWindow(endISO?: string | null, days = 180): { start: string; end: string } {
  const end = endISO ? new Date(endISO) : new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Lọc sự cố có ngày phát hiện nằm trong [start, end]. */
export function filterIncidentsInWindow(
  incidents: readonly ReliabilityIncident[],
  startISO: string,
  endISO: string,
): ReliabilityIncident[] {
  const s = Date.parse(startISO);
  const e = Date.parse(endISO);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return [];
  return incidents.filter((inc) => {
    const t = dayMs(inc.ngay_phat_hien);
    return t != null && t >= s && t <= e;
  });
}

function toSources(incidents: readonly ReliabilityIncident[]): KpiSourceRecord[] {
  return incidents.map((inc) => ({
    id: inc.id ?? null,
    ma: inc.ma_su_co ?? null,
    ngay: inc.ngay_phat_hien ?? null,
    downtimeMinutes: incidentDowntimeMinutes(inc),
  }));
}

export type Pl04Input = {
  incidents: readonly ReliabilityIncident[];
  /** Số tài sản trọng yếu trong phạm vi hệ thống. */
  assetCount: number;
  /** Cửa sổ; nếu bỏ trống dùng 6 tháng tính tới hôm nay. */
  windowStart?: string | null;
  windowEnd?: string | null;
};

export type Pl04Result = {
  window: { start: string; end: string };
  metrics: MetricSnapshot[];
};

/**
 * Tính 3 metric PL04 từ nguồn chuẩn và đóng băng thành snapshot.
 * Downtime & availability đi qua reliability.ts (nguồn duy nhất).
 */
export function buildPl04Metrics(input: Pl04Input): Pl04Result {
  const win =
    input.windowStart && input.windowEnd
      ? { start: input.windowStart, end: input.windowEnd }
      : sixMonthWindow(input.windowEnd);

  const inWindow = filterIncidentsInWindow(input.incidents, win.start, win.end);
  const sources = toSources(inWindow);

  // 1) Số sự cố
  const soSuCo: MetricSnapshot = {
    metric_key: PL04_METRIC_KEYS.SO_SU_CO,
    value: inWindow.length,
    unit: "count",
    sample_size: inWindow.length,
    window_start: win.start,
    window_end: win.end,
    insufficient: false,
    reason: null,
    sources,
  };

  // 2) Tổng downtime (phút) — chỉ tính sự cố có đủ mốc thời gian.
  let downtimeSum = 0;
  let downtimeSample = 0;
  for (const inc of inWindow) {
    const dt = incidentDowntimeMinutes(inc);
    if (dt == null) continue;
    downtimeSum += dt;
    downtimeSample += 1;
  }
  const downtime: MetricSnapshot = {
    metric_key: PL04_METRIC_KEYS.DOWNTIME_PHUT,
    value: downtimeSum,
    unit: "min",
    sample_size: downtimeSample,
    window_start: win.start,
    window_end: win.end,
    insufficient: false,
    reason: null,
    sources,
  };

  // 3) Availability 6 tháng — reliability.availability() với windowHours thực tế.
  const windowHours = rangeHours(win.start, win.end);
  const av = availability({
    assetCount: input.assetCount,
    windowHours,
    incidents: inWindow,
  });
  const avail: MetricSnapshot = {
    metric_key: PL04_METRIC_KEYS.AVAILABILITY_6THANG,
    value: av.value,
    unit: "percent",
    sample_size: av.sampleSize,
    window_start: win.start,
    window_end: win.end,
    insufficient: av.insufficient,
    reason: av.reason,
    sources: av.sources,
  };

  return { window: win, metrics: [soSuCo, downtime, avail] };
}
