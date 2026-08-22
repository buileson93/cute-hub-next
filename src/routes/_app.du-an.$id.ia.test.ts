import { describe, it, expect } from "vitest";

// Mocking validateSearch logic to test normalization
const SUPPORTED_VIEWS = ["kanban", "gantt", "list", "timeline", "hoso", "cong-van"] as const;
type ProjectView = (typeof SUPPORTED_VIEWS)[number];

function validateView(view: any): ProjectView {
  if (SUPPORTED_VIEWS.includes(view)) return view;
  return "kanban";
}

describe("Project Navigation Information Architecture (10V)", () => {
  it("should support exactly 6 canonical views", () => {
    expect(SUPPORTED_VIEWS).toHaveLength(6);
    expect(SUPPORTED_VIEWS).toContain("kanban");
    expect(SUPPORTED_VIEWS).toContain("gantt");
    expect(SUPPORTED_VIEWS).toContain("list");
    expect(SUPPORTED_VIEWS).toContain("timeline");
    expect(SUPPORTED_VIEWS).toContain("hoso");
    expect(SUPPORTED_VIEWS).toContain("cong-van");
  });

  it("should normalize legacy/experimental views to kanban", () => {
    expect(validateView("discovery")).toBe("kanban");
    expect(validateView("delivery")).toBe("kanban");
    expect(validateView("operations")).toBe("kanban");
    expect(validateView("unknown")).toBe("kanban");
    expect(validateView(undefined)).toBe("kanban");
  });

  it("should preserve valid views", () => {
    expect(validateView("hoso")).toBe("hoso");
    expect(validateView("cong-van")).toBe("cong-van");
    expect(validateView("gantt")).toBe("gantt");
  });
});
