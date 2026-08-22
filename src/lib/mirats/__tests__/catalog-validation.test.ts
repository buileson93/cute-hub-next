import { describe, it, expect } from "vitest";
import { validateCatalogRows, CATALOG_TEMPLATE_VERSION } from "@/lib/mirats/catalog-template";

describe("validateCatalogRows", () => {
  it("báo thiếu cột bắt buộc ở tất cả các dòng", () => {
    const rows = [{ foo: "a" }, { foo: "b" }];
    const iss = validateCatalogRows(["foo"], rows, { required: ["ten"] });
    expect(iss).toHaveLength(2);
    for (const i of iss) {
      expect(i.errors.some((e) => e.includes('"ten"'))).toBe(true);
      expect(i.issues.some((x) => x.field === "ten" && x.level === "error")).toBe(true);
    }
  });

  it("báo bỏ trống ở cột bắt buộc và gắn field/value", () => {
    const iss = validateCatalogRows(["ten"], [{ ten: "" }, { ten: "OK" }]);
    expect(iss[0].errors.length).toBe(1);
    expect(iss[0].issues[0]).toMatchObject({ field: "ten", value: "", level: "error" });
    expect(iss[1].errors.length).toBe(0);
    expect(iss[1].issues.length).toBe(0);
  });

  it("cảnh báo active lạ — gắn cột active + giữ nguyên value", () => {
    const iss = validateCatalogRows(["ten", "active"], [{ ten: "A", active: "maybe" }]);
    expect(iss[0].warnings.some((w) => w.includes("active"))).toBe(true);
    expect(iss[0].issues).toContainEqual(
      expect.objectContaining({ field: "active", value: "maybe", level: "warning" }),
    );
  });

  it("cảnh báo FK không khớp — gắn cột & value", () => {
    const iss = validateCatalogRows(["ten", "nha_san_xuat"], [{ ten: "A", nha_san_xuat: "Xyz" }], {
      refCols: [{ csvKey: "nha_san_xuat", allowed: new Set(["boeing", "airbus"]) }],
    });
    expect(iss[0].issues).toContainEqual(
      expect.objectContaining({ field: "nha_san_xuat", value: "Xyz", level: "warning" }),
    );
  });

  it("expose CATALOG_TEMPLATE_VERSION là chuỗi non-empty", () => {
    expect(typeof CATALOG_TEMPLATE_VERSION).toBe("string");
    expect(CATALOG_TEMPLATE_VERSION.length).toBeGreaterThan(0);
  });
});
