// ============================================================================
// XUẤT All-in-one: dựng workbook bằng buildAllInOneWorkbook (không đụng DOM) rồi
// kiểm chứng:
//   * mẫu TRỐNG nhiều sheet (đúng thứ tự lớp, có cột kỹ thuật ẩn + sheet META),
//   * SNAPSHOT dữ liệu hiện có (kèm _record_id/_action),
//   * xuất theo PHẠM VI (đơn vị/hệ thống) qua picks,
//   * round-trip: build (kèm data) → parse lại → rows + meta khớp,
//   * readAllInOneMeta đọc đúng sheet META ẩn.
// supabase client được mock để không chạm CSDL.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock dữ liệu theo bảng (điền lại trong beforeEach) ---
const store: Record<string, Array<Record<string, unknown>>> = {};

vi.mock("@/integrations/supabase/client", () => {
  // Chuỗi truy vấn giả: .from(t).select(...).limit(...)/.in(...) đều resolve {data}.
  const makeChain = (table: string) => {
    const result = { data: store[table] ?? [], error: null };
    const chain: Record<string, unknown> = {
      select: () => chain,
      limit: () => Promise.resolve(result),
      in: () => chain,
      is: () => chain,
      eq: () => chain,
      order: () => chain,
      then: (res: (v: typeof result) => unknown) => res(result),
    };
    return chain;
  };
  return { supabase: { from: (t: string) => makeChain(t) } };
});

import ExcelJS from "exceljs";
import {
  buildAllInOneWorkbook,
  parseAllInOneXlsx,
  readAllInOneMeta,
  ALLINONE_LAYERS,
  TECH_COLS,
  META_SHEET,
  SCHEMA_VERSION,
  AI_RULES_SHEET,
  GUIDE_BLOCKS,
} from "@/lib/mirats/allinone-template";

function fakeFile(buf: ArrayBuffer): File {
  return { arrayBuffer: async () => buf } as unknown as File;
}

async function toFile(wb: ExcelJS.Workbook): Promise<File> {
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return fakeFile(buf);
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  // Dữ liệu tối thiểu: 1 phân loại, 2 hệ thống thuộc nó, 3 tài sản.
  store["dm_phan_loai"] = [{ id: "pl1", ma: "PL1", ten: "Phân loại 1" }];
  store["dm_he_thong"] = [
    { id: "ht1", ma: "HT1", ten: "Hệ thống 1", phan_loai_id: "pl1" },
    { id: "ht2", ma: "HT2", ten: "Hệ thống 2", phan_loai_id: "pl1" },
  ];
  store["thiet_bi"] = [
    { id: "tb1", ma_thiet_bi: "TB1", ten_thiet_bi: "Máy A", he_thong_id: "ht1", updated_at: "2025-07-01T00:00:00Z" },
    { id: "tb2", ma_thiet_bi: "TB2", ten_thiet_bi: "Máy B", he_thong_id: "ht1", updated_at: "2025-07-02T00:00:00Z" },
    { id: "tb3", ma_thiet_bi: "TB3", ten_thiet_bi: "Máy C", he_thong_id: "ht2", updated_at: "2025-07-03T00:00:00Z" },
  ];
});

describe("buildAllInOneWorkbook — mẫu TRỐNG", () => {
  it("có đủ sheet lớp theo đúng thứ tự + Hướng dẫn/DanhMuc/META", async () => {
    const { wb } = await buildAllInOneWorkbook({ withData: false });
    const names = wb.worksheets.map((w) => w.name);
    // Mọi sheet lớp có mặt, đúng thứ tự tương đối.
    const layerNames = ALLINONE_LAYERS.map((l) => l.sheet);
    const idxs = layerNames.map((n) => names.indexOf(n));
    expect(idxs.every((i) => i >= 0)).toBe(true);
    expect([...idxs].sort((a, b) => a - b)).toEqual(idxs);
    expect(names).toContain(META_SHEET);
    expect(names).toContain("DanhMuc");
  });

  it("mỗi sheet lớp bắt đầu bằng 4 cột kỹ thuật (ẩn) rồi tới trường nghiệp vụ", async () => {
    const { wb } = await buildAllInOneWorkbook({ withData: false });
    const ws = wb.getWorksheet(ALLINONE_LAYERS[ALLINONE_LAYERS.length - 1].sheet)!; // Tài sản
    const header = ws.getRow(1).values as unknown[];
    // values[0] không dùng (1-indexed) → 4 cột đầu là TECH_COLS.
    expect(header.slice(1, 1 + TECH_COLS.length)).toEqual([...TECH_COLS]);
    for (let k = 1; k <= TECH_COLS.length; k++) expect(ws.getColumn(k).hidden).toBe(true);
  });

  it("sheet META ẩn: schema_version + allowed_actions chỉ 'create' cho mẫu trống", async () => {
    const { wb, meta } = await buildAllInOneWorkbook({ withData: false });
    expect(meta.schema_version).toBe(SCHEMA_VERSION);
    expect(meta.allowed_actions).toEqual(["create"]);
    expect(meta.scope).toBe("template-empty");
    expect(wb.getWorksheet(META_SHEET)!.state).toBe("hidden");
  });

  it("không có dòng dữ liệu ở mẫu trống", async () => {
    const parsed = await parseAllInOneXlsx(await toFile((await buildAllInOneWorkbook({ withData: false })).wb));
    for (const p of parsed) expect(p.rows).toHaveLength(0);
  });
});

