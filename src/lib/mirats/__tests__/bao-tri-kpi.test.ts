import { describe, it, expect } from "vitest";
import { pmOnTimeRate, type PmWorkOrder } from "../bao-tri-kpi";

function wo(over: Partial<PmWorkOrder>): PmWorkOrder {
  return {
    id: null,
    ma_cong_viec: null,
    trang_thai: "HOAN_THANH",
    ngay_den_han: "2026-01-10",
    ngay_hoan_thanh: "2026-01-09",
    ...over,
  };
}

describe("pmOnTimeRate — nguồn KPI PM hoàn thành đúng hạn", () => {
  it("3 phiếu hoàn thành, 2 đúng hạn = 66,7%", () => {
    const rows: PmWorkOrder[] = [
      wo({ id: "a", ngay_den_han: "2026-01-10", ngay_hoan_thanh: "2026-01-09" }), // đúng
      wo({ id: "b", ngay_den_han: "2026-01-10", ngay_hoan_thanh: "2026-01-10" }), // đúng (=hạn)
      wo({ id: "c", ngay_den_han: "2026-01-10", ngay_hoan_thanh: "2026-01-15" }), // trễ
    ];
    const res = pmOnTimeRate(rows);
    expect(res.value).toBe(66.7);
    expect(res.sampleSize).toBe(3);
    expect(res.insufficient).toBe(false);
    expect(res.sources.filter((s) => s.onTime).length).toBe(2);
  });

  it("không có mẫu = null / insufficient", () => {
    const res = pmOnTimeRate([]);
    expect(res.value).toBeNull();
    expect(res.insufficient).toBe(true);
    expect(res.sampleSize).toBe(0);
  });

  it("phiếu chưa hoàn thành không được tính vào mẫu đúng hạn", () => {
    const rows: PmWorkOrder[] = [
      wo({
        id: "a",
        trang_thai: "HOAN_THANH",
        ngay_den_han: "2026-01-10",
        ngay_hoan_thanh: "2026-01-09",
      }),
      wo({ id: "b", trang_thai: "DANG_LAM", ngay_den_han: "2026-01-10", ngay_hoan_thanh: null }),
      wo({ id: "c", trang_thai: "MO", ngay_den_han: "2026-01-10", ngay_hoan_thanh: null }),
    ];
    const res = pmOnTimeRate(rows);
    expect(res.sampleSize).toBe(1);
    expect(res.value).toBe(100);
  });

  it("phiếu hoàn thành nhưng thiếu ngày đến hạn hoặc ngày hoàn thành bị loại khỏi mẫu", () => {
    const rows: PmWorkOrder[] = [
      wo({ id: "a", ngay_den_han: null }),
      wo({ id: "b", ngay_hoan_thanh: null }),
      wo({ id: "c", ngay_den_han: "2026-01-10", ngay_hoan_thanh: "2026-01-09" }),
    ];
    const res = pmOnTimeRate(rows);
    expect(res.sampleSize).toBe(1);
    expect(res.value).toBe(100);
  });
});
