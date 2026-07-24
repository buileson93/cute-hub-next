// Test THUẦN cho `metrics.licenseStatus` — chốt ngưỡng "sắp hết hạn" ở 90
// ngày (khớp phễu d30/d60/d90 và nhãn KPI trên trang /giay-phep).
import { describe, it, expect } from "vitest";
import { licenseStatus } from "../metrics";
import type { GiayPhep } from "../types";

const TODAY = new Date("2026-07-14T00:00:00Z");

function gp(daysFromToday: number | null): GiayPhep {
  const ngayHetHan =
    daysFromToday == null
      ? null
      : new Date(TODAY.getTime() + daysFromToday * 86_400_000).toISOString().slice(0, 10);
  return {
    id: "GP_TEST",
    thietBi: null,
    loai: null,
    soGP: null,
    ngayCap: null,
    ngayHetHan,
    noiCap: null,
    file: null,
    ghiChu: null,
  };
}

describe("licenseStatus (ngưỡng 90 ngày)", () => {
  it("còn 75 ngày ⇒ expiring", () => {
    expect(licenseStatus(gp(75), TODAY)).toBe("expiring");
  });

  it("còn 100 ngày ⇒ valid", () => {
    expect(licenseStatus(gp(100), TODAY)).toBe("valid");
  });

  it("quá hạn ⇒ expired", () => {
    expect(licenseStatus(gp(-1), TODAY)).toBe("expired");
  });

  it("đúng biên 90 ngày ⇒ expiring", () => {
    expect(licenseStatus(gp(90), TODAY)).toBe("expiring");
  });

  it("91 ngày ⇒ valid (ngoài phễu d90)", () => {
    expect(licenseStatus(gp(91), TODAY)).toBe("valid");
  });

  it("không có ngày hết hạn ⇒ none", () => {
    expect(licenseStatus(gp(null), TODAY)).toBe("none");
  });
});