describe("Sheet ① Hướng dẫn — skill card cho AI agent", () => {
  it("chứa đủ 9 block header (# ROLE, # INVARIANTS, ...)", async () => {
    const { wb } = await buildAllInOneWorkbook({ withData: false });
    const ws = wb.getWorksheet("① Hướng dẫn")!;
    const text: string[] = [];
    ws.eachRow((row) => {
      row.eachCell((c) => { const v = c.value; if (typeof v === "string") text.push(v); });
    });
    const joined = text.join("\n");
    for (const block of GUIDE_BLOCKS) expect(joined).toContain(block);
  });
});

describe("Sheet ③ AI_RULES — JSON machine-readable", () => {
  it("tồn tại, ẩn, A1 parse được JSON hợp lệ", async () => {
    const { wb } = await buildAllInOneWorkbook({ withData: false });
    const ws = wb.getWorksheet(AI_RULES_SHEET)!;
    expect(ws).toBeDefined();
    expect(ws.state).toBe("hidden");
    const raw = ws.getCell("A1").value as string;
    const j = JSON.parse(raw);
    expect(j.schema_version).toBe(SCHEMA_VERSION);
    expect(j.baseline_available).toBe(false);
    expect(Array.isArray(j.anomaly_rules)).toBe(true);
    expect(j.anomaly_rules.length).toBeGreaterThanOrEqual(10);
    const layerEntities = new Set(j.layers.map((l: { entity: string }) => l.entity));
    for (const ent of Object.keys(j.field_hints)) expect(layerEntities.has(ent)).toBe(true);
    expect(j.enums._action).toContain("create");
  });

  it("withData=true → baseline_available=true", async () => {
    const { wb } = await buildAllInOneWorkbook({ withData: true });
    const raw = wb.getWorksheet(AI_RULES_SHEET)!.getCell("A1").value as string;
    expect(JSON.parse(raw).baseline_available).toBe(true);
  });
});

describe("buildAllInOneWorkbook — SNAPSHOT dữ liệu", () => {
  it("scope=snapshot:all, allowed_actions đầy đủ, có dòng tài sản kèm _record_id/_action", async () => {
    const { wb, meta } = await buildAllInOneWorkbook({ withData: true });
    expect(meta.scope).toBe("snapshot:all");
    expect(meta.allowed_actions).toEqual(["create", "update", "skip", "delete"]);

    const parsed = await parseAllInOneXlsx(await toFile(wb));
    const tb = parsed.find((p) => p.layer.entity === "thiet_bi")!;
    expect(tb.rows).toHaveLength(3);
    // Cột kỹ thuật đi kèm từng dòng.
    expect(tb.meta[0]._record_id).toBe("tb1");
    expect(tb.meta[0]._action).toBe("update");
    expect(tb.meta[0]._row_version).toBe("2025-07-01T00:00:00Z");
    // Cột kỹ thuật KHÔNG lọt vào unmapped.
    for (const t of TECH_COLS) expect(tb.unmapped).not.toContain(t);
  });

  it("readAllInOneMeta đọc lại đúng META từ file", async () => {
    const { wb, meta } = await buildAllInOneWorkbook({ withData: true });
    const read = await readAllInOneMeta(await toFile(wb));
    expect(read).not.toBeNull();
    expect(read!.export_id).toBe(meta.export_id);
    expect(read!.schema_version).toBe(SCHEMA_VERSION);
    expect(read!.allowed_actions).toEqual(meta.allowed_actions);
  });
});

describe("buildAllInOneWorkbook — theo PHẠM VI (picks)", () => {
  it("chọn 1 hệ thống → cascade chỉ xuất tài sản thuộc hệ thống đó", async () => {
    const { wb, meta } = await buildAllInOneWorkbook({
      withData: true,
      picks: { dm_he_thong: { mode: "some", ids: ["ht1"] } },
    });
    expect(meta.scope).toContain("dm_he_thong:1");

    const parsed = await parseAllInOneXlsx(await toFile(wb));
    const tb = parsed.find((p) => p.layer.entity === "thiet_bi")!;
    // Chỉ TB1, TB2 (thuộc ht1); TB3 (ht2) bị loại.
    const ids = tb.meta.map((m) => m._record_id).sort();
    expect(ids).toEqual(["tb1", "tb2"]);
  });

  it("mode 'none' cho tài sản → không xuất dòng tài sản nào", async () => {
    const { wb } = await buildAllInOneWorkbook({
      withData: true,
      picks: { thiet_bi: { mode: "none" } },
    });
    const parsed = await parseAllInOneXlsx(await toFile(wb));
    const tb = parsed.find((p) => p.layer.entity === "thiet_bi")!;
    expect(tb.rows).toHaveLength(0);
  });
});
