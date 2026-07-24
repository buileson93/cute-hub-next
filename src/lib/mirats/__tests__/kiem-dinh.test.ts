import { describe, it, expect } from "vitest";
import {
  validateChungChi,
  trangThaiHetHan,
  chungChiMoiNhat,
  type ChungChi,
} from "../kiem-dinh";

describe("validateChungChi", () => {
  const ok: ChungChi = {
    thiet_bi_id: "tb-1",
    loai: "KIEM_DINH",
    so_giay_chung_nhan: "KD-001",
    ngay_bat_dau: "2026-01-01",
    ngay_het_han: "2027-01-01",
  };

  it("hợp lệ khi đủ trường", () => {
    expect(validateChungChi(ok).hopLe).toBe(true);
  });

  it("thiếu thiet_bi_id", () => {
    const r = validateChungChi({ ...ok, thiet_bi_id: "" });
    expect(r.hopLe).toBe(false);
    expect(r.loi.join("|")).toMatch(/thiet_bi_id/);
  });

  it("loai không hợp lệ", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = validateChungChi({ ...ok, loai: "XYZ" as any });
    expect(r.hopLe).toBe(false);
  });

  it("thiếu số giấy chứng nhận", () => {
    const r = validateChungChi({ ...ok, so_giay_chung_nhan: "  " });
    expect(r.hopLe).toBe(false);
  });

  it("bat_dau > het_han → lỗi", () => {
    const r = validateChungChi({ ...ok, ngay_bat_dau: "2027-06-01", ngay_het_han: "2027-01-01" });
    expect(r.hopLe).toBe(false);
  });
});

describe("trangThaiHetHan", () => {
  it("còn 25 ngày → nguong=30, chưa hết hạn", () => {
    const r = trangThaiHetHan("2026-08-09", "2026-07-15");
    expect(r.soNgay).toBe(25);
    expect(r.nguong).toBe(30);
    expect(r.daHetHan).toBe(false);
  });

  it("còn 45 ngày → nguong=60", () => {
    const r = trangThaiHetHan("2026-08-29", "2026-07-15");
    expect(r.nguong).toBe(60);
  });

  it("quá hạn → daHetHan=true, soNgay<0", () => {
    const r = trangThaiHetHan("2026-07-10", "2026-07-15");
    expect(r.daHetHan).toBe(true);
    expect(r.soNgay!).toBeLessThan(0);
  });

  it("null → soNgay=null, nguong=null", () => {
    const r = trangThaiHetHan(null);
    expect(r.soNgay).toBeNull();
    expect(r.nguong).toBeNull();
    expect(r.daHetHan).toBe(false);
  });
});

describe("chungChiMoiNhat", () => {
  const mk = (id: string, het: string | null, bd: string | null = null): ChungChi => ({
    id,
    thiet_bi_id: "tb-1",
    loai: "KIEM_DINH",
    so_giay_chung_nhan: id,
    ngay_bat_dau: bd,
    ngay_het_han: het,
  });

  it("chọn theo ngay_het_han mới nhất", () => {
    const r = chungChiMoiNhat([
      mk("A", "2026-01-01"),
      mk("B", "2027-06-01"),
      mk("C", "2026-12-31"),
    ]);
    expect(r?.id).toBe("B");
  });

  it("rơi về ngay_bat_dau khi thiếu het_han", () => {
    const r = chungChiMoiNhat([mk("A", null, "2025-01-01"), mk("B", null, "2026-05-01")]);
    expect(r?.id).toBe("B");
  });

  it("mảng rỗng → null", () => {
    expect(chungChiMoiNhat([])).toBeNull();
  });
});
