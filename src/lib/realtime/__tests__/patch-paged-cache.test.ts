// Unit tests cho patchPagedCache — đảm bảo cập nhật cache đúng và không
// gây sai lệch dữ liệu khi có realtime INSERT/UPDATE/DELETE.
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { patchPagedCache } from "../patch-paged-cache";
import type { PagedResult } from "@/lib/mirats/paged";

interface Row { id: string; name: string; status?: string }

function seed(qc: QueryClient, key: readonly unknown[], data: PagedResult<Row>) {
  qc.setQueryData(key, data);
}

describe("patchPagedCache", () => {
  let qc: QueryClient;
  const KEY = ["paged-thiet-bi", { page: 1 }] as const;

  beforeEach(() => {
    qc = new QueryClient();
  });

  it("returns false when no matching query exists", () => {
    const touched = patchPagedCache(qc, "paged-thiet-bi", "INSERT", { id: "x" }, null);
    expect(touched).toBe(false);
  });

  it("INSERT: chỉ tăng total, không chèn vào rows (giữ sort/filter)", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A" }], total: 1 });
    const ok = patchPagedCache(qc, "paged-thiet-bi", "INSERT", { id: "b", name: "B" }, null);
    expect(ok).toBe(true);
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(2);
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].id).toBe("a");
  });

  it("UPDATE: replace đúng dòng theo pk, giữ total", () => {
    seed(qc, KEY, {
      rows: [{ id: "a", name: "A", status: "old" }, { id: "b", name: "B" }],
      total: 2,
    });
    patchPagedCache(qc, "paged-thiet-bi", "UPDATE",
      { id: "a", name: "A2", status: "new" }, { id: "a", name: "A" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(2);
    expect(data.rows[0]).toMatchObject({ id: "a", name: "A2", status: "new" });
    expect(data.rows[1].id).toBe("b");
  });

  it("UPDATE: merge (không xoá field cũ ngoài payload)", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A", status: "keep" }], total: 1 });
    patchPagedCache(qc, "paged-thiet-bi", "UPDATE",
      { id: "a", name: "A2" }, { id: "a" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.rows[0]).toEqual({ id: "a", name: "A2", status: "keep" });
  });

  it("UPDATE: dòng không có trong trang → không đổi total và không thêm", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A" }], total: 50 });
    patchPagedCache(qc, "paged-thiet-bi", "UPDATE",
      { id: "z", name: "Z2" }, { id: "z", name: "Z" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(50);
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].id).toBe("a");
  });

  it("DELETE: dòng trong trang → xoá khỏi rows và giảm total", () => {
    seed(qc, KEY, {
      rows: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      total: 5,
    });
    patchPagedCache(qc, "paged-thiet-bi", "DELETE", null, { id: "a" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(4);
    expect(data.rows.map((r) => r.id)).toEqual(["b"]);
  });

  it("DELETE: dòng ngoài trang → chỉ giảm total, giữ rows", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A" }], total: 10 });
    patchPagedCache(qc, "paged-thiet-bi", "DELETE", null, { id: "z" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(9);
    expect(data.rows).toHaveLength(1);
  });

  it("DELETE: không cho total âm", () => {
    seed(qc, KEY, { rows: [], total: 0 });
    patchPagedCache(qc, "paged-thiet-bi", "DELETE", null, { id: "z" });
    expect(qc.getQueryData<PagedResult<Row>>(KEY)!.total).toBe(0);
  });

  it("bỏ qua query không phải PagedShape (không crash, không sai lệch)", () => {
    qc.setQueryData(["paged-thiet-bi", "weird"], { foo: "bar" });
    const ok = patchPagedCache(qc, "paged-thiet-bi", "UPDATE", { id: "a" }, null);
    expect(ok).toBe(false);
    expect(qc.getQueryData(["paged-thiet-bi", "weird"])).toEqual({ foo: "bar" });
  });

  it("bỏ qua khi thiếu pk trên cả new lẫn old", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A" }], total: 1 });
    patchPagedCache(qc, "paged-thiet-bi", "UPDATE", { name: "X" }, null);
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data).toEqual({ rows: [{ id: "a", name: "A" }], total: 1 });
  });

  it("patch đồng thời nhiều trang có cùng prefix", () => {
    const K1 = ["paged-su-co", { page: 1 }];
    const K2 = ["paged-su-co", { page: 2 }];
    qc.setQueryData<PagedResult<Row>>(K1, {
      rows: [{ id: "a", name: "A" }], total: 3,
    });
    qc.setQueryData<PagedResult<Row>>(K2, {
      rows: [{ id: "c", name: "C" }], total: 3,
    });
    patchPagedCache(qc, "paged-su-co", "UPDATE",
      { id: "a", name: "A2" }, { id: "a" });
    expect(qc.getQueryData<PagedResult<Row>>(K1)!.rows[0].name).toBe("A2");
    expect(qc.getQueryData<PagedResult<Row>>(K2)!.rows[0].name).toBe("C");
  });

  it("custom pk khác 'id'", () => {
    const key = ["paged-custom", {}];
    qc.setQueryData(key, {
      rows: [{ ma: "M1", ten: "X" }, { ma: "M2", ten: "Y" }],
      total: 2,
    });
    patchPagedCache(qc, "paged-custom", "DELETE", null, { ma: "M1" }, "ma");
    const data = qc.getQueryData<{ rows: Array<{ ma: string }>; total: number }>(key)!;
    expect(data.total).toBe(1);
    expect(data.rows.map((r) => r.ma)).toEqual(["M2"]);
  });

  it("chuỗi INSERT+UPDATE+DELETE giữ total nhất quán", () => {
    seed(qc, KEY, { rows: [{ id: "a", name: "A" }], total: 1 });
    patchPagedCache(qc, "paged-thiet-bi", "INSERT", { id: "b", name: "B" }, null);
    patchPagedCache(qc, "paged-thiet-bi", "UPDATE",
      { id: "a", name: "A2" }, { id: "a" });
    patchPagedCache(qc, "paged-thiet-bi", "DELETE", null, { id: "a" });
    const data = qc.getQueryData<PagedResult<Row>>(KEY)!;
    expect(data.total).toBe(1);
    expect(data.rows).toEqual([]);
  });
});
