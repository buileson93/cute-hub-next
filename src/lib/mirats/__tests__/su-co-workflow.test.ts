import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStates,
  computeMetrics,
  normalizeWorkflowState,
  TRANSITIONS,
  type LichSuBuoc,
} from "@/lib/mirats/su-co-workflow";

describe("N6 canTransition — cho phép hợp lệ", () => {
  it("mọi cạnh trong ma trận trả true", () => {
    for (const [from, tos] of Object.entries(TRANSITIONS)) {
      for (const to of tos) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });
});

describe("N6 canTransition — chặn nhảy cóc", () => {
  const invalid: Array<[string, string]> = [
    ["bao_cao", "dang_xu_ly"],
    ["bao_cao", "hoan_thanh"],
    ["bao_cao", "nghiem_thu"],
    ["tiep_nhan", "hoan_thanh"],
    ["tiep_nhan", "nghiem_thu"],
    ["cho_vat_tu", "nghiem_thu"],
    ["hoan_thanh", "huy"],
    ["nghiem_thu", "hoan_thanh"],
    ["huy", "bao_cao"],
    ["huy", "tiep_nhan"],
    ["bao_cao", "bao_cao"],
    ["dang_xu_ly", "dang_xu_ly"],
  ];
  it.each(invalid)("chặn %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});

describe("N6 canTransition — input lạ", () => {
  it("state không tồn tại → false, không throw", () => {
    expect(canTransition("khong_co", "tiep_nhan")).toBe(false);
    expect(canTransition("bao_cao", "khong_co")).toBe(false);
    expect(canTransition(null, "bao_cao")).toBe(false);
    expect(canTransition("bao_cao", undefined)).toBe(false);
  });
});

describe("N6 nextStates", () => {
  it("trả về hàng của ma trận", () => {
    expect(nextStates("bao_cao")).toEqual(["tiep_nhan", "huy"]);
    expect(nextStates("huy")).toEqual([]);
    expect(nextStates("khong_co")).toEqual([]);
  });
});

describe("N6 normalizeWorkflowState — backfill legacy", () => {
  it("map giá trị cũ về enum mới", () => {
    expect(normalizeWorkflowState("Mới")).toBe("bao_cao");
    expect(normalizeWorkflowState("Đang xử lý")).toBe("dang_xu_ly");
    expect(normalizeWorkflowState("Đã khắc phục")).toBe("hoan_thanh");
    expect(normalizeWorkflowState("Đóng")).toBe("nghiem_thu");
    expect(normalizeWorkflowState("dong")).toBe("nghiem_thu");
    expect(normalizeWorkflowState("hoan_thanh")).toBe("hoan_thanh");
    expect(normalizeWorkflowState("")).toBe("bao_cao");
    expect(normalizeWorkflowState(null)).toBe("bao_cao");
    expect(normalizeWorkflowState("gì-đó-lạ")).toBe("bao_cao");
  });
});

// ---------- computeMetrics ----------
function step(tu: string | null, den: string, atMinFromZero: number): LichSuBuoc {
  const base = Date.parse("2026-01-01T00:00:00Z");
  return {
    tu: tu as LichSuBuoc["tu"],
    den: den as LichSuBuoc["den"],
    at: new Date(base + atMinFromZero * 60_000).toISOString(),
  };
}

describe("N6 computeMetrics", () => {
  it("chuỗi thẳng: response=10, repair=70, downtime=60, wait=0", () => {
    const hs = [
      step(null, "bao_cao", 0),
      step("bao_cao", "tiep_nhan", 10),
      step("tiep_nhan", "dang_xu_ly", 20),
      step("dang_xu_ly", "hoan_thanh", 80),
    ];
    const m = computeMetrics(hs);
    expect(m.response_time_phut).toBe(10);
    expect(m.repair_time_phut).toBe(70);
    expect(m.downtime_phut).toBe(60);
    expect(m.wait_parts_phut).toBe(0);
    expect(m.wrench_time_phut).toBe(60);
  });

  it("có cho_vat_tu: downtime=60, wait=20, wrench=40", () => {
    const hs = [
      step(null, "bao_cao", 0),
      step("bao_cao", "tiep_nhan", 10),
      step("tiep_nhan", "dang_xu_ly", 20),
      step("dang_xu_ly", "cho_vat_tu", 30),
      step("cho_vat_tu", "dang_xu_ly", 50),
      step("dang_xu_ly", "hoan_thanh", 80),
    ];
    const m = computeMetrics(hs);
    expect(m.downtime_phut).toBe(60);
    expect(m.wait_parts_phut).toBe(20);
    expect(m.wrench_time_phut).toBe(40);
  });

  it("mở lại sau nghiệm thu: downtime = 60 + 30 = 90", () => {
    const hs = [
      step(null, "bao_cao", 0),
      step("bao_cao", "tiep_nhan", 10),
      step("tiep_nhan", "dang_xu_ly", 20),
      step("dang_xu_ly", "hoan_thanh", 80),
      step("hoan_thanh", "nghiem_thu", 90),
      step("nghiem_thu", "dang_xu_ly", 120),
      step("dang_xu_ly", "hoan_thanh", 150),
    ];
    const m = computeMetrics(hs);
    expect(m.downtime_phut).toBe(90);
  });

  it("chưa hoàn thành: các chỉ số phụ thuộc hoan_thanh = null", () => {
    const hs = [
      step(null, "bao_cao", 0),
      step("bao_cao", "tiep_nhan", 10),
      step("tiep_nhan", "dang_xu_ly", 20),
    ];
    const m = computeMetrics(hs);
    expect(m.response_time_phut).toBe(10);
    expect(m.repair_time_phut).toBeNull();
    expect(m.downtime_phut).toBeNull();
    expect(m.wrench_time_phut).toBeNull();
  });

  it("empty history → all null / 0, không throw", () => {
    const m = computeMetrics([]);
    expect(m.response_time_phut).toBeNull();
    expect(m.repair_time_phut).toBeNull();
    expect(m.downtime_phut).toBeNull();
    expect(m.wait_parts_phut).toBe(0);
    expect(m.wrench_time_phut).toBeNull();
  });
});
