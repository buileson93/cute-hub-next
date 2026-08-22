// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { getMotionDurationSeconds, getMotionEase } from "@/lib/mirats/motion";

describe("motion tokens", () => {
  it("exposes --duration-base on :root", () => {
    // JSDOM does not parse @import CSS, so we inject the token to prove the
    // helper reads from computed style rather than the fallback.
    document.documentElement.style.setProperty("--duration-base", "240ms");
    const v = getComputedStyle(document.documentElement).getPropertyValue("--duration-base");
    expect(v.trim()).not.toBe("");
    expect(getMotionDurationSeconds("base")).toBeCloseTo(0.24, 3);
  });

  it("falls back when the CSS var is missing", () => {
    document.documentElement.style.removeProperty("--duration-fast");
    expect(getMotionDurationSeconds("fast")).toBeCloseTo(0.12, 3);
  });

  it("returns cubic-bezier tuples for ease tokens", () => {
    expect(getMotionEase("standard")).toEqual([0.2, 0, 0, 1]);
    expect(getMotionEase("emphasized")).toEqual([0.3, 0, 0, 1]);
  });
});
