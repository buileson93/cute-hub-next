import { describe, expect, it } from "vitest";
import { phaseColor } from "@/components/mirats/StatusBadge";
import { expiringColor } from "@/components/mirats/ExpiringBadge";

describe("StatusBadge — phase → màu", () => {
  it("map đủ 4 phase, giá trị khác nhau", () => {
    const open = phaseColor("open");
    const ip = phaseColor("in_progress");
    const closed = phaseColor("closed");
    const cancelled = phaseColor("cancelled");
    const unknown = phaseColor(null);
    const set = new Set([open, ip, closed, cancelled]);
    expect(set.size).toBe(4);
    expect(open).toContain("text-info");
    expect(ip).toContain("text-warning");
    expect(closed).toContain("text-success");
    expect(cancelled).toContain("text-muted-foreground");
    expect(unknown).toContain("muted");
  });
});

describe("ExpiringBadge — số ngày → màu", () => {
  it("30 đỏ · 60 cam · 90 vàng · khác xám · quá hạn đỏ đậm", () => {
    expect(expiringColor(10)).toContain("error");
    expect(expiringColor(30)).toContain("error");
    expect(expiringColor(45)).toContain("warning");
    expect(expiringColor(60)).toContain("warning");
    expect(expiringColor(75)).toContain("warning");
    expect(expiringColor(90)).toContain("warning");
    expect(expiringColor(120)).toContain("muted");
    expect(expiringColor(null)).toContain("muted");
    expect(expiringColor(-3)).toContain("destructive");
  });
});
