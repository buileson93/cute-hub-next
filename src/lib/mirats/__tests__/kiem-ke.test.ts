import { describe, it, expect } from "vitest";
import {
  DEFAULT_CHU_KY_KIEM_KE_NGAY,
  tinhNgayKiemKeKeTiep,
  validateKiemKeInput,
  type KiemKeInput,
} from "../kiem-ke";

describe("kiem-ke — tinhNgayKiemKeKeTiep (hạn kiểm kê kế tiếp)", () => {
  it("mặc định cộng chu kỳ 365 ngày khi không cấu hình", () => {
    expect(tinhNgayKiemKeKeTiep("2026-01-01T08:00:00.000Z")).toBe("2027-01-01");
  });

  it("cộng theo chu kỳ cấu hình (ví dụ 90 ngày)", () => {
    expect(tinhNgayKiemKeKeTiep("2026-01-01T00:00:00.000Z", 90)).toBe("2026-04-01");
  });

  it("chu kỳ <= 0 hoặc null → dùng mặc định", () => {
    expect(tinhNgayKiemKeKeTiep("2026-01-01T00:00:00.000Z", 0)).toBe(
      tinhNgayKiemKeKeTiep("2026-01-01T00:00:00.000Z", DEFAULT_CHU_KY_KIEM_KE_NGAY),
    );
    expect(tinhNgayKiemKeKeTiep("2026-01-01T00:00:00.000Z", null)).toBe("2027-01-01");
  });

  it("giữ nguyên phần ngày (bỏ giờ) và bắc cầu qua tháng", () => {
    expect(tinhNgayKiemKeKeTiep("2026-01-20T23:30:00.000Z", 30)).toBe("2026-02-19");
  });

  it("nhận Date object", () => {
    expect(tinhNgayKiemKeKeTiep(new Date("2026-06-15T00:00:00.000Z"), 10)).toBe("2026-06-25");
  });

  it("thoi_diem không hợp lệ → ném lỗi", () => {
    expect(() => tinhNgayKiemKeKeTiep("khong-phai-ngay")).toThrow();
  });
});

describe("kiem-ke — validateKiemKeInput", () => {
  const base: KiemKeInput = { thietBiId: "tb-1", tinhTrang: "Bình thường" };

  it("hợp lệ → không có lỗi", () => {
    expect(validateKiemKeInput(base)).toEqual([]);
  });

  it("thiếu tài sản → báo lỗi", () => {
    expect(validateKiemKeInput({ ...base, thietBiId: "" }).length).toBeGreaterThan(0);
  });

  it("thiếu tình trạng → báo lỗi", () => {
    expect(validateKiemKeInput({ ...base, tinhTrang: "   " }).length).toBeGreaterThan(0);
  });
});
