// Test THUẦN cho compiler MẪU LỒNG NHAU (include).
//   • PL03 include PL01 ĐÚNG MỘT LẦN.
//   • PL04 include PL02 + PL03 (⇒ PL01 qua PL03), mỗi mẫu một lần.
//   • Include tạo VÒNG LẶP bị từ chối.
//   • Duplicate (include trùng / trùng section) bị từ chối.
import { describe, it, expect } from "vitest";
import {
  compileVersion,
  validateIncludeGraph,
  IncludeCycleError,
  IncludeDuplicateError,
  IncludeMissingError,
  type VersionNode,
} from "../form-include";
import type { ChecklistSection } from "../checklist";

// --- helpers ---------------------------------------------------------------
function section(code: string, position = 0): ChecklistSection {
  return {
    ma_section: code,
    ten: `Section ${code}`,
    mo_ta: null,
    position,
    items: [
      {
        item_code: `${code}-01`,
        ten: `Hạng mục ${code}`,
        huong_dan: null,
        result_kind: "text",
        don_vi: null,
        tieu_chuan: null,
        tuy_chon: null,
        bat_buoc: false,
        position: 0,
      },
    ],
  };
}

function node(p: {
  id: string;
  code: string;
  sections?: ChecklistSection[];
  includes?: { child: string; position?: number; section_code?: string | null }[];
}): VersionNode {
  return {
    version_id: p.id,
    template_code: p.code,
    content: { fields: [], sections: p.sections ?? [section(`SEC-${p.code}`)] },
    includes: (p.includes ?? []).map((e, i) => ({
      child_version_id: e.child,
      position: e.position ?? i,
      section_code: e.section_code ?? null,
    })),
  };
}

// PL01..PL04 với include: PL03→PL01, PL04→(PL02, PL03)
function baseGraph(): VersionNode[] {
  return [
    node({ id: "v1", code: "PL01" }),
    node({ id: "v2", code: "PL02" }),
    node({ id: "v3", code: "PL03", includes: [{ child: "v1" }] }),
    node({ id: "v4", code: "PL04", includes: [{ child: "v2", position: 0 }, { child: "v3", position: 1 }] }),
  ];
}

describe("compileVersion — include cơ bản", () => {
  it("PL03 include PL01 đúng một lần", () => {
    const out = compileVersion("v3", baseGraph());
    // included_codes: gồm cả root PL03 + PL01, mỗi mã đúng 1 lần
    expect(out.included_codes).toEqual(["PL03", "PL01"]);
    expect(out.included_codes.filter((c) => c === "PL01")).toHaveLength(1);
    // section của PL01 xuất hiện đúng 1 lần
    const pl01Secs = out.sections.filter((s) => s.ma_section === "SEC-PL01");
    expect(pl01Secs).toHaveLength(1);
    // tổng cộng 2 section (PL03 riêng + PL01)
    expect(out.sections.map((s) => s.ma_section)).toEqual(["SEC-PL03", "SEC-PL01"]);
  });

  it("PL04 include PL02 + PL03 (và PL01 qua PL03), mỗi mẫu một lần", () => {
    const out = compileVersion("v4", baseGraph());
    expect(out.included_codes).toEqual(["PL04", "PL02", "PL03", "PL01"]);
    // Không mã nào lặp lại
    const uniq = new Set(out.included_codes);
    expect(uniq.size).toBe(out.included_codes.length);
    // Thứ tự section theo position include: PL04, PL02, PL03, PL01
    expect(out.sections.map((s) => s.ma_section)).toEqual([
      "SEC-PL04",
      "SEC-PL02",
      "SEC-PL03",
      "SEC-PL01",
    ]);
    // position được đánh lại tuần tự 0..n
    expect(out.sections.map((s) => s.position)).toEqual([0, 1, 2, 3]);
  });

  it("giữ đúng thứ tự include theo position (đảo vị trí)", () => {
    const g = [
      node({ id: "v1", code: "PL01" }),
      node({ id: "v2", code: "PL02" }),
      node({ id: "v4", code: "PL04", includes: [{ child: "v1", position: 5 }, { child: "v2", position: 1 }] }),
    ];
    const out = compileVersion("v4", g);
    // PL02 (position 1) trước PL01 (position 5)
    expect(out.included_codes).toEqual(["PL04", "PL02", "PL01"]);
  });
});

