import { describe, it, expect } from "vitest";
import {
  buildGanttRows,
  computeGanttRange,
  computeBarSpan,
  initialsOf,
  avatarToneIndex,
  diffDays,
  toDateKey,
} from "./gantt-layout";

const moc = {
  id: "m1",
  ten: "Mốc 1",
  ngay_bat_dau: "2026-03-01",
  ngay_ket_thuc_du_kien: "2026-03-10",
  tien_do: 40,
};

describe("gantt-layout", () => {
  it("chuẩn hoá ngày và bỏ giá trị sai", () => {
    expect(toDateKey("2026-03-01T08:00:00Z")).toBe("2026-03-01");
    expect(toDateKey(null)).toBeNull();
    expect(toDateKey("hôm nay")).toBeNull();
  });

  it("gom mốc và công việc theo thứ tự, kế thừa ngày khi thiếu", () => {
    const rows = buildGanttRows({
      mocs: [moc],
      tasks: [
        {
          id: "t1",
          moc_id: "m1",
          ten: "Việc A",
          ngay_bat_dau: null,
          ngay_ket_thuc_du_kien: null,
          tien_do: 150,
          trang_thai: "dang_lam",
          nguoi_xu_ly_chinh: "u1",
        },
      ],
      fallbackStart: "2026-02-20",
    });
    expect(rows.map((r) => r.key)).toEqual(["m_m1", "t_t1"]);
    expect(rows[1].start).toBe("2026-03-01");
    expect(rows[1].inferredDates).toBe(true);
    expect(rows[1].progress).toBe(100);
  });

  it("đảo ngày sai được kẹp về ngày bắt đầu", () => {
    const rows = buildGanttRows({
      mocs: [{ ...moc, ngay_bat_dau: "2026-03-10", ngay_ket_thuc_du_kien: "2026-03-01" }],
      tasks: [],
      fallbackStart: "2026-03-01",
    });
    expect(rows[0].end).toBe("2026-03-10");
  });

  it("tính khoảng hiển thị có đệm và vị trí thanh", () => {
    const rows = buildGanttRows({ mocs: [moc], tasks: [], fallbackStart: "2026-03-01" });
    const range = computeGanttRange(rows, 2);
    expect(range).not.toBeNull();
    if (!range) return;
    expect(range.start).toBe("2026-02-27");
    expect(range.totalDays).toBe(diffDays(range.start, range.end) + 1);
    const span = computeBarSpan(rows[0], range);
    expect(span.offsetDays).toBe(2);
    expect(span.spanDays).toBe(10);
  });

  it("trả null khi không có dòng nào", () => {
    expect(computeGanttRange([])).toBeNull();
  });

  it("sinh initials và màu ổn định", () => {
    expect(initialsOf("Nguyễn Văn A")).toBe("VA");
    expect(initialsOf("Lan")).toBe("LA");
    expect(initialsOf("   ")).toBe("?");
    expect(avatarToneIndex("u1", 6)).toBe(avatarToneIndex("u1", 6));
    expect(avatarToneIndex("u1", 6)).toBeLessThan(6);
  });
});
