import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// P1 — SSoT tên: renameEntity() phải ghi TÊN vào bảng gốc theo từng layer và
// KHÔNG động vào cay_node_edit (trừ fallback cho node nháp `nh`).
// ============================================================================

type Row = { table: string; op: "update" | "upsert"; payload: Record<string, unknown>; match?: Record<string, unknown> };
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
    upsert(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      calls.push({ table, op: "upsert", payload, match: options });
      return Promise.resolve({ data: null, error: null });
    },
  };
}

vi.mock("@/integrations/backend/client", () => ({
  supabase: { from: (t: string) => makeBuilder(t) },
}));

import { renameEntity } from "../rename-entity";

beforeEach(() => {
  calls.length = 0;
});

describe("renameEntity — ghi tên vào bảng gốc theo từng layer", () => {
  it("pl → cập nhật dm_phan_loai.ten theo id", async () => {
    await renameEntity({ kind: "pl", id: "pl-uuid", ten: "Nhóm 1 mới" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "dm_phan_loai",
      op: "update",
      payload: { ten: "Nhóm 1 mới" },
      match: { id: "pl-uuid" },
    });
  });

  it("nh (thật) → cập nhật dm_nhom_he_thong.ten theo id", async () => {
    await renameEntity({ kind: "nh", id: "nh-uuid", ten: "VHF-A/G" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "dm_nhom_he_thong",
      op: "update",
      payload: { ten: "VHF-A/G" },
      match: { id: "nh-uuid" },
    });
  });

  it("ht → cập nhật dm_he_thong.ten theo id", async () => {
    await renameEntity({ kind: "ht", id: "ht-uuid", ten: "Hệ thống VHF 118.8" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "dm_he_thong",
      op: "update",
      payload: { ten: "Hệ thống VHF 118.8" },
      match: { id: "ht-uuid" },
    });
  });

  it("tb → cập nhật thiet_bi.ten_thiet_bi theo ma_thiet_bi", async () => {
    await renameEntity({ kind: "tb", id: "TB_000123", ten: "Máy phát A" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "thiet_bi",
      op: "update",
      payload: { ten_thiet_bi: "Máy phát A" },
      match: { ma_thiet_bi: "TB_000123" },
    });
  });

  it("KHÔNG bao giờ ghi cay_node_edit khi node là bản ghi thật", async () => {
    for (const kind of ["pl", "nh", "ht", "tb"] as const) {
      calls.length = 0;
      await renameEntity({ kind, id: "x", ten: "Y" });
      expect(calls.some((c) => c.table === "cay_node_edit")).toBe(false);
    }
  });
});

describe("renameEntity — fallback cho node nháp `nh` chưa có bản ghi thật", () => {
  it("nh + draft=true → upsert cay_node_edit (không đụng bảng dm_)", async () => {
    await renameEntity({ kind: "nh", id: "NH_CUSTOM", ten: "Nhóm nháp", draft: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "cay_node_edit",
      op: "upsert",
      payload: expect.objectContaining({ kind: "nh", ma: "NH_CUSTOM", ten: "Nhóm nháp" }),
    });
  });

  it("draft=true với kind khác `nh` → lỗi (không có khái niệm nháp)", async () => {
    await expect(
      renameEntity({ kind: "ht", id: "x", ten: "Y", draft: true }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe("renameEntity — validate đầu vào", () => {
  it("tên rỗng → lỗi, không phát sinh câu lệnh", async () => {
    await expect(renameEntity({ kind: "ht", id: "x", ten: "   " })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("id rỗng → lỗi", async () => {
    await expect(renameEntity({ kind: "ht", id: "", ten: "Tên" })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it("tên được trim trước khi ghi", async () => {
    await renameEntity({ kind: "ht", id: "ht-uuid", ten: "  Hệ A  " });
    expect(calls[0]?.payload).toEqual({ ten: "Hệ A" });
  });
});
