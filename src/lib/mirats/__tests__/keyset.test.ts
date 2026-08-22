import { describe, it, expect } from "vitest";
import {
  buildKeysetQuery,
  decodeCursor,
  encodeCursor,
  nextCursor,
  type KeysetCursor,
} from "@/lib/mirats/db/keyset";

describe("buildKeysetQuery — chỉ select cột cần & không OFFSET", () => {
  it("select đúng cột được yêu cầu và tự động thêm id", () => {
    const q = buildKeysetQuery({
      bang: "thiet_bi",
      cot: ["ma_thiet_bi", "ten_thiet_bi", "created_at"],
      sortField: "created_at",
      dir: "desc",
      kichThuoc: 50,
    });
    expect(q.sql).toMatch(/SELECT ma_thiet_bi, ten_thiet_bi, created_at, id/);
    expect(q.sql).not.toMatch(/\*/);
    expect(q.sql).not.toMatch(/OFFSET/i);
    expect(q.sql).toMatch(/LIMIT 50$/);
  });

  it("không thêm id trùng nếu đã có trong danh sách cột", () => {
    const q = buildKeysetQuery({
      bang: "thiet_bi",
      cot: ["id", "ma_thiet_bi"],
      sortField: "ma_thiet_bi",
      dir: "asc",
      kichThuoc: 10,
    });
    // id chỉ xuất hiện một lần trong SELECT
    const selectClause = q.sql.split("FROM")[0];
    expect(selectClause.match(/\bid\b/g)?.length).toBe(1);
  });

  it("desc → dùng '<' và ORDER BY DESC, DESC", () => {
    const q = buildKeysetQuery({
      bang: "kho_giao_dich",
      cot: ["so_luong", "created_at"],
      sortField: "created_at",
      dir: "desc",
      kichThuoc: 20,
      cursor: {
        sortField: "created_at",
        lastValue: "2026-07-14T00:00:00Z",
        lastId: "uuid-1",
      },
    });
    expect(q.sql).toMatch(/\(created_at, id\) < \(\$1, \$2\)/);
    expect(q.sql).toMatch(/ORDER BY created_at DESC, id DESC/);
    expect(q.params).toEqual(["2026-07-14T00:00:00Z", "uuid-1"]);
  });

  it("asc → dùng '>' và ORDER BY ASC, ASC", () => {
    const q = buildKeysetQuery({
      bang: "bao_tri",
      cot: ["ngay_bao_tri"],
      sortField: "ngay_bao_tri",
      dir: "asc",
      kichThuoc: 100,
      cursor: {
        sortField: "ngay_bao_tri",
        lastValue: 42,
        lastId: "u-2",
      },
    });
    expect(q.sql).toMatch(/\(ngay_bao_tri, id\) > \(\$1, \$2\)/);
    expect(q.sql).toMatch(/ORDER BY ngay_bao_tri ASC, id ASC/);
    expect(q.params).toEqual([42, "u-2"]);
  });

  it("cursor null value → dùng nhánh IS NULL để so id", () => {
    const q = buildKeysetQuery({
      bang: "su_co",
      cot: ["ngay_ket_thuc"],
      sortField: "ngay_ket_thuc",
      dir: "desc",
      kichThuoc: 10,
      cursor: { sortField: "ngay_ket_thuc", lastValue: null, lastId: "u-9" },
    });
    expect(q.sql).toMatch(/ngay_ket_thuc IS NULL AND id < \$1/);
    expect(q.params).toEqual(["u-9"]);
  });

  it("không có cursor → không có WHERE", () => {
    const q = buildKeysetQuery({
      bang: "thiet_bi",
      cot: ["id"],
      sortField: "created_at",
      dir: "desc",
      kichThuoc: 25,
    });
    expect(q.sql).not.toMatch(/WHERE/);
    expect(q.params).toEqual([]);
  });

  it("chặn identifier không an toàn (SQL injection)", () => {
    expect(() =>
      buildKeysetQuery({
        bang: "thiet_bi; DROP TABLE users --",
        cot: ["id"],
        sortField: "id",
        dir: "asc",
        kichThuoc: 10,
      }),
    ).toThrow();
    expect(() =>
      buildKeysetQuery({
        bang: "thiet_bi",
        cot: ["id, (select 1)"],
        sortField: "id",
        dir: "asc",
        kichThuoc: 10,
      }),
    ).toThrow();
    expect(() =>
      buildKeysetQuery({
        bang: "thiet_bi",
        cot: ["id"],
        sortField: "1; delete from x",
        dir: "asc",
        kichThuoc: 10,
      }),
    ).toThrow();
  });

  it("chặn kichThuoc ngoài khoảng và cột rỗng", () => {
    expect(() =>
      buildKeysetQuery({
        bang: "t",
        cot: [],
        sortField: "id",
        dir: "asc",
        kichThuoc: 10,
      }),
    ).toThrow();
    expect(() =>
      buildKeysetQuery({
        bang: "t",
        cot: ["id"],
        sortField: "id",
        dir: "asc",
        kichThuoc: 0,
      }),
    ).toThrow();
    expect(() =>
      buildKeysetQuery({
        bang: "t",
        cot: ["id"],
        sortField: "id",
        dir: "asc",
        kichThuoc: 10_000,
      }),
    ).toThrow();
  });
});

describe("nextCursor & encode/decode", () => {
  it("nextCursor lấy giá trị của hàng cuối cùng", () => {
    const rows = [
      { id: "a", created_at: "2026-01-01" },
      { id: "b", created_at: "2026-01-02" },
    ];
    const c = nextCursor(rows, "created_at");
    expect(c).toEqual({
      sortField: "created_at",
      lastValue: "2026-01-02",
      lastId: "b",
    });
  });

  it("nextCursor rỗng → null", () => {
    expect(nextCursor([], "created_at")).toBeNull();
  });

  it("encode / decode round-trip", () => {
    const c: KeysetCursor = {
      sortField: "created_at",
      lastValue: "2026-07-14T10:00:00Z",
      lastId: "uuid-xyz",
    };
    const enc = encodeCursor(c);
    expect(typeof enc).toBe("string");
    expect(decodeCursor(enc)).toEqual(c);
  });

  it("decode chuỗi hỏng → null", () => {
    expect(decodeCursor("!!!not-base64!!!")).toBeNull();
  });
});
