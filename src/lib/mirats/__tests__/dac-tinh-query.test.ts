import { describe, expect, test } from "vitest";
import {
  fetchDacTinhPage,
  escapeIlike,
  type DacTinhClient,
  type DacTinhPageRow,
} from "../dac-tinh-query";

type Call =
  | { op: "range"; from: number; to: number }
  | { op: "eq"; column: string; value: string }
  | { op: "or"; filter: string }
  | { op: "order"; column: string; ascending: boolean; nullsFirst?: boolean };

interface MockOptions {
  data?: DacTinhPageRow[];
  count?: number;
  error?: unknown;
}

/** Mock supabase-like client — ghi lại từng lời gọi & trả kết quả cấu hình. */
function makeClient(opts: MockOptions = {}) {
  const calls: Call[] = [];
  let selectCols: string | null = null;
  let countOpt: string | null = null;

  const builder: DacTinhClient["from"] extends (...args: any) => infer B ? never : never = null as never;
  void builder;

  const chain = {
    range(from: number, to: number) { calls.push({ op: "range", from, to }); return chain; },
    eq(column: string, value: string) { calls.push({ op: "eq", column, value }); return chain; },
    or(filter: string) { calls.push({ op: "or", filter }); return chain; },
    order(column: string, o: { ascending?: boolean; nullsFirst?: boolean } = {}) {
      calls.push({
        op: "order",
        column,
        ascending: o.ascending ?? true,
        ...(o.nullsFirst !== undefined ? { nullsFirst: o.nullsFirst } : {}),
      });
      return chain;
    },
    // Thenable — cho phép `await` trực tiếp trên builder.
    then<T>(onFulfilled: (r: { data: DacTinhPageRow[] | null; error: unknown; count: number | null }) => T) {
      return Promise.resolve({
        data: opts.data ?? [],
        error: opts.error ?? null,
        count: opts.count ?? (opts.data?.length ?? 0),
      }).then(onFulfilled);
    },
  };
  const client: DacTinhClient = {
    from(_table: "dm_dac_tinh") {
      return {
        select(cols: string, o?: { count?: "exact" }) {
          selectCols = cols;
          countOpt = o?.count ?? null;
          return chain as never;
        },
      };
    },
  };
  return { client, calls, getSelect: () => ({ selectCols, countOpt }) };
}

describe("escapeIlike", () => {
  test("chặn %, _, dấu phẩy", () => {
    expect(escapeIlike("50%_ok,go")).toBe("50okgo");
  });
});

describe("fetchDacTinhPage — phân trang / filter / sort server-side", () => {
  test("range đúng công thức (trang-1)*kichThuoc..+size-1", async () => {
    const { client, calls } = makeClient({ count: 100 });
    await fetchDacTinhPage(client, {
      trang: 3, kichThuoc: 25, q: "",
      sortField: "", sortDir: "asc",
    });
    const range = calls.find((c) => c.op === "range");
    expect(range).toEqual({ op: "range", from: 50, to: 74 });
  });

  test("tìm kiếm q → .or('ma.ilike.%kw%,ten.ilike.%kw%,mo_ta.ilike.%kw%'), có escape", async () => {
    const { client, calls } = makeClient();
    await fetchDacTinhPage(client, {
      trang: 1, kichThuoc: 10, q: " 50%_evil, ",
      sortField: "", sortDir: "asc",
    });
    const or = calls.find((c) => c.op === "or") as Extract<Call, { op: "or" }>;
    expect(or.filter).toBe("ma.ilike.%50evil%,ten.ilike.%50evil%,mo_ta.ilike.%50evil%");
  });

  test("q rỗng → không .or", async () => {
    const { client, calls } = makeClient();
    await fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "   ", sortField: "", sortDir: "asc" });
    expect(calls.find((c) => c.op === "or")).toBeUndefined();
  });

  test("sort mặc định (sortField rỗng) → thu_tu asc nulls last, ma asc", async () => {
    const { client, calls } = makeClient();
    await fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "", sortField: "", sortDir: "asc" });
    const orders = calls.filter((c) => c.op === "order") as Extract<Call, { op: "order" }>[];
    expect(orders).toEqual([
      { op: "order", column: "thu_tu", ascending: true, nullsFirst: false },
      { op: "order", column: "ma", ascending: true },
    ]);
  });

  test("sort thu_tu desc → order('thu_tu', desc, nullsFirst:false) + tie-breaker ma asc", async () => {
    const { client, calls } = makeClient();
    await fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "", sortField: "thu_tu", sortDir: "desc" });
    const orders = calls.filter((c) => c.op === "order") as Extract<Call, { op: "order" }>[];
    expect(orders).toEqual([
      { op: "order", column: "thu_tu", ascending: false, nullsFirst: false },
      { op: "order", column: "ma", ascending: true },
    ]);
  });

  test("sort field không thuộc whitelist → rơi về default", async () => {
    const { client, calls } = makeClient();
    await fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "", sortField: "mo_ta", sortDir: "asc" });
    const orders = calls.filter((c) => c.op === "order") as Extract<Call, { op: "order" }>[];
    expect(orders.map((o) => o.column)).toEqual(["thu_tu", "ma"]);
  });

  test("select cols + count=exact được truyền", async () => {
    const { client, getSelect } = makeClient();
    await fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "", sortField: "", sortDir: "asc" });
    const { selectCols, countOpt } = getSelect();
    expect(selectCols).toContain("thu_tu");
    expect(countOpt).toBe("exact");
  });

  test("kết quả trả về đúng rows + tong (count)", async () => {
    const rows: DacTinhPageRow[] = [
      { id: "1", ma: "DT_AAAA0001", ten: "Máy thu", mo_ta: null, thu_tu: 1 },
      { id: "2", ma: "DT_AAAA0002", ten: "VHF", mo_ta: null, thu_tu: 2 },
    ];
    const { client } = makeClient({ data: rows, count: 42 });
    const res = await fetchDacTinhPage(client, {
      trang: 2, kichThuoc: 25, q: "vhf",
      sortField: "thu_tu", sortDir: "asc",
    });
    expect(res.tong).toBe(42);
    expect(res.rows).toEqual(rows);
  });

  test("error từ server → throw", async () => {
    const { client } = makeClient({ error: new Error("boom") });
    await expect(
      fetchDacTinhPage(client, { trang: 1, kichThuoc: 10, q: "", sortField: "", sortDir: "asc" }),
    ).rejects.toThrow("boom");
  });
});
