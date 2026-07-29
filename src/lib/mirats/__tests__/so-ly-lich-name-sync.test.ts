import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// P3 — Đồng bộ tên Sổ lý lịch với SSoT.
//
// Sau khi `renameEntity` ghi tên vào bảng gốc (dm_he_thong / thiet_bi), các
// map override từ `cay_node_edit` KHÔNG được che tên bảng gốc nữa. Chỉ node
// NHÁP (id chưa tồn tại ở bảng gốc) mới được giữ trong override map.
//
// Hai helper thuần dưới đây là "trái tim" của useSystemNameOverrides /
// useDeviceNameOverrides — test ở đây để đảm bảo cả 3 view (cây / bảng /
// mindmap) và Sổ lý lịch cùng đọc một nguồn tên.
// ============================================================================

type Row = { table: string; op: string; payload: Record<string, unknown>; match?: Record<string, unknown> };
const calls: Row[] = [];

function makeBuilder(table: string) {
  return {
    update(payload: Record<string, unknown>) {
      const row: Row = { table, op: "update", payload };
      calls.push(row);
      return {
        eq(col: string, val: unknown) {
          row.match = { [col]: val };
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
}

vi.mock("@/integrations/backend/client", () => ({
  supabase: { from: (t: string) => makeBuilder(t) },
}));

import { renameEntity } from "../rename-entity";
import { buildSystemNameOverrideMap, buildDeviceNameOverrideMap } from "../db-taxonomy";

beforeEach(() => {
  calls.length = 0;
});

describe("Sổ lý lịch — tên hệ thống lấy từ bảng gốc, override chỉ cho node nháp", () => {
  it("Node thật (id có trong dm_he_thong) → override BỊ BỎ, dùng tên bảng gốc", () => {
    const rows = [
      { ma: `nhomA::ht-real-1`, ten: "Tên cũ ở nháp", du_lieu: { ten_mindmap: "Tên mindmap cũ" } },
    ];
    const realIds = new Set(["ht-real-1"]);
    const overrides = buildSystemNameOverrideMap(rows, realIds);
    expect(overrides.get("ht-real-1")).toBeUndefined();
    expect(overrides.size).toBe(0);
  });

  it("Node nháp (id chưa có ở dm_he_thong) → giữ tên override", () => {
    const rows = [
      { ma: `nhomA::ht-draft-x`, ten: null, du_lieu: { ten_mindmap: "Hệ nháp X" } },
      { ma: `nhomB::ht-draft-y`, ten: "Hệ nháp Y", du_lieu: null },
    ];
    const overrides = buildSystemNameOverrideMap(rows, new Set());
    expect(overrides.get("ht-draft-x")).toBe("Hệ nháp X");
    expect(overrides.get("ht-draft-y")).toBe("Hệ nháp Y");
  });

  it("Bỏ qua khoá `__none__` và mã rỗng", () => {
    const rows = [
      { ma: `nhomA::__none__`, ten: "Bỏ qua", du_lieu: null },
      { ma: "", ten: "Bỏ qua", du_lieu: null },
    ];
    expect(buildSystemNameOverrideMap(rows, new Set()).size).toBe(0);
  });

  it("Sau renameEntity('ht', ...): bảng gốc được cập nhật, và giả lập refetch → override rỗng cho id đó", async () => {
    // 1. Đổi tên qua SSoT — bảng gốc dm_he_thong được cập nhật.
    await renameEntity({ kind: "ht", id: "ht-uuid-42", ten: "Hệ thống Radar Đà Nẵng" });
    expect(calls[0]).toMatchObject({
      table: "dm_he_thong",
      op: "update",
      payload: { ten: "Hệ thống Radar Đà Nẵng" },
      match: { id: "ht-uuid-42" },
    });

    // 2. Nếu vẫn còn "vệt" tên cũ trong cay_node_edit (chưa clean), map override
    //    phải LỜ đi vì id đã có bản ghi thật.
    const overrides = buildSystemNameOverrideMap(
      [{ ma: `nhomZ::ht-uuid-42`, ten: "Tên rất cũ", du_lieu: { ten_mindmap: "Tên mindmap cũ" } }],
      new Set(["ht-uuid-42"]),
    );
    expect(overrides.has("ht-uuid-42")).toBe(false);
  });
});

describe("Sổ lý lịch — tên tài sản lấy từ bảng gốc, override chỉ cho node nháp", () => {
  it("ma_thiet_bi đã tồn tại → override BỊ BỎ", () => {
    const rows = [
      { ma: "TB_000123", ten: "Tên cũ ở nháp", du_lieu: { ten_mindmap: "Tên mindmap cũ" } },
    ];
    const overrides = buildDeviceNameOverrideMap(rows, new Set(["TB_000123"]));
    expect(overrides.size).toBe(0);
  });

  it("ma_thiet_bi chưa tồn tại (node nháp) → giữ override", () => {
    const rows = [
      { ma: "TB_DRAFT_001", ten: "Máy nháp", du_lieu: null },
    ];
    const overrides = buildDeviceNameOverrideMap(rows, new Set(["TB_KHAC"]));
    expect(overrides.get("TB_DRAFT_001")).toBe("Máy nháp");
  });

  it("Sau renameEntity('tb', ...): bảng gốc được cập nhật, override cho ma đó bị lờ", async () => {
    await renameEntity({ kind: "tb", id: "TB_000123", ten: "Máy phát A (đã đổi)" });
    expect(calls[0]).toMatchObject({
      table: "thiet_bi",
      op: "update",
      payload: { ten_thiet_bi: "Máy phát A (đã đổi)" },
      match: { ma_thiet_bi: "TB_000123" },
    });
    const overrides = buildDeviceNameOverrideMap(
      [{ ma: "TB_000123", ten: "Tên cũ", du_lieu: { ten_mindmap: "Cũ hơn" } }],
      new Set(["TB_000123"]),
    );
    expect(overrides.has("TB_000123")).toBe(false);
  });
});
