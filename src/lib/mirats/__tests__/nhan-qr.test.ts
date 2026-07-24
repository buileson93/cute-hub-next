import { describe, it, expect } from "vitest";
import { buildLabelUrl, buildLabelPath } from "../nhan-qr";

describe("buildLabelUrl — dựng URL quét cho nhãn QR", () => {
  it("ghép origin và mã tài sản đúng định dạng /q/<mã>", () => {
    expect(buildLabelUrl("https://mirats.app", "TB-001")).toBe("https://mirats.app/q/TB-001");
  });

  it("bỏ dấu / thừa ở cuối origin", () => {
    expect(buildLabelUrl("https://mirats.app/", "TB-001")).toBe("https://mirats.app/q/TB-001");
    expect(buildLabelUrl("https://mirats.app///", "TB-001")).toBe("https://mirats.app/q/TB-001");
  });

  it("encode ký tự đặc biệt trong mã tài sản", () => {
    expect(buildLabelUrl("https://mirats.app", "TB 01/A")).toBe("https://mirats.app/q/TB%2001%2FA");
  });

  it("cắt khoảng trắng thừa ở mã tài sản", () => {
    expect(buildLabelUrl("https://mirats.app", "  TB-9  ")).toBe("https://mirats.app/q/TB-9");
  });

  it("encode mã Unicode (tiếng Việt có dấu) an toàn để quét", () => {
    const url = buildLabelUrl("https://mirats.app", "Thiết-Bị-Đo-01");
    expect(url).toBe(`https://mirats.app/q/${encodeURIComponent("Thiết-Bị-Đo-01")}`);
    // Round-trip: giải mã lại đúng mã gốc.
    const ma = decodeURIComponent(url.split("/q/")[1]);
    expect(ma).toBe("Thiết-Bị-Đo-01");
  });

  it("mã có cả khoảng trắng, dấu / và Unicode → encode toàn bộ", () => {
    const url = buildLabelUrl("https://mirats.app", "Máy UHF/Trạm Δ");
    expect(url).toBe(`https://mirats.app/q/${encodeURIComponent("Máy UHF/Trạm Δ")}`);
    expect(decodeURIComponent(url.split("/q/")[1])).toBe("Máy UHF/Trạm Δ");
  });
});

describe("buildLabelPath — đường dẫn tương đối", () => {
  it("trả về /q/<mã đã encode>", () => {
    expect(buildLabelPath("TB-001")).toBe("/q/TB-001");
    expect(buildLabelPath("TB 01/A")).toBe("/q/TB%2001%2FA");
  });
});
