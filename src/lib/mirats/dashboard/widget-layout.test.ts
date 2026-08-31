import { describe, expect, it } from "vitest";
import { moveWidget, sanitizeLayout } from "./widget-layout";
import { DEFAULT_HOME_LAYOUT } from "./widget-registry";

describe("widget-layout", () => {
  it("reorders widgets without mutating the source", () => {
    const src = DEFAULT_HOME_LAYOUT;
    const next = moveWidget(src, src[2].id, src[0].id);
    expect(next[0].id).toBe(src[2].id);
    expect(next).toHaveLength(src.length);
    expect(src[0].id).toBe(DEFAULT_HOME_LAYOUT[0].id);
  });

  it("ignores unknown ids", () => {
    expect(moveWidget(DEFAULT_HOME_LAYOUT, "nope", DEFAULT_HOME_LAYOUT[0].id)).toBe(
      DEFAULT_HOME_LAYOUT,
    );
  });

  it("falls back to default when stored layout is corrupt", () => {
    expect(sanitizeLayout(null, DEFAULT_HOME_LAYOUT)).toBe(DEFAULT_HOME_LAYOUT);
    expect(sanitizeLayout([{ id: "x", type: "khong-ton-tai" }], DEFAULT_HOME_LAYOUT)).toBe(
      DEFAULT_HOME_LAYOUT,
    );
  });

  it("drops duplicates and repairs widths", () => {
    const out = sanitizeLayout(
      [
        { id: "a", type: "mttr-kpi", w: 99 },
        { id: "a", type: "mttr-kpi", w: 6 },
      ],
      DEFAULT_HOME_LAYOUT,
    );
    expect(out).toHaveLength(1);
    expect(out[0].w).toBe(6);
  });
});

describe("filterLayoutByGroup", () => {
  it("chỉ giữ widget thuộc đúng nhóm chủ đề", () => {
    const layout = sanitizeLayout(
      [
        { id: "a", type: "mttr-kpi", w: 6 },
        { id: "b", type: "task-status-distribution", w: 6 },
        { id: "c", type: "su-co-trend", w: 12 },
      ],
      DEFAULT_HOME_LAYOUT,
    );
    expect(filterLayoutByGroup(layout, "cong-viec").map((w) => w.id)).toEqual(["b"]);
    expect(filterLayoutByGroup(layout, "van-hanh").map((w) => w.id)).toEqual(["c"]);
    expect(filterLayoutByGroup(layout, "tong-quan").map((w) => w.id)).toEqual(["a"]);
  });
});
