import { describe, expect, it } from "vitest";

import { nextThietBiPageParam, type ThietBiPage } from "@/lib/mirats/db-thiet-bi";

const page = (n: number, total: number): ThietBiPage => ({
  rows: Array.from({ length: n }, (_, i) => i),
  total,
});

describe("nextThietBiPageParam — điểm dừng của infinite scroll tài sản", () => {
  it("còn dữ liệu thì trả về chỉ số trang kế tiếp", () => {
    expect(nextThietBiPageParam(page(100, 250), [page(100, 250)], 100)).toBe(1);
    expect(
      nextThietBiPageParam(page(100, 250), [page(100, 250), page(100, 250)], 100),
    ).toBe(2);
  });

  it("dừng khi danh sách rỗng hoặc chỉ có một trang", () => {
    expect(nextThietBiPageParam(page(0, 0), [page(0, 0)], 100)).toBeUndefined();
    expect(nextThietBiPageParam(page(42, 42), [page(42, 42)], 100)).toBeUndefined();
  });

  it("dừng ở trang cuối vừa đủ pageSize", () => {
    expect(
      nextThietBiPageParam(page(100, 200), [page(100, 200), page(100, 200)], 100),
    ).toBeUndefined();
  });

  it("dừng khi tổng số bản ghi trả về bất thường (nhỏ hơn số đã tải)", () => {
    expect(nextThietBiPageParam(page(100, 0), [page(100, 0)], 100)).toBeUndefined();
  });
});
