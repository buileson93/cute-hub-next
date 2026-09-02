import { describe, expect, it } from "vitest";

import { nextThietBiPageParam, type ThietBiPage } from "@/lib/mirats/db-thiet-bi";
import { computeClientPageSlice } from "@/lib/mirats/use-client-infinite";

const page = (n: number, total: number): ThietBiPage => ({
  rows: Array.from({ length: n }, (_, i) => i),
  total,
});

describe("nextThietBiPageParam — điểm dừng của infinite scroll tài sản", () => {
  it("còn dữ liệu thì trả về con trỏ trang kế tiếp", () => {
    expect(nextThietBiPageParam(page(100, 250), [page(100, 250)], 100)).toEqual({
      offset: 100,
      limit: 100,
    });
  });

  it("trang cuối chỉ yêu cầu đúng số bản ghi còn lại", () => {
    // Tổng 235: trang 1 = 100, trang 2 = 100, trang 3 phải là 35 (không phải 100).
    const pages = [page(100, 235), page(100, 235)];
    expect(nextThietBiPageParam(page(100, 235), pages, 100)).toEqual({ offset: 200, limit: 35 });
  });

  it("dừng khi danh sách rỗng hoặc chỉ có một trang ngắn", () => {
    expect(nextThietBiPageParam(page(0, 0), [page(0, 0)], 100)).toBeUndefined();
    expect(nextThietBiPageParam(page(42, 42), [page(42, 42)], 100)).toBeUndefined();
  });

  it("dừng sau khi nạp đủ trang cuối rút gọn", () => {
    const pages = [page(100, 235), page(100, 235), page(35, 235)];
    expect(
      nextThietBiPageParam(page(35, 235), pages, 100, { offset: 200, limit: 35 }),
    ).toBeUndefined();
  });

  it("dừng ở trang cuối vừa đủ bội số pageSize", () => {
    expect(
      nextThietBiPageParam(page(100, 200), [page(100, 200), page(100, 200)], 100),
    ).toBeUndefined();
  });

  it("dừng khi tổng số bản ghi trả về bất thường", () => {
    expect(nextThietBiPageParam(page(100, 0), [page(100, 0)], 100)).toBeUndefined();
  });
});

describe("computeClientPageSlice — cuộn tải thêm phía client", () => {
  it("chỉ hiển thị lô đầu và báo còn dữ liệu", () => {
    expect(computeClientPageSlice(250, 100, 100)).toEqual({
      shown: 100,
      hasNextPage: true,
      next: 200,
    });
  });

  it("không vượt quá tổng số dòng", () => {
    expect(computeClientPageSlice(120, 200, 100)).toEqual({
      shown: 120,
      hasNextPage: false,
      next: 120,
    });
  });

  it("danh sách rỗng thì không còn trang kế tiếp", () => {
    expect(computeClientPageSlice(0, 100, 100)).toEqual({ shown: 0, hasNextPage: false, next: 0 });
  });
});
