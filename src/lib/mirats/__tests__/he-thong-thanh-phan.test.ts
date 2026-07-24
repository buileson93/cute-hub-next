// Test mô hình 3 lớp: cấu hình import vị trí chức năng (KHÔNG serial) + lọc
// điều kiện gán tài sản (đúng loại + đang rảnh).
import { describe, it, expect } from "vitest";
import { entityById, fieldKeySet } from "@/lib/mirats/import-config";
import { filterEligibleDevices } from "@/lib/mirats/he-thong-thanh-phan";

describe("Import mẫu vị trí chức năng (he_thong_thanh_phan)", () => {
  const ent = entityById("he_thong_thanh_phan");
  const keys = fieldKeySet(ent);

  it("khóa upsert theo mã thành phần + có liên kết hệ thống", () => {
    expect(ent.naturalKey).toBe("ma_thanh_phan");
    expect(keys.has("he_thong")).toBe(true);
  });

  it("mẫu KHÔNG chứa cột serial/tài sản cụ thể", () => {
    for (const forbidden of ["ma_serial", "serial", "thiet_bi", "ma_thiet_bi"]) {
      expect(keys.has(forbidden), `Không được có cột "${forbidden}"`).toBe(false);
    }
  });

  it("có các cột vòng đời của vị trí: trạng thái + hiệu lực", () => {
    expect(keys.has("trang_thai")).toBe(true);
    expect(keys.has("hieu_luc_tu")).toBe(true);
    expect(keys.has("hieu_luc_den")).toBe(true);
  });
});

describe("Lọc tài sản đủ điều kiện gán (eligibility)", () => {
  const ranh = [
    { id: "a", loai_thiet_bi_id: "cam-bien" },
    { id: "b", loai_thiet_bi_id: "nguon" },
    { id: "c", loai_thiet_bi_id: null },
  ];

  it("vị trí yêu cầu loại -> chỉ giữ tài sản đúng loại", () => {
    const r = filterEligibleDevices(ranh, "cam-bien");
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });

  it("vị trí không ràng buộc loại -> giữ tất cả tài sản rảnh", () => {
    const r = filterEligibleDevices(ranh, null);
    expect(r.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("không có tài sản đúng loại -> danh sách rỗng (không đề xuất sai loại)", () => {
    const r = filterEligibleDevices(ranh, "chong-set");
    expect(r).toEqual([]);
  });
});
