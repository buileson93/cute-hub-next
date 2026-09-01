import { describe, it, expect } from "vitest";
import {
  normalizeDeviceRows,
  hasDataAnomaly,
} from "@/components/mirats/he-thong-cay/normalize";
import { buildTree, filterTreeByBadge, cmpDeviceByLoai } from "@/components/mirats/he-thong-cay/utils";

describe("normalizeDeviceRows", () => {
  it("loại bản ghi không phải object và bản ghi thiếu định danh", () => {
    const { rows, report } = normalizeDeviceRows([
      null,
      "x",
      { id: "1", ma_thiet_bi: "TB-1" },
      { ten: "không có mã" },
    ]);
    expect(rows).toHaveLength(1);
    expect(report.invalid).toBe(3);
    expect(hasDataAnomaly(report)).toBe(true);
  });

  it("loại id trùng và bù mã thiếu", () => {
    const { rows, report } = normalizeDeviceRows([
      { id: "1", ma_thiet_bi: "TB-1" },
      { id: "1", ma_thiet_bi: "TB-1-dup" },
      { ma_thiet_bi: "TB-2" },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["1", "TB-2"]);
    expect(report.duplicate).toBe(1);
  });

  it("payload không phải mảng không làm sập", () => {
    expect(normalizeDeviceRows(undefined).rows).toEqual([]);
    expect(normalizeDeviceRows({ data: [] }).report.malformedPayload).toBe(true);
  });
});

describe("buildTree / filterTreeByBadge chịu lỗi dữ liệu", () => {
  it("không sập khi plList hoặc devices sai kiểu", () => {
    expect(buildTree(undefined as never, [] as never, (m) => m, (m) => m).tree).toEqual([]);
    expect(buildTree([], undefined as never, (m) => m, (m) => m).tree).toEqual([]);
  });

  it("bỏ qua phần tử thiết bị rỗng", () => {
    const res = buildTree(
      [null as never, { id: "1", ma_thiet_bi: "TB-1", _pl: "p1" } as never],
      [{ id: "p1", ten: "Nhóm 1", tone: "" }] as never,
      (m) => m,
      (m) => m,
    );
    expect(res.total).toBe(1);
  });

  it("filterTreeByBadge chấp nhận nhánh thiếu mảng con", () => {
    const broken = [{ id: "p1", ten: "P", tone: "", count: 0 }] as never;
    expect(() =>
      filterTreeByBadge(broken, { status: new Set(), imp: new Set() } as never),
    ).not.toThrow();
  });

  it("cmpDeviceByLoai không sập khi thiếu mã tài sản", () => {
    const a = { tb: {}, children: [] } as never;
    const b = { tb: { ma_thiet_bi: "TB-2" }, children: [] } as never;
    expect(() => cmpDeviceByLoai(a, b)).not.toThrow();
  });
});
