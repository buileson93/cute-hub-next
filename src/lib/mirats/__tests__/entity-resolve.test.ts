import { describe, it, expect } from "vitest";
import {
  resolveEntity,
  similarity,
  levenshtein,
  type Candidate,
  type AliasEntry,
} from "@/lib/mirats/entity-resolve";

const dev = (over: Partial<Candidate>): Candidate => ({
  id: "id-0",
  ma: null,
  ten: null,
  ma_serial: null,
  model_id: null,
  nha_san_xuat_id: null,
  ...over,
});

const A = dev({
  id: "id-A",
  ma: "TB-001",
  ten: "Máy tính trạm bờ",
  ma_serial: "SN-100",
  model_id: "m1",
  nha_san_xuat_id: "nsx1",
});
const B = dev({
  id: "id-B",
  ma: "TB-002",
  ten: "Switch mạng lõi",
  ma_serial: "SN-200",
  model_id: "m2",
  nha_san_xuat_id: "nsx2",
});
const C = dev({
  id: "id-C",
  ma: "TB-003",
  ten: "Máy tính trạm bờ 2",
  ma_serial: "SN-300",
  model_id: "m1",
  nha_san_xuat_id: "nsx1",
});
const ALL = [A, B, C];

describe("similarity/levenshtein", () => {
  it("giống hệt = 1, khác hẳn thấp", () => {
    expect(similarity("switch", "switch")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(similarity("switch", "swithc")).toBeGreaterThan(0.6);
    expect(similarity("bỏ dấu", "bo dau")).toBe(1); // chuẩn hoá không dấu
  });
});

describe("resolveEntity — exact", () => {
  it("khớp ID duy nhất → resolved", () => {
    const r = resolveEntity({ id: "id-B" }, ALL, [], { entity: "thiet_bi" });
    expect(r.decision).toBe("resolved");
    expect(r.kind).toBe("exact_id");
    expect(r.candidate?.id).toBe("id-B");
  });

  it("khớp mã duy nhất → resolved", () => {
    const r = resolveEntity({ ma: "TB-002" }, ALL, [], { entity: "thiet_bi" });
    expect(r.decision).toBe("resolved");
    expect(r.kind).toBe("exact_code");
    expect(r.candidate?.id).toBe("id-B");
  });

  it("khớp serial+model+NSX duy nhất → resolved", () => {
    const r = resolveEntity(
      { ma_serial: "SN-100", model_id: "m1", nha_san_xuat_id: "nsx1" },
      ALL,
      [],
      { entity: "thiet_bi" },
    );
    expect(r.decision).toBe("resolved");
    expect(r.kind).toBe("serial_model_mfr");
    expect(r.candidate?.id).toBe("id-A");
  });
});

describe("resolveEntity — possible duplicate luôn needs_review, không tự merge", () => {
  it("mã trùng ở nhiều bản ghi → needs_review", () => {
    const dup = [
      dev({ id: "d1", ma: "TB-DUP", ten: "X" }),
      dev({ id: "d2", ma: "TB-DUP", ten: "Y" }),
    ];
    const r = resolveEntity({ ma: "TB-DUP" }, dup, [], { entity: "thiet_bi" });
    expect(r.decision).toBe("needs_review");
    expect(r.candidates).toHaveLength(2);
  });

  it("serial trùng nhưng thiếu model/NSX → needs_review (không chắc chắn)", () => {
    const r = resolveEntity({ ma_serial: "SN-200" }, ALL, [], { entity: "thiet_bi" });
    expect(r.decision).toBe("needs_review");
    expect(r.kind).toBe("serial_model_mfr");
    expect(r.candidate?.id).toBe("id-B");
  });
});

describe("resolveEntity — alias", () => {
  it("alias đã xác nhận → resolved trỏ bản ghi chuẩn", () => {
    const aliases: AliasEntry[] = [
      { alias: "may tram bo", canonical_id: "id-A", entity: "thiet_bi", scope: null },
    ];
    const r = resolveEntity({ ten: "Máy trạm bờ" }, ALL, aliases, { entity: "thiet_bi" });
    expect(r.decision).toBe("resolved");
    expect(r.kind).toBe("alias");
    expect(r.candidate?.id).toBe("id-A");
  });

  it("alias khác entity → bỏ qua", () => {
    const aliases: AliasEntry[] = [
      { alias: "may tram bo", canonical_id: "id-A", entity: "dm_he_thong", scope: null },
    ];
    const r = resolveEntity({ ten: "Máy trạm bờ" }, ALL, aliases, { entity: "thiet_bi" });
    expect(r.kind).not.toBe("alias");
  });
});

describe("resolveEntity — tên gần giống & low-confidence", () => {
  it("tên gần giống → needs_review, không tự merge", () => {
    const r = resolveEntity({ ten: "Switch mang loi" }, ALL, [], { entity: "thiet_bi" });
    expect(r.decision).toBe("needs_review");
    expect(r.kind).toBe("near_name");
    expect(r.candidate?.id).toBe("id-B");
    expect(r.confidence).toBeGreaterThan(0.82);
  });

  it("nhiều tên gần giống → needs_review, candidate=null (nhiều ứng viên)", () => {
    const r = resolveEntity({ ten: "Máy tính trạm bờ" }, ALL, [], {
      entity: "thiet_bi",
      nearThreshold: 0.7,
    });
    expect(r.decision).toBe("needs_review");
    expect(r.candidates.length).toBeGreaterThanOrEqual(2);
    expect(r.candidate).toBeNull();
  });

  it("độ tin cậy thấp → needs_review", () => {
    const r = resolveEntity({ ten: "May tinh tram" }, ALL, [], {
      entity: "thiet_bi",
      nearThreshold: 0.95,
      lowThreshold: 0.4,
    });
    expect(r.decision).toBe("needs_review");
    expect(r.kind).toBe("low_confidence");
  });
});

describe("resolveEntity — không tự tạo danh mục quan trọng từ typo", () => {
  it("guard + không ứng viên → needs_review (không create)", () => {
    const r = resolveEntity({ ten: "Nhóm hoàn toàn mới" }, [], [], {
      entity: "dm_nhom_he_thong",
      guard: true,
    });
    expect(r.decision).toBe("needs_review");
    expect(r.kind).toBe("none");
  });

  it("không guard + không ứng viên → create", () => {
    const r = resolveEntity({ ten: "Tài sản mới toanh" }, [], [], { entity: "thiet_bi" });
    expect(r.decision).toBe("create");
  });

  it("guard + có typo gần giống → needs_review (không tự tạo)", () => {
    const cats = [dev({ id: "g1", ten: "Nhóm định vị" })];
    const r = resolveEntity({ ten: "Nhom dinh vi" }, cats, [], {
      entity: "dm_nhom_he_thong",
      guard: true,
    });
    expect(r.decision).toBe("needs_review");
  });
});
