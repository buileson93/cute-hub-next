import { describe, expect, it } from "vitest";
import {
  computeReliability,
  formatAvailability,
  formatHours,
  type FailureEvent,
} from "../reliability";

const DAY = 86_400 * 1000;
const anchor = new Date("2026-01-01T00:00:00Z").getTime();
const at = (dayOffset: number, hourOffset = 0) =>
  new Date(anchor + dayOffset * DAY + hourOffset * 3_600_000);

describe("computeReliability — công thức §4 spec N9", () => {
  it("không có sự cố → availability=1, MTTR=null, MTBF=null", () => {
    const window = { from: at(0), to: at(30) };
    const r = computeReliability([], window, 30 * 86_400);
    expect(r.availability).toBe(1);
    expect(r.mttr_h).toBeNull();
    expect(r.mtbf_h).toBeNull(); // không có failure ⇒ không tính MTBF (§4: khi failures=0 hiển thị "≥ uptime")
    expect(r.downtime_s).toBe(0);
  });

  it("ví dụ §4 (30 ngày, 3 sự cố) khớp oracle 82.50% / MTBF 198h / MTTR 3h", () => {
    const window = { from: at(0), to: at(30) };
    const events: FailureEvent[] = [
      // S1: day2, 4h, đã đóng
      { id: "S1", downtime_start: at(2), downtime_end: at(2, 4) },
      // S2: day10, 2h, đã đóng
      { id: "S2", downtime_start: at(10), downtime_end: at(10, 2) },
      // S3: day25, còn mở tới day30 = 5 ngày
      { id: "S3", downtime_start: at(25), downtime_end: null },
    ];
    const r = computeReliability(events, window, 30 * 86_400);
    expect(r.downtime_s).toBe(453_600);
    expect(r.failures).toBe(3);
    expect(r.failures_closed).toBe(2);
    expect(r.availability).toBeCloseTo(0.825, 3);
    expect(r.mtbf_h).toBeCloseTo(198.0, 1);
    expect(r.mttr_h).toBeCloseTo(3.0, 1);
  });

  it("sự cố vắt biên `from` → chỉ tính phần trong cửa sổ", () => {
    const window = { from: at(5), to: at(10) };
    const events: FailureEvent[] = [
      // start day 4 (trước from), end day 5 + 2h → downtime clip = 2h trong cửa sổ
      { id: "X", downtime_start: at(4), downtime_end: at(5, 2) },
    ];
    const r = computeReliability(events, window, 5 * 86_400);
    expect(r.downtime_s).toBe(2 * 3600);
    // failures theo start-in-window → start ở day 4 nằm NGOÀI ⇒ 0
    expect(r.failures).toBe(0);
    // đóng trong cửa sổ ⇒ failures_closed = 1, MTTR = full length (26h)
    expect(r.failures_closed).toBe(1);
    expect(r.mttr_h).toBeCloseTo(26.0, 1);
  });

  it("sự cố còn mở tại `to` → cộng downtime, không đóng góp MTTR", () => {
    const window = { from: at(0), to: at(10) };
    const events: FailureEvent[] = [{ id: "OPEN", downtime_start: at(9), downtime_end: null }];
    const r = computeReliability(events, window, 10 * 86_400);
    expect(r.downtime_s).toBe(86_400); // 1 ngày trong cửa sổ
    expect(r.failures).toBe(1);
    expect(r.failures_closed).toBe(0);
    expect(r.mttr_h).toBeNull();
    expect(r.mtbf_h).not.toBeNull();
  });

  it("sự cố `huy` (không có downtime_start) → không tính", () => {
    // Modelling: caller không đưa event nào cho sự cố `huy` — hàm pure không thấy.
    const window = { from: at(0), to: at(10) };
    const r = computeReliability([], window, 10 * 86_400);
    expect(r.failures).toBe(0);
    expect(r.availability).toBe(1);
  });

  it("reopen → 2 đoạn downtime tách biệt, failures=2", () => {
    const window = { from: at(0), to: at(30) };
    const events: FailureEvent[] = [
      { id: "R#1", downtime_start: at(5), downtime_end: at(5, 3) },
      { id: "R#2", downtime_start: at(20), downtime_end: at(20, 1) }, // đoạn thứ 2 sau reopen
    ];
    const r = computeReliability(events, window, 30 * 86_400);
    expect(r.failures).toBe(2);
    expect(r.failures_closed).toBe(2);
    expect(r.downtime_s).toBe(4 * 3600);
    expect(r.mttr_h).toBeCloseTo(2.0, 1);
  });

  it("operational=0 → availability null", () => {
    const window = { from: at(0), to: at(0) };
    const r = computeReliability([], window, 0);
    expect(r.availability).toBeNull();
  });
});

describe("format helpers", () => {
  it("formatHours & formatAvailability", () => {
    expect(formatHours(3600)).toBe("1.0 h");
    expect(formatHours(null)).toBe("—");
    expect(formatAvailability(0.825)).toBe("82.50%");
    expect(formatAvailability(null)).toBe("—");
  });
});
