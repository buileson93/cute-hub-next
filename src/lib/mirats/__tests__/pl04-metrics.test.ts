// Test THUẦN cho PL04: tự lấy số sự cố, downtime, availability 6 tháng từ nguồn
// chuẩn (reliability.ts) và đóng băng thành metric snapshot + record nguồn.
import { describe, it, expect } from "vitest";
import {
  buildPl04Metrics,
  sixMonthWindow,
  filterIncidentsInWindow,
  PL04_METRIC_KEYS,
} from "../pl04-metrics";
import type { ReliabilityIncident } from "../reliability";

const inc = (p: Partial<ReliabilityIncident> & { id: string }): ReliabilityIncident => ({
  id: p.id,
  ma_su_co: p.ma_su_co ?? p.id,
  ngay_phat_hien: p.ngay_phat_hien ?? null,
  thoi_diem_khac_phuc: p.thoi_diem_khac_phuc ?? null,
  thoi_gian_gian_doan: p.thoi_gian_gian_doan ?? null,
});

const WIN_START = "2026-01-01T00:00:00Z";
const WIN_END = "2026-06-30T00:00:00Z"; // 180 ngày

describe("sixMonthWindow", () => {
  it("mặc định 180 ngày kết thúc tại end", () => {
    const w = sixMonthWindow("2026-06-30T00:00:00Z");
    const days = (Date.parse(w.end) - Date.parse(w.start)) / 86_400_000;
    expect(Math.round(days)).toBe(180);
  });
});

describe("filterIncidentsInWindow", () => {
  it("chỉ giữ sự cố trong cửa sổ", () => {
    const list = [
      inc({ id: "a", ngay_phat_hien: "2025-12-31" }), // ngoài
      inc({ id: "b", ngay_phat_hien: "2026-02-01" }), // trong
      inc({ id: "c", ngay_phat_hien: "2026-07-15" }), // ngoài
    ];
    const out = filterIncidentsInWindow(list, WIN_START, WIN_END);
    expect(out.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("buildPl04Metrics — nguồn chuẩn", () => {
  it("đếm đúng số sự cố + tổng downtime trong cửa sổ", () => {
    const list = [
      inc({ id: "1", ngay_phat_hien: "2026-02-01", thoi_diem_khac_phuc: "2026-02-01T02:00:00Z" }), // 120'
      inc({ id: "2", ngay_phat_hien: "2026-03-01", thoi_gian_gian_doan: 60 }),
      inc({ id: "3", ngay_phat_hien: "2025-11-01", thoi_gian_gian_doan: 999 }), // ngoài cửa sổ
    ];
    const { metrics } = buildPl04Metrics({
      incidents: list,
      assetCount: 2,
      windowStart: WIN_START,
      windowEnd: WIN_END,
    });
    const byKey = Object.fromEntries(metrics.map((m) => [m.metric_key, m]));
    expect(byKey[PL04_METRIC_KEYS.SO_SU_CO].value).toBe(2);
    expect(byKey[PL04_METRIC_KEYS.DOWNTIME_PHUT].value).toBe(180); // 120 + 60
    // sources đóng băng cùng con số
    expect(byKey[PL04_METRIC_KEYS.SO_SU_CO].sources.map((s) => s.ma).sort()).toEqual(["1", "2"]);
  });

  it("availability 6 tháng < 100% khi có downtime", () => {
    const list = [
      inc({ id: "1", ngay_phat_hien: "2026-02-01", thoi_diem_khac_phuc: "2026-02-01T10:00:00Z" }), // 600'
    ];
    const { metrics } = buildPl04Metrics({
      incidents: list,
      assetCount: 1,
      windowStart: WIN_START,
      windowEnd: WIN_END,
    });
    const av = metrics.find((m) => m.metric_key === PL04_METRIC_KEYS.AVAILABILITY_6THANG)!;
    expect(av.insufficient).toBe(false);
    expect(av.value).not.toBeNull();
    expect(av.value!).toBeLessThan(100);
    expect(av.value!).toBeGreaterThan(99); // 10h trong 180*24h là rất nhỏ
  });

  it("thiếu tài sản → availability chưa đủ dữ liệu (null), không ép 100%", () => {
    const { metrics } = buildPl04Metrics({
      incidents: [],
      assetCount: 0,
      windowStart: WIN_START,
      windowEnd: WIN_END,
    });
    const av = metrics.find((m) => m.metric_key === PL04_METRIC_KEYS.AVAILABILITY_6THANG)!;
    expect(av.value).toBeNull();
    expect(av.insufficient).toBe(true);
    // số sự cố vẫn là 0 (count hợp lệ)
    const so = metrics.find((m) => m.metric_key === PL04_METRIC_KEYS.SO_SU_CO)!;
    expect(so.value).toBe(0);
  });

  it("mỗi metric mang cửa sổ thời gian đã ghim", () => {
    const { metrics, window } = buildPl04Metrics({
      incidents: [],
      assetCount: 1,
      windowStart: WIN_START,
      windowEnd: WIN_END,
    });
    for (const m of metrics) {
      expect(m.window_start).toBe(window.start);
      expect(m.window_end).toBe(window.end);
    }
  });
});
