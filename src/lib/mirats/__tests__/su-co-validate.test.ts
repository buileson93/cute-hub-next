import { describe, it, expect } from "vitest";
import {
  computeDowntimeMinutes,
  validateSuCoTimes,
  validateSuCoFk,
  validateSuCo,
} from "../su-co-validate";

// ============================================================================
// Kiểm chứng bất biến của SỰ CỐ:
//  - FK tài sản/hệ thống: có text nhưng thiếu id → phải báo (không đoán).
//  - Khôi phục TRƯỚC phát hiện → phải báo lỗi.
//  - Downtime: âm phải báo; nguồn tính DUY NHẤT qua computeDowntimeMinutes.
// ============================================================================

describe("computeDowntimeMinutes (nguồn thời gian duy nhất)", () => {
  it("tính đúng số phút từ đầu ngày phát hiện đến khắc phục", () => {
    // 2 giờ sau nửa đêm ngày phát hiện = 120 phút
    expect(computeDowntimeMinutes("2026-07-13", "2026-07-13T02:00:00Z")).toBe(120);
  });

  it("thiếu một mốc → null (chưa xác định)", () => {
    expect(computeDowntimeMinutes("2026-07-13", null)).toBeNull();
    expect(computeDowntimeMinutes(null, "2026-07-13T02:00:00Z")).toBeNull();
    expect(computeDowntimeMinutes("", "")).toBeNull();
  });

  it("khôi phục trước phát hiện → không trả số âm (kẹp về 0)", () => {
    expect(computeDowntimeMinutes("2026-07-13", "2026-07-12T10:00:00Z")).toBe(0);
  });

  it("khắc phục nhiều ngày sau → cộng dồn theo phút", () => {
    expect(computeDowntimeMinutes("2026-07-13", "2026-07-14T00:00:00Z")).toBe(1440);
  });
});

describe("validateSuCoTimes", () => {
  it("khôi phục trước ngày phát hiện → lỗi restored_before_detected", () => {
    const issues = validateSuCoTimes({
      ngay_phat_hien: "2026-07-13",
      thoi_diem_khac_phuc: "2026-07-12T23:59:00Z",
    });
    expect(issues.map((i) => i.code)).toContain("restored_before_detected");
  });

  it("khắc phục cùng/ sau ngày phát hiện → hợp lệ", () => {
    expect(
      validateSuCoTimes({
        ngay_phat_hien: "2026-07-13",
        thoi_diem_khac_phuc: "2026-07-13T05:00:00Z",
      }),
    ).toHaveLength(0);
  });

  it("downtime âm → lỗi negative_downtime", () => {
    const issues = validateSuCoTimes({ thoi_gian_gian_doan: -5 });
    expect(issues.map((i) => i.code)).toContain("negative_downtime");
  });

  it("chưa nhập mốc/ downtime → không lỗi", () => {
    expect(validateSuCoTimes({})).toHaveLength(0);
  });
});

describe("validateSuCoFk (không đoán)", () => {
  it("có text tài sản nhưng thiếu id → missing_thiet_bi_fk", () => {
    const issues = validateSuCoFk({ thiet_bi: "TB-001", thiet_bi_id: null });
    expect(issues.map((i) => i.code)).toContain("missing_thiet_bi_fk");
  });

  it("có text hệ thống nhưng thiếu id → missing_he_thong_fk", () => {
    const issues = validateSuCoFk({ he_thong: "Radar sơ cấp", he_thong_id: "" });
    expect(issues.map((i) => i.code)).toContain("missing_he_thong_fk");
  });

  it("đã có đủ id → hợp lệ", () => {
    expect(
      validateSuCoFk({
        thiet_bi: "TB-001",
        thiet_bi_id: "11111111-1111-1111-1111-111111111111",
        he_thong: "Radar",
        he_thong_id: "22222222-2222-2222-2222-222222222222",
      }),
    ).toHaveLength(0);
  });

  it("không có text → không đòi id (bản ghi trống)", () => {
    expect(validateSuCoFk({ thiet_bi: "", he_thong: null })).toHaveLength(0);
  });
});

describe("validateSuCo (gộp)", () => {
  it("gộp cả lỗi FK và thời gian", () => {
    const codes = validateSuCo({
      thiet_bi: "TB-X",
      thiet_bi_id: null,
      ngay_phat_hien: "2026-07-13",
      thoi_diem_khac_phuc: "2026-07-10T00:00:00Z",
    }).map((i) => i.code);
    expect(codes).toContain("missing_thiet_bi_fk");
    expect(codes).toContain("restored_before_detected");
  });
});
