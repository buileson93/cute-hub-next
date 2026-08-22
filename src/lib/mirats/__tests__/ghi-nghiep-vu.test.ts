import { describe, it, expect } from "vitest";
import { validateKhai, previewKhai, type KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";

const NOW = new Date("2026-07-14T10:00:00Z");

const base = (o: Partial<KhaiNghiepVuInput> = {}): KhaiNghiepVuInput => ({
  loai: "SU_CO",
  thiet_bi_id: "TB_ABC12345",
  moTa: "Mất tín hiệu",
  thoiGian: "2026-07-14T09:00:00Z",
  ...o,
});

describe("validateKhai", () => {
  it("thiếu thiet_bi_id → lỗi", () => {
    const kq = validateKhai(base({ thiet_bi_id: "" }), NOW);
    expect(kq.hopLe).toBe(false);
    expect(kq.loi.join(" ")).toMatch(/thiet_bi_id/);
  });

  it("thời gian ở tương lai → lỗi", () => {
    const kq = validateKhai(base({ thoiGian: "2027-01-01T00:00:00Z" }), NOW);
    expect(kq.hopLe).toBe(false);
    expect(kq.loi.join(" ")).toMatch(/tương lai/);
  });

  it("vật tư số lượng ≤ 0 → lỗi", () => {
    const kq = validateKhai(
      base({ vatTuTieuHao: [{ vat_tu_id: "V1", kho_id: "K1", so_luong: 0 }] }),
      NOW,
    );
    expect(kq.hopLe).toBe(false);
    expect(kq.loi.join(" ")).toMatch(/số lượng/i);
  });

  it("tài sản thanh lý → cảnh báo (không chặn)", () => {
    const kq = validateKhai(base({ trangThaiThietBi: "THANH_LY" }), NOW);
    expect(kq.hopLe).toBe(true);
    expect(kq.canhBao.join(" ")).toMatch(/thanh lý/i);
  });

  it("input hợp lệ → hopLe=true, không lỗi", () => {
    const kq = validateKhai(base(), NOW);
    expect(kq.hopLe).toBe(true);
    expect(kq.loi).toEqual([]);
  });

  it("thiếu vat_tu_id / kho_id → lỗi", () => {
    const kq = validateKhai(
      base({ vatTuTieuHao: [{ vat_tu_id: "", kho_id: "", so_luong: 2 }] }),
      NOW,
    );
    expect(kq.hopLe).toBe(false);
    expect(kq.loi.some((x) => x.includes("vat_tu_id"))).toBe(true);
    expect(kq.loi.some((x) => x.includes("kho_id"))).toBe(true);
  });
});

describe("previewKhai", () => {
  it("liệt kê tạo bản ghi + xuất kho khi có vật tư tiêu hao", () => {
    const kq = previewKhai(
      base({
        loai: "BAO_DUONG",
        vatTuTieuHao: [{ vat_tu_id: "VT_1", kho_id: "K_1", so_luong: 3, ten_vat_tu: "Bóng đèn" }],
      }),
    );
    expect(kq.tomTat).toMatch(/Bảo dưỡng/);
    expect(kq.sePhatSinh.some((x) => x.includes("bao_tri"))).toBe(true);
    expect(kq.sePhatSinh.some((x) => /Xuất kho 3/.test(x))).toBe(true);
  });

  it("hỏng hóc không có vật tư → chỉ tạo bản ghi + audit", () => {
    const kq = previewKhai(base({ loai: "HONG_HOC" }));
    expect(kq.sePhatSinh.some((x) => x.includes("hong_hoc"))).toBe(true);
    expect(kq.sePhatSinh.some((x) => /Xuất kho/.test(x))).toBe(false);
    expect(kq.sePhatSinh.some((x) => x.includes("audit_log"))).toBe(true);
  });
});
