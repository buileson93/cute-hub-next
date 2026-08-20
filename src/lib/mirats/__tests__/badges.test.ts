import { describe, expect, it } from "vitest";
import { phaseColor } from "@/components/mirats/StatusBadge";
import { getStatusToken } from "@/lib/mirats/ui/status-tokens";

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

describe("StatusBadge Expiry Domain — token → màu", () => {
  it("overdue/urgent đỏ · warning cam · normal xám", () => {
    expect(getStatusToken("expiry", "overdue").color).toContain("danger");
    expect(getStatusToken("expiry", "urgent").color).toContain("danger");
    expect(getStatusToken("expiry", "warning").color).toContain("warning");
    expect(getStatusToken("expiry", "normal").color).toContain("normal");
  });
});
