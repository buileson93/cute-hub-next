import { describe, it, expect } from "vitest";
import {
  normalizeName,
  levenshtein,
  findNearDuplicates,
  validateRequired,
  REQUIRED_SCHEMAS,
  MERGE_REF_MAP,
  MERGEABLE_ENTITIES,
  isMergeableEntity,
} from "@/lib/mirats/danh-muc-quality";

describe("normalizeName", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(normalizeName("Đài Kiểm Soát")).toBe("dai kiem soat");
  });
  it("thay đ/Đ → d", () => {
    expect(normalizeName("đường Đông")).toBe("duong dong");
  });
  it("gộp ký tự đặc biệt về khoảng trắng và trim", () => {
    expect(normalizeName(" Hệ  thống VHF (118.8 MHz) ")).toBe("he thong vhf 118 8 mhz");
  });
  it("AWOS-II tách đúng", () => {
    expect(normalizeName("AWOS-II")).toBe("awos ii");
  });
  it("idempotent", () => {
    const once = normalizeName("Đài Kiểm Soát VHF-118.8");
    expect(normalizeName(once)).toBe(once);
  });
  it("null / undefined / rỗng", () => {
    expect(normalizeName(null)).toBe("");
    expect(normalizeName(undefined)).toBe("");
    expect(normalizeName("")).toBe("");
    expect(normalizeName("   ")).toBe("");
  });
});

describe("levenshtein", () => {
  it("distance cơ bản", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
    expect(levenshtein("", "abc")).toBe(3);
  });
});

describe("findNearDuplicates", () => {
  const list = [
    { id: "1", ten: "Đài Kiểm Soát Phù Cát" },
    { id: "2", ten: "dai kiem soat phu cat" },
    { id: "3", ten: "Đài Kiểm Soát" },
    { id: "4", ten: "VHF 118.8", active: true },
    { id: "5", ten: "VHF 119.1", active: true },
    { id: "6", ten: "Cũ không dùng", active: false },
  ];

  it("phát hiện exact-normalized", () => {
    const hits = findNearDuplicates(list, "Đài Kiểm Soát Phù Cát");
    expect(hits[0].reason).toBe("exact-normalized");
    const ids = hits.map(h => h.id);
    expect(ids).toContain("1");
    expect(ids).toContain("2");
  });

  it("phát hiện contains", () => {
    const hits = findNearDuplicates(list, "Đài Kiểm Soát Phù Cát Mở Rộng");
    // "dai kiem soat phu cat" nằm trong target → contains
    expect(hits.some(h => h.reason === "contains")).toBe(true);
  });

  it("phát hiện levenshtein dưới ngưỡng distance ≤ 3", () => {
    const hits = findNearDuplicates([{ id: "x", ten: "AWOS II" }], "AWOS 2");
    // "awos ii" vs "awos 2" → dist=2, sim ≈ 0.71 dưới 0.86 → không bắt được
    expect(hits).toEqual([]);
  });

  it("tôn trọng threshold levenshtein", () => {
    // "radar" vs "rader" — dist=1, sim=0.8 → dưới 0.86 default không match,
    // nhưng khi threshold=0.7 thì match qua levenshtein (không phải substring)
    const items = [{ id: "x", ten: "rader" }];
    expect(findNearDuplicates(items, "radar")).toEqual([]);
    const hits = findNearDuplicates(items, "radar", { threshold: 0.7 });
    expect(hits.length).toBe(1);
    expect(hits[0].reason).toBe("levenshtein");
  });

  it("không bắt VHF 118 với VHF 119 (dist=1 nhưng số khác)", () => {
    const hits = findNearDuplicates(list, "VHF 118.8");
    // Chỉ match chính nó (exact); không match 119.1
    expect(hits.some(h => h.id === "5")).toBe(false);
  });

  it("bỏ qua active=false trừ khi includeInactive", () => {
    const noInactive = findNearDuplicates(list, "cu khong dung");
    expect(noInactive.length).toBe(0);
    const withInactive = findNearDuplicates(list, "cu khong dung", { includeInactive: true });
    expect(withInactive.length).toBeGreaterThan(0);
  });

  it("scope theo nha_san_xuat_id (dm_model)", () => {
    const models = [
      { id: "m1", ten: "R100", nha_san_xuat_id: "A" },
      { id: "m2", ten: "R100", nha_san_xuat_id: "B" },
    ];
    const hits = findNearDuplicates(models, "R100", { scopeNhaSanXuatId: "A" });
    expect(hits.map(h => h.id)).toEqual(["m1"]);
  });

  it("limit top N", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: String(i), ten: "same" }));
    const hits = findNearDuplicates(many, "same", { limit: 3 });
    expect(hits.length).toBe(3);
  });

  it("chuỗi rỗng → mảng rỗng", () => {
    expect(findNearDuplicates(list, "")).toEqual([]);
  });
});