describe("compileVersion — từ chối vòng lặp (cycle)", () => {
  it("vòng lặp trực tiếp PL01 → PL03 → PL01 bị từ chối", () => {
    const g = [
      node({ id: "v1", code: "PL01", includes: [{ child: "v3" }] }),
      node({ id: "v3", code: "PL03", includes: [{ child: "v1" }] }),
    ];
    expect(() => compileVersion("v1", g)).toThrow(IncludeCycleError);
  });

  it("tự include chính mình bị từ chối", () => {
    const g = [node({ id: "v1", code: "PL01", includes: [{ child: "v1" }] })];
    expect(() => compileVersion("v1", g)).toThrow(IncludeCycleError);
  });

  it("vòng lặp gián tiếp A → B → C → A bị từ chối, kèm đường đi", () => {
    const g = [
      node({ id: "a", code: "A", includes: [{ child: "b" }] }),
      node({ id: "b", code: "B", includes: [{ child: "c" }] }),
      node({ id: "c", code: "C", includes: [{ child: "a" }] }),
    ];
    try {
      compileVersion("a", g);
      throw new Error("phải ném lỗi cycle");
    } catch (e) {
      expect(e).toBeInstanceOf(IncludeCycleError);
      expect((e as IncludeCycleError).cyclePath).toEqual(["a", "b", "c", "a"]);
    }
  });
});

describe("compileVersion — từ chối trùng lặp (duplicate)", () => {
  it("include cùng một version 2 lần (trực tiếp + gián tiếp) bị từ chối", () => {
    // PL04 include PL01 trực tiếp VÀ qua PL03 → PL01 xuất hiện 2 lần
    const g = [
      node({ id: "v1", code: "PL01" }),
      node({ id: "v3", code: "PL03", includes: [{ child: "v1" }] }),
      node({ id: "v4", code: "PL04", includes: [{ child: "v1", position: 0 }, { child: "v3", position: 1 }] }),
    ];
    expect(() => compileVersion("v4", g)).toThrow(IncludeDuplicateError);
  });

  it("trùng mã section giữa 2 mẫu khác nhau bị từ chối", () => {
    const g = [
      node({ id: "v1", code: "PL01", sections: [section("DUP")] }),
      node({ id: "v2", code: "PL02", sections: [section("DUP")] }),
      node({ id: "v4", code: "PL04", sections: [], includes: [{ child: "v1", position: 0 }, { child: "v2", position: 1 }] }),
    ];
    expect(() => compileVersion("v4", g)).toThrow(IncludeDuplicateError);
  });
});

describe("compileVersion — thiếu version", () => {
  it("include tới version không tồn tại bị từ chối", () => {
    const g = [node({ id: "v3", code: "PL03", includes: [{ child: "missing" }] })];
    expect(() => compileVersion("v3", g)).toThrow(IncludeMissingError);
  });
});

describe("validateIncludeGraph", () => {
  it("báo ok cho cây hợp lệ", () => {
    expect(validateIncludeGraph("v4", baseGraph())).toEqual({ ok: true });
  });
  it("báo kind=cycle cho cây có vòng", () => {
    const g = [
      node({ id: "v1", code: "PL01", includes: [{ child: "v3" }] }),
      node({ id: "v3", code: "PL03", includes: [{ child: "v1" }] }),
    ];
    const r = validateIncludeGraph("v1", g);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("cycle");
  });
  it("báo kind=duplicate cho include trùng", () => {
    const g = [
      node({ id: "v1", code: "PL01" }),
      node({ id: "v3", code: "PL03", includes: [{ child: "v1" }] }),
      node({ id: "v4", code: "PL04", includes: [{ child: "v1", position: 0 }, { child: "v3", position: 1 }] }),
    ];
    const r = validateIncludeGraph("v4", g);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("duplicate");
  });
});

