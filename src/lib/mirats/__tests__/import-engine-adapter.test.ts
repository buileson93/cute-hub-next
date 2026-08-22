// ============================================================================
// Test đặc tả (characterization) cho ImportEngine chung: bảo đảm adapter của các
// nút "Nhập" rải rác dựng ĐÚNG cùng payload runBulkImport mà Import Studio dùng
// → cùng file + cùng ngữ cảnh cho kết quả giống nhau. Đây là lưới an toàn khi
// bật cờ `importEngineUnified`.
// ============================================================================

import { describe, it, expect, vi } from "vitest";
import {
  buildRunOptions,
  toBulkInput,
  normalizeResult,
  createServerImportEngine,
  type BulkImportInput,
  type BulkImportResult,
  type ImportEngineContext,
} from "@/lib/mirats/import-engine";

// Bản sao payload mà Import Studio (AllInOneImport.runOne) dựng — nguồn parity.
const CONFIRMABLE_TABLES = ["dm_phan_loai", "dm_nhom_he_thong"];
function studioPayload(
  entity: string,
  catTable: string | undefined,
  rows: Array<Record<string, string>>,
  commit: boolean,
  extraRefs?: Record<string, Array<{ ma?: string; ten?: string }>>,
  allow = false,
): BulkImportInput {
  return {
    entity,
    catTable: entity === "danh_muc" ? catTable : undefined,
    rows,
    commit,
    ...(!commit && extraRefs ? { extraRefs } : {}),
    ...(allow ? { allowRefCreate: CONFIRMABLE_TABLES } : {}),
  } as BulkImportInput;
}

describe("buildRunOptions — ngữ cảnh màn hình tự điền", () => {
  it("danh_muc: giữ catTable của bảng đang mở", () => {
    const ctx: ImportEngineContext = { entity: "danh_muc", catTable: "dm_nha_san_xuat" };
    const o = buildRunOptions(ctx, [{ ma: "SONY", ten: "Sony" }]);
    expect(o.entity).toBe("danh_muc");
    expect(o.catTable).toBe("dm_nha_san_xuat");
  });

  it("entity thường (dm_model): bỏ catTable", () => {
    const o = buildRunOptions({ entity: "dm_model", catTable: "dm_model" }, []);
    expect(o.catTable).toBeUndefined();
  });

  it("mang theo defaults / allowRefCreate / extraRefs khi có", () => {
    const o = buildRunOptions(
      { entity: "dm_he_thong", defaults: { don_vi: "DHV" }, allowRefCreate: ["dm_phan_loai"] },
      [{ ma: "HT1", ten: "HT 1" }],
      { dm_phan_loai: [{ ten: "Nhóm 1" }] },
    );
    expect(o.defaults).toEqual({ don_vi: "DHV" });
    expect(o.allowRefCreate).toEqual(["dm_phan_loai"]);
    expect(o.extraRefs).toEqual({ dm_phan_loai: [{ ten: "Nhóm 1" }] });
  });

  it("bỏ qua defaults rỗng để payload gọn", () => {
    const o = buildRunOptions({ entity: "danh_muc", catTable: "dm_don_vi", defaults: {} }, []);
    expect(o.defaults).toBeUndefined();
  });
});

describe("toBulkInput — parity với Import Studio", () => {
  const rows = [
    { ma: "SONY", ten: "Sony" },
    { ma: "", ten: "Bosch" },
  ];

  it("danh mục nền: preview trùng khớp payload Import Studio", () => {
    const opts = buildRunOptions({ entity: "danh_muc", catTable: "dm_nha_san_xuat" }, rows);
    expect(toBulkInput(opts, false)).toEqual(
      studioPayload("danh_muc", "dm_nha_san_xuat", rows, false),
    );
  });

  it("danh mục nền: commit trùng khớp payload Import Studio", () => {
    const opts = buildRunOptions({ entity: "danh_muc", catTable: "dm_nha_san_xuat" }, rows);
    expect(toBulkInput(opts, true)).toEqual(
      studioPayload("danh_muc", "dm_nha_san_xuat", rows, true),
    );
  });

  it("entity model: commit trùng khớp payload Import Studio", () => {
    const opts = buildRunOptions({ entity: "dm_model" }, rows);
    expect(toBulkInput(opts, true)).toEqual(studioPayload("dm_model", undefined, rows, true));
  });

  it("extraRefs CHỈ đi kèm khi preview, không đi kèm khi commit (giống Import Studio)", () => {
    const extra = { dm_phan_loai: [{ ten: "Nhóm 1" }] };
    const opts = buildRunOptions({ entity: "dm_he_thong" }, rows, extra);
    expect(toBulkInput(opts, false).extraRefs).toEqual(extra);
    expect(toBulkInput(opts, true).extraRefs).toBeUndefined();
    expect(toBulkInput(opts, false)).toEqual(
      studioPayload("dm_he_thong", undefined, rows, false, extra),
    );
  });

  it("allowRefCreate đi cùng cả preview lẫn commit khi admin xác nhận", () => {
    const opts = buildRunOptions(
      { entity: "dm_he_thong", allowRefCreate: CONFIRMABLE_TABLES },
      rows,
    );
    expect(toBulkInput(opts, false)).toEqual(
      studioPayload("dm_he_thong", undefined, rows, false, undefined, true),
    );
    expect(toBulkInput(opts, true)).toEqual(
      studioPayload("dm_he_thong", undefined, rows, true, undefined, true),
    );
  });
});

