import { describe, it, expect } from "vitest";
import { buildAssetQrPayload, parseQr } from "../qr";

describe("qr.buildAssetQrPayload", () => {
  it("dựng URL và path chuẩn", () => {
    const r = buildAssetQrPayload({ origin: "https://vatm.app", maThietBi: "TB-001" });
    expect(r.url).toBe("https://vatm.app/q/TB-001");
    expect(r.path).toBe("/q/TB-001");
    expect(r.ma).toBe("TB-001");
  });

  it("strip dấu / cuối origin", () => {
    const r = buildAssetQrPayload({ origin: "https://vatm.app/", maThietBi: "TB-001" });
    expect(r.url).toBe("https://vatm.app/q/TB-001");
  });

  it("encode ký tự đặc biệt trong mã", () => {
    const r = buildAssetQrPayload({ origin: "https://vatm.app", maThietBi: "AB/CD 01" });
    expect(r.path).toBe("/q/AB%2FCD%2001");
    expect(r.url).toBe("https://vatm.app/q/AB%2FCD%2001");
  });

  it("throw khi mã rỗng", () => {
    expect(() => buildAssetQrPayload({ origin: "https://vatm.app", maThietBi: "" })).toThrow();
    expect(() => buildAssetQrPayload({ origin: "https://vatm.app", maThietBi: "   " })).toThrow();
  });
});

describe("qr.parseQr", () => {
  it("nhận /q/<ma> từ path", () => {
    expect(parseQr("/q/TB-001")).toEqual({ kind: "asset", maThietBi: "TB-001", path: "/q/TB-001" });
  });

  it("nhận URL đầy đủ và bỏ query", () => {
    expect(parseQr("https://vatm.app/q/TB-001?utm=x")).toEqual({
      kind: "asset",
      maThietBi: "TB-001",
      path: "/q/TB-001",
    });
  });

  it("nhận /qr/thiet-bi/<id> legacy", () => {
    expect(parseQr("https://vatm.app/qr/thiet-bi/uuid-xxxx")).toEqual({
      kind: "legacy_id",
      id: "uuid-xxxx",
      path: "/qr/thiet-bi/uuid-xxxx",
    });
  });

  it("URL lạ → unknown", () => {
    expect(parseQr("https://vi.wikipedia.org/").kind).toBe("unknown");
  });

  it("chuỗi rác → unknown, không throw", () => {
    expect(parseQr("").kind).toBe("unknown");
    expect(parseQr("blah blah").kind).toBe("unknown");
  });

  it("decode ký tự URL-encoded", () => {
    expect(parseQr("/q/AB%2FCD%2001")).toEqual({
      kind: "asset",
      maThietBi: "AB/CD 01",
      path: "/q/AB%2FCD%2001",
    });
  });

  it("idempotent với buildAssetQrPayload", () => {
    const ma = "TB-XYZ 09";
    const r = buildAssetQrPayload({ origin: "https://vatm.app", maThietBi: ma });
    const parsed = parseQr(r.url);
    expect(parsed.kind).toBe("asset");
    if (parsed.kind === "asset") expect(parsed.maThietBi).toBe(ma);
  });
});
