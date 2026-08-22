import { describe, it, expect } from "vitest";
import { locSapHetHan, type ExpiringRow } from "../db-expiring";

const rows: ExpiringRow[] = [
  {
    loai: "bao_hanh",
    thiet_bi_id: "tb-1",
    ten: "Máy A",
    ngay_het_han: "2026-07-20",
    so_ngay_con_lai: 10,
  },
  {
    loai: "giay_phep",
    thiet_bi_id: "tb-2",
    ten: "GP B",
    ngay_het_han: "2026-08-10",
    so_ngay_con_lai: 31,
  },
  {
    loai: "bao_hanh",
    thiet_bi_id: "tb-3",
    ten: "Máy C",
    ngay_het_han: "2026-07-12",
    so_ngay_con_lai: 2,
  },
  {
    loai: "giay_phep",
    thiet_bi_id: "tb-4",
    ten: "GP D",
    ngay_het_han: "2026-07-01",
    so_ngay_con_lai: -9,
  },
  {
    loai: "bao_hanh",
    thiet_bi_id: "tb-5",
    ten: "Máy E",
    ngay_het_han: "2026-12-01",
    so_ngay_con_lai: 144,
  },
];

describe("locSapHetHan — lọc theo số ngày", () => {
  it("giữ mục còn hạn trong khoảng [0, days]", () => {
    const out = locSapHetHan(rows, 30);
    expect(out.map((r) => r.thiet_bi_id)).toEqual(["tb-3", "tb-1"]);
  });

  it("bao gồm đúng biên days", () => {
    const out = locSapHetHan(rows, 31);
    expect(out.map((r) => r.thiet_bi_id)).toEqual(["tb-3", "tb-1", "tb-2"]);
  });

  it("loại các mục đã quá hạn (so_ngay_con_lai < 0)", () => {
    const out = locSapHetHan(rows, 365);
    expect(out.some((r) => r.thiet_bi_id === "tb-4")).toBe(false);
  });

  it("sắp xếp tăng dần theo so_ngay_con_lai", () => {
    const out = locSapHetHan(rows, 365);
    const days = out.map((r) => r.so_ngay_con_lai);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("days = 0 chỉ lấy mục hết hạn hôm nay", () => {
    const withToday: ExpiringRow[] = [
      ...rows,
      {
        loai: "bao_hanh",
        thiet_bi_id: "tb-6",
        ten: "Máy F",
        ngay_het_han: "2026-07-10",
        so_ngay_con_lai: 0,
      },
    ];
    expect(locSapHetHan(withToday, 0).map((r) => r.thiet_bi_id)).toEqual(["tb-6"]);
  });
});
