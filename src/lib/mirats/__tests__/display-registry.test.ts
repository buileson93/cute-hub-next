import { describe, it, expect } from "vitest";
import {
  entityView, entityLoaiList, renderField, soNgayDenHan,
} from "@/lib/mirats/display/registry";
import type { EntityLoai } from "@/lib/mirats/display/types";
import { KHONG_CO } from "@/lib/mirats/format";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";

describe("display registry — entityView", () => {
  const ALL: EntityLoai[] = [
    "thiet_bi", "su_co", "van_de", "cong_viec",
    "hong_hoc", "ban_giao", "giay_phep", "vat_tu",
  ];

  it("có đủ 8 thực thể chính", () => {
    for (const l of ALL) expect(entityLoaiList()).toContain(l);
  });

  it("mỗi thực thể có tieuDe + ≥2 field highlight", () => {
    for (const l of ALL) {
      const v = entityView(l);
      expect(typeof v.tieuDe).toBe("function");
      expect(v.highlight.length).toBeGreaterThanOrEqual(2);
      expect(v.chiTiet.length).toBeGreaterThan(v.highlight.length - 1);
    }
  });

  it("badgeTrangThai đúng domain cho các thực thể có trạng thái theo trang-thai.ts", () => {
    expect(entityView("su_co").badgeTrangThai).toEqual({ domain: "su_co", key: "trang_thai" });
    expect(entityView("van_de").badgeTrangThai?.domain).toBe("van_de");
    expect(entityView("cong_viec").badgeTrangThai?.domain).toBe("cong_viec");
    expect(entityView("hong_hoc").badgeTrangThai?.domain).toBe("hong_hoc");
    expect(entityView("ban_giao").badgeTrangThai?.domain).toBe("ban_giao");
    // thiet_bi / giay_phep / vat_tu không có domain trong trang-thai.ts
    expect(entityView("thiet_bi").badgeTrangThai).toBeUndefined();
    expect(entityView("giay_phep").badgeTrangThai).toBeUndefined();
  });

  it("mọi field 'status' đều khai domain phù hợp", () => {
    for (const l of entityLoaiList()) {
      const v = entityView(l);
      for (const f of [...v.highlight, ...v.chiTiet]) {
        if (f.loai === "status") expect(f.domain).toBeTruthy();
      }
    }
  });

  it("tieuDe của thiet_bi lấy ten_thiet_bi", () => {
    expect(entityView("thiet_bi").tieuDe({ ten_thiet_bi: "Máy UHF #1", ma_thiet_bi: "TB_ABC" }))
      .toBe("Máy UHF #1");
  });
});

describe("display registry — renderField", () => {
  it("date → fmtNgay", () => {
    const r = renderField(
      { key: "ngay_mua", nhan: "Ngày mua", loai: "date" },
      { ngay_mua: "2024-03-15" },
    );
    expect(r.giaTri).toBe("15/03/2024");
  });

  it("vnd → fmtVND", () => {
    const r = renderField(
      { key: "chi_phi", nhan: "Chi phí", loai: "vnd" },
      { chi_phi: 2_500_000 },
    );
    expect(r.giaTri).toContain("triệu");
  });

  it("so → nhóm nghìn locale vi-VN", () => {
    const r = renderField(
      { key: "muc_ton_toi_thieu", nhan: "Tồn", loai: "so" },
      { muc_ton_toi_thieu: 1234567 },
    );
    expect(r.giaTri.replace(/\s/g, "")).toBe("1.234.567");
  });

  it("status → labelOf theo domain", () => {
    const r = renderField(
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "su_co" },
      { trang_thai: "Mới" },
    );
    expect(r.giaTri).toBe("Mới");
    const r2 = renderField(
      { key: "trang_thai", nhan: "Trạng thái", loai: "status", domain: "cong_viec" },
      { trang_thai: "DANG_LAM" },
    );
    expect(r2.giaTri).toBe("Đang làm");
  });

  it("text rỗng → placeholder KHONG_CO", () => {
    const r = renderField(
      { key: "ghi_chu", nhan: "Ghi chú", loai: "text" },
      { ghi_chu: null },
    );
    expect(r.giaTri).toBe(KHONG_CO);
  });

  it("expiring < ngưỡng → highlight = true + số ngày âm khi quá hạn", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 20); // <30 ngày → cảnh báo đỏ
    const r = renderField(
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring" },
      { ngay_het_han: soon.toISOString().slice(0, 10) },
    );
    expect(r.highlight).toBe(true);
    expect(r.soNgay).toBe(20);

    const past = new Date();
    past.setDate(past.getDate() - 5);
    const r2 = renderField(
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring" },
      { ngay_het_han: past.toISOString().slice(0, 10) },
    );
    expect(r2.soNgay).toBe(-5);
    expect(r2.highlight).toBe(true);
    expect(r2.giaTri).toMatch(/Quá hạn/);
  });

  it("expiring xa hơn ngưỡng lớn nhất → không highlight (khi field không highlight sẵn)", () => {
    const far = new Date();
    far.setDate(far.getDate() + DEFAULT_NGAY_SAP_HET_HAN + 60);
    const r = renderField(
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring" },
      { ngay_het_han: far.toISOString().slice(0, 10) },
    );
    expect(r.highlight).toBe(false);
  });

  it("expiring rỗng → soNgay = null, giaTri = KHONG_CO", () => {
    const r = renderField(
      { key: "ngay_het_han", nhan: "Hết hạn", loai: "expiring" },
      { ngay_het_han: null },
    );
    expect(r.soNgay).toBeNull();
    expect(r.giaTri).toBe(KHONG_CO);
  });

  it("soNgayDenHan xử lý ISO / Date / rỗng đúng", () => {
    expect(soNgayDenHan(null)).toBeNull();
    expect(soNgayDenHan("")).toBeNull();
    expect(soNgayDenHan("khong hop le")).toBeNull();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(soNgayDenHan(today.toISOString())).toBe(0);
  });
});

describe("Task 53 — hover/drawer/header dùng chung display/registry", () => {
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  const { resolve } = require("node:path") as typeof import("node:path");
  const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

  it("EntityHoverCard import entityView + renderField từ registry", () => {
    const src = read("src/components/mirats/EntityHoverCard.tsx");
    expect(src).toMatch(/from ["']@\/lib\/mirats\/display\/registry["']/);
    expect(src).toMatch(/entityView/);
    expect(src).toMatch(/renderField/);
  });

  it("DetailDrawer import entityView + renderField từ registry", () => {
    const src = read("src/components/mirats/DetailDrawer.tsx");
    expect(src).toMatch(/from ["']@\/lib\/mirats\/display\/registry["']/);
    expect(src).toMatch(/entityView/);
    expect(src).toMatch(/renderField/);
  });

  it("su-co detail dùng VatTuTieuHaoView + VatTuTieuHaoInline liên kết bằng lien_ket_su_co_id/suCoId", () => {
    const src = read("src/routes/_app.su-co.$maSuCo.tsx");
    expect(src).toMatch(/VatTuTieuHaoView/);
    expect(src).toMatch(/lien_ket_su_co_id/);
    expect(src).toMatch(/VatTuTieuHaoInline/);
    expect(src).toMatch(/suCoId/);
  });
});
