import { describe, it, expect } from "vitest";
import { sortDacTinh, matchFilter, formatChip, type DacTinh } from "../dac-tinh";

const ds: DacTinh[] = [
  { ma: "TX", ten: "Máy phát", thu_tu: 2 },
  { ma: "RX", ten: "Máy thu", thu_tu: 1 },
  { ma: "TRX", ten: "Thu phát" }, // không thu_tu → xếp cuối
  { ma: "VHF", ten: "VHF", thu_tu: 3 },
  { ma: "UHF", ten: "UHF", thu_tu: 4 },
  { ma: "PORTABLE", ten: "Cầm tay" },
];

describe("sortDacTinh", () => {
  it("xếp theo thu_tu tăng dần, thiếu → cuối, tie-break theo ma", () => {
    const s = sortDacTinh(ds);
    expect(s.map((x) => x.ma)).toEqual(["RX", "TX", "VHF", "UHF", "PORTABLE", "TRX"]);
  });

  it("mảng rỗng → mảng rỗng", () => {
    expect(sortDacTinh([])).toEqual([]);
  });

  it("giữ nguyên input (không mutate)", () => {
    const input: DacTinh[] = [
      { ma: "B", ten: "B" },
      { ma: "A", ten: "A", thu_tu: 5 },
      { ma: "C", ten: "C", thu_tu: 1 },
    ];
    const copy = [...input];
    sortDacTinh(input);
    expect(input).toEqual(copy);
  });
});

describe("matchFilter", () => {
  it("daChon rỗng → true", () => {
    expect(matchFilter(["a"], [], "any")).toBe(true);
    expect(matchFilter([], [], "all")).toBe(true);
  });
  it("any: có ít nhất 1", () => {
    expect(matchFilter(["a", "b"], ["b", "c"], "any")).toBe(true);
    expect(matchFilter(["a"], ["b"], "any")).toBe(false);
  });
  it("all: có đủ", () => {
    expect(matchFilter(["a", "b", "c"], ["a", "b"], "all")).toBe(true);
    expect(matchFilter(["a"], ["a", "b"], "all")).toBe(false);
  });
  it("none: không có bất kỳ", () => {
    expect(matchFilter(["a"], ["b", "c"], "none")).toBe(true);
    expect(matchFilter(["a", "b"], ["b"], "none")).toBe(false);
  });
});

describe("formatChip", () => {
  it("hiện 'ten (ma)'", () => {
    expect(formatChip({ ma: "VHF", ten: "VHF" })).toBe("VHF (VHF)");
    expect(formatChip({ ma: "TX", ten: "Máy phát" })).toBe("Máy phát (TX)");
  });
});
