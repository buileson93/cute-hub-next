import { describe, it, expect } from "vitest";
import {
  BUSINESS_TABLES,
  getKnownTableNames,
  renderSchemaForPrompt,
  DANH_MUC_TABLES,
} from "../data-dictionary";
import { KNOWN_TABLES } from "../query-helpers";

describe("data-dictionary (single source of truth)", () => {
  it("bao gồm các bảng vận hành mà trước đây AI bị mù", () => {
    const names = getKnownTableNames();
    for (const t of ["su_co", "bao_tri", "hong_hoc", "ban_giao"]) {
      expect(names).toContain(t);
    }
  });

  it("prompt schema chứa mô tả bảng vận hành", () => {
    const p = renderSchemaForPrompt();
    expect(p).toContain("bao_tri");
    expect(p).toContain("su_co");
    expect(p).toContain("FK:");
  });

  it("KNOWN_TABLES đồng bộ 1-1 với từ điển", () => {
    expect([...KNOWN_TABLES].sort()).toEqual(getKnownTableNames().sort());
  });

  it("mọi bảng có ít nhất 1 cột và group hợp lệ", () => {
    const groups = ["master", "equipment", "operations", "docs", "system"];
    for (const t of BUSINESS_TABLES) {
      expect(t.columns.length).toBeGreaterThan(0);
      expect(groups).toContain(t.group);
    }
  });

  it("DANH_MUC_TABLES chỉ gồm bảng dm_* group master", () => {
    expect(DANH_MUC_TABLES.length).toBeGreaterThan(0);
    for (const n of DANH_MUC_TABLES) expect(n.startsWith("dm_")).toBe(true);
  });

  it("mọi enumOf trỏ tới bảng có thật (dm_* hoặc bảng nghiệp vụ)", () => {
    const names = new Set(getKnownTableNames());
    for (const t of BUSINESS_TABLES) {
      for (const c of t.columns) {
        if (c.enumOf) expect(names.has(c.enumOf)).toBe(true);
      }
    }
  });

  it("prompt liệt kê ĐẦY ĐỦ mọi bảng trong từ điển", () => {
    const p = renderSchemaForPrompt();
    for (const t of BUSINESS_TABLES) {
      expect(p).toContain(`- ${t.name}:`);
    }
  });

  it("mọi quan hệ FK trỏ tới bảng đích tồn tại trong từ điển", () => {
    const names = new Set(getKnownTableNames());
    for (const t of BUSINESS_TABLES) {
      for (const rel of t.relations ?? []) {
        // định dạng "cot -> bang.cot"
        const target = rel.split("->")[1]?.trim().split(".")[0];
        expect(target, `FK đích của ${t.name}: ${rel}`).toBeTruthy();
        expect(names.has(target!)).toBe(true);
      }
    }
  });

  it("không có tên bảng trùng lặp trong từ điển", () => {
    const names = getKnownTableNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it("bao phủ đủ 5 nhóm dữ liệu (không mù nhóm nào)", () => {
    const groups = new Set(BUSINESS_TABLES.map((t) => t.group));
    for (const g of ["master", "equipment", "operations", "docs", "system"]) {
      expect(groups.has(g as (typeof BUSINESS_TABLES)[number]["group"])).toBe(true);
    }
  });
});
