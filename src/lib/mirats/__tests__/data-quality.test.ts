import { describe, it, expect } from "vitest";
import {
  classifyItem,
  summarizeReview,
  type ItemSignals,
  type Classification,
} from "@/lib/mirats/data-quality";
import type { MatchResult } from "@/lib/mirats/entity-resolve";

function match(partial: Partial<MatchResult>): MatchResult {
  return {
    decision: "create",
    kind: "none",
    confidence: 0,
    candidate: null,
    candidates: [],
    reason: "",
    ...partial,
  };
}

function signals(partial: Partial<ItemSignals>): ItemSignals {
  return {
    missingRequired: [],
    unresolvedRefs: [],
    isCatalogGuard: false,
    match: match({}),
    ...partial,
  };
}

describe("classifyItem", () => {
  it("thiếu trường bắt buộc → missing/error (ưu tiên cao nhất)", () => {
    const c = classifyItem(
      signals({
        missingRequired: ["ma_thiet_bi"],
        match: match({ kind: "serial_model_mfr", decision: "needs_review" }),
      }),
    );
    expect(c.category).toBe("missing");
    expect(c.severity).toBe("error");
  });

  it("serial khớp duy nhất → serial_dup/auto_safe", () => {
    const c = classifyItem(
      signals({ match: match({ kind: "serial_model_mfr", decision: "resolved", confidence: 1 }) }),
    );
    expect(c.category).toBe("serial_dup");
    expect(c.severity).toBe("auto_safe");
  });

  it("serial khớp nhiều bản ghi → serial_dup/needs_review", () => {
    const c = classifyItem(
      signals({ match: match({ kind: "serial_model_mfr", decision: "needs_review" }) }),
    );
    expect(c.category).toBe("serial_dup");
    expect(c.severity).toBe("needs_review");
  });

  it("tham chiếu không map được → fk_conflict/needs_review", () => {
    const c = classifyItem(signals({ unresolvedRefs: ["he_thong", "don_vi"] }));
    expect(c.category).toBe("fk_conflict");
    expect(c.severity).toBe("needs_review");
    expect(c.reason).toContain("he_thong");
  });

  it("tên gần giống (không guard) → possible_dup/needs_review", () => {
    const c = classifyItem(
      signals({
        match: match({ decision: "needs_review", kind: "near_name", reason: "Tên gần giống" }),
      }),
    );
    expect(c.category).toBe("possible_dup");
    expect(c.severity).toBe("needs_review");
  });

  it("danh mục guard gần trùng → near_catalog/needs_review", () => {
    const c = classifyItem(
      signals({
        isCatalogGuard: true,
        match: match({ decision: "needs_review", kind: "near_name" }),
      }),
    );
    expect(c.category).toBe("near_catalog");
    expect(c.severity).toBe("needs_review");
  });

  it("khớp ID chắc chắn → unprocessed/auto_safe (cập nhật)", () => {
    const c = classifyItem(
      signals({ match: match({ decision: "resolved", kind: "exact_id", confidence: 1 }) }),
    );
    expect(c.category).toBe("unprocessed");
    expect(c.severity).toBe("auto_safe");
    expect(c.reason).toContain("cập nhật");
  });

  it("không trùng → unprocessed/auto_safe (tạo mới)", () => {
    const c = classifyItem(signals({ match: match({ decision: "create", kind: "none" }) }));
    expect(c.category).toBe("unprocessed");
    expect(c.severity).toBe("auto_safe");
    expect(c.reason).toContain("tạo mới");
  });

  it("thiếu bắt buộc ưu tiên hơn xung đột FK", () => {
    const c = classifyItem(signals({ missingRequired: ["ten"], unresolvedRefs: ["he_thong"] }));
    expect(c.category).toBe("missing");
  });

  it("serial ưu tiên hơn FK conflict khi cùng xuất hiện", () => {
    const c = classifyItem(
      signals({
        unresolvedRefs: ["he_thong"],
        match: match({ kind: "serial_model_mfr", decision: "needs_review" }),
      }),
    );
    expect(c.category).toBe("serial_dup");
  });

  it("low_confidence needs_review (không guard) → possible_dup", () => {
    const c = classifyItem(
      signals({ match: match({ decision: "needs_review", kind: "low_confidence" }) }),
    );
    expect(c.category).toBe("possible_dup");
  });
});

describe("summarizeReview", () => {
  const items: Classification[] = [
    { category: "unprocessed", severity: "auto_safe", reason: "" },
    { category: "unprocessed", severity: "auto_safe", reason: "" },
    { category: "possible_dup", severity: "needs_review", reason: "" },
    { category: "serial_dup", severity: "needs_review", reason: "" },
    { category: "missing", severity: "error", reason: "" },
  ];

  it("đếm đúng auto/needs/error", () => {
    const m = summarizeReview(items);
    expect(m.total).toBe(5);
    expect(m.autoSafe).toBe(2);
    expect(m.needsReview).toBe(2);
    expect(m.errors).toBe(1);
  });

  it("tính đúng tỷ lệ auto-safe", () => {
    const m = summarizeReview(items);
    expect(m.autoSafeRate).toBe(0.4);
    expect(m.needsReviewRate).toBe(0.4);
    expect(m.errorRate).toBe(0.2);
  });

  it("đếm theo nhóm", () => {
    const m = summarizeReview(items);
    expect(m.byCategory.unprocessed).toBe(2);
    expect(m.byCategory.possible_dup).toBe(1);
    expect(m.byCategory.serial_dup).toBe(1);
    expect(m.byCategory.missing).toBe(1);
    expect(m.byCategory.near_catalog).toBe(0);
  });

  it("danh sách rỗng → tỷ lệ 0, không chia cho 0", () => {
    const m = summarizeReview([]);
    expect(m.total).toBe(0);
    expect(m.autoSafeRate).toBe(0);
  });
});
