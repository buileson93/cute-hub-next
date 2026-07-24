import { describe, expect, test } from "vitest";
import {
  parseDacTinhCell,
  serializeDacTinhCell,
  planImportDacTinh,
  serializeExport,
  type ImportRow,
} from "../dac-tinh-io";

describe("parseDacTinhCell", () => {
  test("tách theo ';', trim, uppercase, dedupe, bỏ rỗng", () => {
    expect(parseDacTinhCell(" thu; PHAT ;vhf; ; THU ;phat"))
      .toEqual(["THU", "PHAT", "VHF"]);
  });
  test("null/undefined/empty → []", () => {
    expect(parseDacTinhCell(null)).toEqual([]);
    expect(parseDacTinhCell(undefined)).toEqual([]);
    expect(parseDacTinhCell("")).toEqual([]);
    expect(parseDacTinhCell(" ; ; ")).toEqual([]);
  });
});

describe("serializeDacTinhCell", () => {
  test("sort để roundtrip ổn định + uppercase + dedupe", () => {
    expect(serializeDacTinhCell(["VHF", "thu", "PHAT", "vhf"]))
      .toBe("PHAT;THU;VHF");
  });
});

describe("planImportDacTinh — cảnh báo mã lạ, bỏ qua model lạ, idempotent", () => {
  const modelIdByMa = new Map([
    ["M1", "model-1"],
    ["M2", "model-2"],
  ]);
  const tagIdByMa = new Map([
    ["THU", "tag-thu"],
    ["PHAT", "tag-phat"],
    ["VHF", "tag-vhf"],
  ]);

  test("insert mới khi model chưa có link nào", () => {
    const rows: ImportRow[] = [{ model_ma: "m1", dac_tinh: "THU;VHF" }];
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks: new Map() });
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].model_id).toBe("model-1");
    expect(new Set(plan.operations[0].toInsert)).toEqual(new Set(["tag-thu", "tag-vhf"]));
    expect(plan.operations[0].toDelete).toEqual([]);
    expect(plan.unknownTags).toEqual([]);
    expect(plan.missingModels).toEqual([]);
  });

  test("idempotent — chạy lại với existing = next → op rỗng, không nhân đôi", () => {
    const rows: ImportRow[] = [{ model_ma: "M1", dac_tinh: "THU;VHF" }];
    const existingLinks = new Map([["model-1", new Set(["tag-thu", "tag-vhf"])]]);
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks });
    expect(plan.operations[0].toInsert).toEqual([]);
    expect(plan.operations[0].toDelete).toEqual([]);
  });

  test("diff: giữ THU, thêm PHAT, xoá VHF", () => {
    const rows: ImportRow[] = [{ model_ma: "M1", dac_tinh: "THU;PHAT" }];
    const existingLinks = new Map([["model-1", new Set(["tag-thu", "tag-vhf"])]]);
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks });
    expect(plan.operations[0].toInsert).toEqual(["tag-phat"]);
    expect(plan.operations[0].toDelete).toEqual(["tag-vhf"]);
  });

  test("mã nhãn tài sản lạ → warning, bỏ qua, mã hợp lệ vẫn xử lý", () => {
    const rows: ImportRow[] = [{ model_ma: "M1", dac_tinh: "THU;LAP_LAP;GHOST" }];
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks: new Map() });
    expect(plan.unknownTags).toEqual([
      { model_ma: "M1", ma: "LAP_LAP" },
      { model_ma: "M1", ma: "GHOST" },
    ]);
    expect(plan.operations[0].toInsert).toEqual(["tag-thu"]);
  });

  test("model_ma không tồn tại → missingModels, không sinh op", () => {
    const rows: ImportRow[] = [{ model_ma: "UNKNOWN", dac_tinh: "THU" }];
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks: new Map() });
    expect(plan.operations).toEqual([]);
    expect(plan.missingModels).toEqual(["UNKNOWN"]);
  });

  test("cùng model xuất hiện nhiều dòng — dòng sau cùng thắng", () => {
    const rows: ImportRow[] = [
      { model_ma: "M1", dac_tinh: "THU" },
      { model_ma: "M1", dac_tinh: "VHF;PHAT" },
    ];
    const plan = planImportDacTinh({ rows, modelIdByMa, tagIdByMa, existingLinks: new Map() });
    expect(plan.operations).toHaveLength(1);
    expect(new Set(plan.operations[0].toInsert)).toEqual(new Set(["tag-vhf", "tag-phat"]));
  });
});

describe("Roundtrip export → parse → apply → không thay đổi", () => {
  test("export rồi parse phải cho ra cùng set, chạy import 2 lần idempotent", () => {
    const modelIdByMa = new Map([["M1", "model-1"], ["M2", "model-2"]]);
    const tagIdByMa = new Map([["THU", "t1"], ["PHAT", "t2"], ["VHF", "t3"]]);

    // Snapshot hiện tại của DB (existingLinks) — nguồn sự thật.
    const existingLinks = new Map<string, Set<string>>([
      ["model-1", new Set(["t1", "t3"])],
      ["model-2", new Set(["t2"])],
    ]);

    // 1) Export: map từng model → serialize
    const inv = new Map<string, string>();
    for (const [ma, id] of tagIdByMa) inv.set(id, ma);
    const exportRows = Array.from(modelIdByMa.entries()).map(([ma, id]) => ({
      model_ma: ma,
      dac_tinh_codes: Array.from(existingLinks.get(id) ?? []).map((tid) => inv.get(tid)!),
    }));
    const cells = serializeExport(exportRows);

    // 2) Import lại chính file vừa export
    const plan1 = planImportDacTinh({
      rows: cells.map((c) => ({ model_ma: c.model_ma, dac_tinh: c.dac_tinh })),
      modelIdByMa, tagIdByMa,
      existingLinks: existingLinks as unknown as Map<string, Set<string>>,
    });
    // Tất cả op phải rỗng — không thay đổi loại, không nhân đôi
    for (const op of plan1.operations) {
      expect(op.toInsert).toEqual([]);
      expect(op.toDelete).toEqual([]);
    }
    expect(plan1.unknownTags).toEqual([]);
    expect(plan1.missingModels).toEqual([]);

    // 3) Chạy lần 2 với snapshot y hệt → vẫn idempotent
    const plan2 = planImportDacTinh({
      rows: cells.map((c) => ({ model_ma: c.model_ma, dac_tinh: c.dac_tinh })),
      modelIdByMa, tagIdByMa,
      existingLinks: existingLinks as unknown as Map<string, Set<string>>,
    });
    for (const op of plan2.operations) {
      expect(op.toInsert).toEqual([]);
      expect(op.toDelete).toEqual([]);
    }
  });

  test("thứ tự các mã trong ô KHÔNG ảnh hưởng — 'THU;VHF' == 'VHF;THU'", () => {
    expect(new Set(parseDacTinhCell("THU;VHF"))).toEqual(new Set(parseDacTinhCell("VHF;THU")));
  });
});
