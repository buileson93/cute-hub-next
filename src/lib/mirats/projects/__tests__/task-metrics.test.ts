import { describe, it, expect } from "vitest";
import {
  checklistProgress,
  compareByDeadline,
  computeTaskMetrics,
  isOverdue,
} from "../task-metrics";

const today = new Date("2026-08-31T00:00:00");

describe("computeTaskMetrics", () => {
  it("trả 0% khi không có công việc", () => {
    const m = computeTaskMetrics([], today);
    expect(m).toMatchObject({ total: 0, completed: 0, overdue: 0, progress: 0 });
  });

  it("đếm theo trạng thái, hoàn thành và quá hạn", () => {
    const m = computeTaskMetrics(
      [
        { trang_thai: "hoan_thanh", ngay_ket_thuc_du_kien: "2026-01-01" },
        { trang_thai: "dang_lam", ngay_ket_thuc_du_kien: "2026-01-01" },
        { trang_thai: "dang_lam", ngay_ket_thuc_du_kien: null },
        { trang_thai: "chua_bat_dau", ngay_ket_thuc_du_kien: "2027-01-01" },
      ],
      today,
    );
    expect(m.total).toBe(4);
    expect(m.completed).toBe(1);
    expect(m.overdue).toBe(1);
    expect(m.byStatus.dang_lam).toBe(2);
    expect(m.progress).toBe(25);
  });

  it("công việc đã hoàn thành không tính quá hạn", () => {
    expect(isOverdue({ trang_thai: "hoan_thanh", ngay_ket_thuc_du_kien: "2020-01-01" }, today)).toBe(
      false,
    );
  });
});

describe("checklistProgress", () => {
  it("checklist rỗng là 0%", () => expect(checklistProgress([])).toBe(0));
  it("tính theo tỉ lệ hoàn thành", () =>
    expect(checklistProgress([{ hoan_thanh: true }, { hoan_thanh: false }])).toBe(50));
});

describe("compareByDeadline", () => {
  it("đưa công việc không hạn xuống cuối ở cả hai chiều", () => {
    const none = { ngay_ket_thuc_du_kien: null };
    const some = { ngay_ket_thuc_du_kien: "2026-01-01" };
    expect(compareByDeadline(none, some, "asc")).toBeGreaterThan(0);
    expect(compareByDeadline(none, some, "desc")).toBeGreaterThan(0);
  });
});
