import { describe, it, expect } from "vitest";

/** Điều kiện bật query công việc: có projectId và sentinel đã vào viewport. */
function taskQueryEnabled(projectId: string | undefined, sectionVisible: boolean) {
  return !!projectId && sectionVisible;
}

describe("lazy task query gating", () => {
  it("không bật khi chưa cuộn tới khu vực công việc", () => {
    expect(taskQueryEnabled("p1", false)).toBe(false);
  });
  it("không bật khi thiếu projectId", () => {
    expect(taskQueryEnabled(undefined, true)).toBe(false);
  });
  it("bật khi đủ điều kiện", () => {
    expect(taskQueryEnabled("p1", true)).toBe(true);
  });
});
