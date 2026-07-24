// Test logic thuần mẫu hình "khe ↔ đơn vị vật lý ↔ gán theo thời gian",
// dùng chung cho tầng 1 (tài sản) và tầng 2 (linh kiện).
import { describe, it, expect } from "vitest";
import {
  LY_DO_GAN,
  filterEligibleUnits,
  canLap,
  canThao,
  canThayThe,
  canDieuChuyen,
  canNgungKhe,
} from "@/lib/mirats/khe-gan";

describe("Lý do gán khớp CHECK constraint CSDL", () => {
  it("đúng và đủ 4 lý do", () => {
    expect([...LY_DO_GAN]).toEqual(["lắp mới", "thay do hỏng", "điều chuyển", "tháo"]);
  });
});

describe("filterEligibleUnits (đủ điều kiện gán)", () => {
  const ranh = [
    { id: "a", loai_thiet_bi_id: "cam-bien" },
    { id: "b", loai_thiet_bi_id: "nguon" },
    { id: "c", loai_thiet_bi_id: null },
  ];

  it("khe yêu cầu loại -> chỉ giữ đơn vị đúng loại", () => {
    expect(filterEligibleUnits(ranh, "cam-bien").map((x) => x.id)).toEqual(["a"]);
  });
  it("khe không ràng buộc -> giữ tất cả", () => {
    expect(filterEligibleUnits(ranh, null).map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("không có đơn vị đúng loại -> rỗng, không đề xuất sai loại", () => {
    expect(filterEligibleUnits(ranh, "chong-set")).toEqual([]);
  });
});

describe("canLap", () => {
  it("cho phép khi khe hoạt động, trống và đơn vị rảnh", () => {
    expect(canLap({ kheTrangThai: "hoat_dong", kheDangCoDonVi: false, donViDangBanO: false }).ok).toBe(true);
  });
  it("chặn khi khe đã ngừng", () => {
    const r = canLap({ kheTrangThai: "ngung", kheDangCoDonVi: false, donViDangBanO: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("ngừng");
  });
  it("chặn khi khe đang có -> gợi ý Thay thế/Điều chuyển", () => {
    const r = canLap({ kheTrangThai: "hoat_dong", kheDangCoDonVi: true, donViDangBanO: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Thay thế|Điều chuyển/);
  });
  it("chặn khi đơn vị đang bận ở khe khác", () => {
    expect(canLap({ kheTrangThai: "hoat_dong", kheDangCoDonVi: false, donViDangBanO: true }).ok).toBe(false);
  });
});

describe("canThao", () => {
  it("cho phép khi khe đang có", () => {
    expect(canThao({ kheDangCoDonVi: true }).ok).toBe(true);
  });
  it("chặn khi khe trống", () => {
    expect(canThao({ kheDangCoDonVi: false }).ok).toBe(false);
  });
});

describe("canThayThe", () => {
  it("cho phép khi khe hoạt động và đơn vị mới rảnh", () => {
    expect(canThayThe({ kheTrangThai: "hoat_dong", donViMoiDangBanO: false }).ok).toBe(true);
  });
  it("chặn khi khe đã ngừng", () => {
    expect(canThayThe({ kheTrangThai: "ngung", donViMoiDangBanO: false }).ok).toBe(false);
  });
  it("chặn khi đơn vị mới đang bận", () => {
    expect(canThayThe({ kheTrangThai: "hoat_dong", donViMoiDangBanO: true }).ok).toBe(false);
  });
});

describe("canDieuChuyen", () => {
  it("cho phép khi khe đích hoạt động và trống", () => {
    expect(canDieuChuyen({ kheDichTrangThai: "hoat_dong", kheDichDangCoDonVi: false }).ok).toBe(true);
  });
  it("chặn khi khe đích đã ngừng", () => {
    expect(canDieuChuyen({ kheDichTrangThai: "ngung", kheDichDangCoDonVi: false }).ok).toBe(false);
  });
  it("chặn khi khe đích đang có -> gợi ý Thay thế", () => {
    const r = canDieuChuyen({ kheDichTrangThai: "hoat_dong", kheDichDangCoDonVi: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Thay thế");
  });
});

describe("canNgungKhe", () => {
  it("cho phép khi khe rỗng", () => {
    expect(canNgungKhe({ kheDangCoDonVi: false }).ok).toBe(true);
  });
  it("chặn khi khe còn đơn vị đang gán", () => {
    expect(canNgungKhe({ kheDangCoDonVi: true }).ok).toBe(false);
  });
});
