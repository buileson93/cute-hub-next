import { describe, it, expect } from "vitest";
import { matchIntent, describeIntent } from "@/lib/mirats/command-intent";

describe("command-intent — GĐ2-03", () => {
  it("mount-asset: gán TB123 vào TPHT_045", () => {
    const r = matchIntent("gán TB123 vào TPHT_045");
    expect(r.kind).toBe("mount-asset");
    if (r.kind === "mount-asset") {
      expect(r.asset).toBe("TB123");
      expect(r.component).toBe("TPHT_045");
      expect(r.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("mount-asset: biến thể không dấu 'lap' 'vao'", () => {
    const r = matchIntent("lap TB123 vao TPHT_045");
    expect(r.kind).toBe("mount-asset");
  });

  it("unmount-asset: tháo TB123 khỏi TPHT_045", () => {
    const r = matchIntent("tháo TB123 khỏi TPHT_045");
    expect(r.kind).toBe("unmount-asset");
    if (r.kind === "unmount-asset") {
      expect(r.asset).toBe("TB123");
      expect(r.component).toBe("TPHT_045");
    }
  });

  it("close-incident: đóng sự cố SC-12", () => {
    const r = matchIntent("đóng sự cố SC-12");
    expect(r.kind).toBe("close-incident");
    if (r.kind === "close-incident") expect(r.id).toBe("SC-12");
  });

  it("create-pm: tạo pm cho HT-ADSB", () => {
    const r = matchIntent("tạo pm cho HT-ADSB");
    expect(r.kind).toBe("create-pm");
    if (r.kind === "create-pm") expect(r.target).toBe("HT-ADSB");
  });

  it("jump-to: câu nhòe → confidence thấp", () => {
    const r = matchIntent("blah blah nothing here");
    expect(r.kind).toBe("jump-to");
    expect(r.confidence).toBeLessThan(0.7);
  });

  it("describeIntent trả tiếng Việt cho tất cả kind", () => {
    expect(
      describeIntent({ kind: "mount-asset", asset: "TB1", component: "TPHT_1", confidence: 1 }),
    ).toMatch(/Gán/);
    expect(describeIntent({ kind: "unmount-asset", asset: "TB1", confidence: 1 })).toMatch(/Tháo/);
    expect(describeIntent({ kind: "close-incident", id: "SC-1", confidence: 1 })).toMatch(/Đóng/);
    expect(describeIntent({ kind: "create-pm", target: "X", confidence: 1 })).toMatch(/bảo trì/);
    expect(describeIntent({ kind: "jump-to", query: "abc", confidence: 0.3 })).toMatch(/Tìm/);
  });
});