describe("validateRequired", () => {
  const schema = REQUIRED_SCHEMAS.dm_he_thong;

  it("đủ trường → ok", () => {
    const res = validateRequired(
      {
        ma: "HT1",
        ten: "Hệ thống",
        nhom_he_thong_id: "550e8400-e29b-41d4-a716-446655440000",
        don_vi_id: "550e8400-e29b-41d4-a716-446655440001",
      },
      schema,
    );
    expect(res.ok).toBe(true);
    expect(res.missing).toEqual([]);
  });

  it("thiếu trường → missing", () => {
    const res = validateRequired({ ma: "HT1", ten: "" }, schema);
    expect(res.ok).toBe(false);
    expect(res.missing.map(m => m.field).sort()).toEqual([
      "don_vi_id",
      "nhom_he_thong_id",
      "ten",
    ]);
  });

  it("uuid không hợp lệ → missing", () => {
    const res = validateRequired(
      { ma: "X", ten: "Y", nhom_he_thong_id: "not-uuid", don_vi_id: "also-bad" },
      schema,
    );
    expect(res.ok).toBe(false);
    expect(res.missing.map(m => m.field).sort()).toEqual(["don_vi_id", "nhom_he_thong_id"]);
  });

  it("chuỗi toàn khoảng trắng bị coi là rỗng", () => {
    const res = validateRequired({ ma: "  ", ten: "x" }, REQUIRED_SCHEMAS.dm_don_vi);
    expect(res.ok).toBe(false);
    expect(res.missing[0].field).toBe("ma");
  });
});

describe("MERGE_REF_MAP", () => {
  it("có mọi entity trong scope §1", () => {
    const expected = [
      "dm_don_vi",
      "dm_vi_tri",
      "dm_loai_thiet_bi",
      "dm_nha_san_xuat",
      "dm_nha_cung_cap",
      "dm_model",
      "dm_nhom_he_thong",
      "dm_he_thong",
      "dm_phan_loai",
      "dm_dac_tinh",
      "dm_noi_cap",
      "dm_loai_giay_phep",
      "dm_loai_lien_ket",
      "dm_trang_thai_thiet_bi",
      "dm_danh_gia_nien_han",
      "dm_to_chuc",
    ];
    for (const e of expected) {
      expect(MERGEABLE_ENTITIES).toContain(e);
      expect(Array.isArray(MERGE_REF_MAP[e])).toBe(true);
    }
  });

  it("mọi ref có table và column non-empty", () => {
    for (const refs of Object.values(MERGE_REF_MAP)) {
      for (const r of refs) {
        expect(r.table).toBeTruthy();
        expect(r.column).toBeTruthy();
      }
    }
  });

  it("isMergeableEntity", () => {
    expect(isMergeableEntity("dm_don_vi")).toBe(true);
    expect(isMergeableEntity("thiet_bi")).toBe(false);
  });
});
