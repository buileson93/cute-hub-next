import { describe, expect, it } from "vitest";
import { estimateLabelWidth, shortDate } from "@/components/mirats/projects/gantt/ProjectGantt";
import { countPending } from "@/components/mirats/projects/ProjectReports";

describe("nhãn Gantt trên màn hình hẹp", () => {
  it("rút gọn ngày về dd/MM", () => {
    expect(shortDate("2026-08-31")).toBe("31/08");
  });

  it("thanh hẹp không đủ chỗ cho tên dài", () => {
    expect(estimateLabelWidth("Đo kiểm trạm radar sơ cấp")).toBeGreaterThan(100);
    expect(estimateLabelWidth("A")).toBeLessThan(30);
  });

  it("chặn trên độ rộng ước lượng để thanh dài vẫn hiện tên", () => {
    const a = estimateLabelWidth("x".repeat(50));
    const b = estimateLabelWidth("x".repeat(200));
    expect(a).toBe(b);
  });

  it("tên rỗng vẫn trả về độ rộng dương", () => {
    expect(estimateLabelWidth("   ")).toBeGreaterThan(0);
  });
});

describe("đếm báo cáo chờ duyệt", () => {
  it("chỉ đếm trạng thái cho_duyet", () => {
    expect(
      countPending([
        { trang_thai: "cho_duyet" },
        { trang_thai: "da_duyet" },
        { trang_thai: "cho_duyet" },
        { trang_thai: "yeu_cau_sua" },
      ]),
    ).toBe(2);
  });
});