describe("normalizeResult — chuẩn hoá kết quả runBulkImport", () => {
  it("xem trước: map từng dòng preview + tổng hợp", () => {
    const res: BulkImportResult = {
      committed: false,
      summary: { total: 2, create: 1, update: 1, error: 0, refCreate: 0, refConfirm: 0 },
      preview: [
        {
          index: 0,
          action: "create",
          key: "SONY",
          messages: [],
          warnings: ["Mã tự sinh"],
          refCreations: [],
        },
        { index: 1, action: "update", key: "BOSCH", messages: [], warnings: [], refCreations: [] },
      ],
      confirms: [{ table: "dm_phan_loai", label: "Phân loại", value: "Nhóm X" }],
      entity: "danh_muc",
      table: "dm_nha_san_xuat",
    };
    const out = normalizeResult(res);
    expect(out).toMatchObject({ total: 2, create: 1, update: 1, error: 0 });
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0].warnings).toEqual(["Mã tự sinh"]);
    expect(out.refConfirm).toHaveLength(1);
  });

  it("ghi thật: dùng created/updated/writeErrors và suy dòng lỗi từ errors", () => {
    const res: BulkImportResult = {
      committed: true,
      summary: {
        total: 3,
        create: 2,
        update: 1,
        error: 0,
        refCreate: 0,
        refConfirm: 0,
        created: 2,
        updated: 1,
        writeErrors: 1,
      },
      errors: [{ key: "X1", message: "trùng serial" }],
      entity: "thiet_bi",
      table: "thiet_bi",
    };
    const out = normalizeResult(res);
    expect(out.create).toBe(2);
    expect(out.update).toBe(1);
    expect(out.error).toBe(1);
    expect(out.rows).toEqual([
      {
        index: -1,
        action: "error",
        key: "X1",
        messages: ["trùng serial"],
        warnings: [],
        refCreations: [],
      },
    ]);
  });
});

describe("createServerImportEngine — gọi runBulkImport đúng chế độ", () => {
  const okResult: BulkImportResult = {
    committed: false,
    summary: { total: 1, create: 1, update: 0, error: 0, refCreate: 0, refConfirm: 0 },
    preview: [
      { index: 0, action: "create", key: "SONY", messages: [], warnings: [], refCreations: [] },
    ],
    entity: "danh_muc",
    table: "dm_nha_san_xuat",
  };

  it("preview gọi commit=false; commit gọi commit=true", async () => {
    const captured: BulkImportInput[] = [];
    const run = vi.fn(async (args: { data: BulkImportInput }) => {
      captured.push(args.data);
      return okResult;
    });
    const engine = createServerImportEngine(run);
    const opts = buildRunOptions({ entity: "danh_muc", catTable: "dm_nha_san_xuat" }, [
      { ma: "SONY", ten: "Sony" },
    ]);

    await engine.preview(opts);
    expect(captured[0].commit).toBe(false);

    await engine.commit(opts);
    expect(captured[1].commit).toBe(true);
  });

  it("cùng ngữ cảnh + cùng dòng → payload commit y hệt Import Studio", async () => {
    const captured: BulkImportInput[] = [];
    const run = vi.fn(async (args: { data: BulkImportInput }) => {
      captured.push(args.data);
      return okResult;
    });
    const engine = createServerImportEngine(run);
    const rows = [{ ma: "SONY", ten: "Sony" }];
    await engine.commit(buildRunOptions({ entity: "danh_muc", catTable: "dm_nha_san_xuat" }, rows));
    expect(captured[0]).toEqual(studioPayload("danh_muc", "dm_nha_san_xuat", rows, true));
  });
});
