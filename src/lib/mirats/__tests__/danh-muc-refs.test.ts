import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { countRefs, type ThietBiRefSubset } from "../danh-muc-refs";

const tb: ThietBiRefSubset[] = [
  { nha_san_xuat_id: "nsx-A", loai_thiet_bi_id: "loai-1", model_id: "m1", nha_cung_cap_id: null },
  { nha_san_xuat_id: "nsx-A", loai_thiet_bi_id: "loai-2", model_id: "m1", nha_cung_cap_id: "ncc-X" },
  { nha_san_xuat_id: "nsx-B", loai_thiet_bi_id: "loai-1", model_id: "m2", nha_cung_cap_id: "ncc-X" },
  { nha_san_xuat_id: null,    loai_thiet_bi_id: null,     model_id: null, nha_cung_cap_id: null },
];

describe("countRefs", () => {
  it("đếm nsx đúng", () => {
    expect(countRefs("nsx-A", tb, "nha_san_xuat_id")).toBe(2);
    expect(countRefs("nsx-B", tb, "nha_san_xuat_id")).toBe(1);
  });
  it("đếm ncc đúng, bỏ qua null", () => {
    expect(countRefs("ncc-X", tb, "nha_cung_cap_id")).toBe(2);
  });
  it("đếm loại đúng", () => {
    expect(countRefs("loai-1", tb, "loai_thiet_bi_id")).toBe(2);
    expect(countRefs("loai-2", tb, "loai_thiet_bi_id")).toBe(1);
  });
  it("đếm model đúng", () => {
    expect(countRefs("m1", tb, "model_id")).toBe(2);
    expect(countRefs("m2", tb, "model_id")).toBe(1);
  });
  it("id không tham chiếu → 0", () => {
    expect(countRefs("khong-ton-tai", tb, "nha_san_xuat_id")).toBe(0);
  });
  it("id rỗng → 0 (không match null)", () => {
    expect(countRefs("", tb, "nha_san_xuat_id")).toBe(0);
  });
});

// P10.4 — mở rộng: FK guard trên CSDL
describe("FK guard danh mục ↔ thiet_bi (migration)", () => {
  const dirs = [
    path.resolve(__dirname, "../../../../supabase/migrations"),
    path.resolve(__dirname, "../../../../supabase/dump"),
  ];
  const sql = dirs
    .flatMap((d) =>
      fs.existsSync(d)
        ? fs.readdirSync(d).filter((f) => f.endsWith(".sql")).map((f) => path.join(d, f))
        : [],
    )
    .map((p) => fs.readFileSync(p, "utf8"))
    .join("\n");

  it("thiet_bi.nha_san_xuat_id là FK RESTRICT tới dm_nha_san_xuat", () => {
    expect(sql).toMatch(
      /thiet_bi_nha_san_xuat_id_fkey[\s\S]*REFERENCES public\.dm_nha_san_xuat\(id\) ON DELETE RESTRICT/,
    );
  });
  it("thiet_bi.nha_cung_cap_id là FK RESTRICT tới dm_nha_cung_cap", () => {
    expect(sql).toMatch(
      /thiet_bi_nha_cung_cap_id_fkey[\s\S]*REFERENCES public\.dm_nha_cung_cap\(id\) ON DELETE RESTRICT/,
    );
  });
  it("thiet_bi.loai_thiet_bi_id là FK RESTRICT tới dm_loai_thiet_bi", () => {
    expect(sql).toMatch(
      /thiet_bi_loai_thiet_bi_id_fkey[\s\S]*REFERENCES public\.dm_loai_thiet_bi\(id\) ON DELETE RESTRICT/,
    );
  });

  it("RPC dm_xoa_an_toan hỗ trợ đủ 6 bảng danh mục (nsx, ncc, loai, model, don_vi, vi_tri)", () => {
    // Định nghĩa mới nhất phải chứa CASE-branch cho từng bảng.
    for (const bang of [
      "dm_nha_san_xuat",
      "dm_nha_cung_cap",
      "dm_loai_thiet_bi",
      "dm_model",
      "dm_don_vi",
      "dm_vi_tri",
    ]) {
      expect(sql).toMatch(new RegExp(`WHEN\\s+'${bang}'`));
    }
  });

  it("dm_xoa_an_toan chặn thêm với dm_don_vi khi còn dm_he_thong trực thuộc", () => {
    expect(sql).toMatch(/dm_he_thong[\s\S]{0,200}don_vi_id\s*=\s*_id/);
  });
});

// P10.1 — primitive shared: renameEntity / updateEntityField / updateEntityRow
describe("SSoT primitives dùng chung", () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../rename-entity.ts"),
    "utf8",
  );
  it("export đủ 3 primitive", () => {
    expect(src).toMatch(/export\s+async\s+function\s+renameEntity/);
    expect(src).toMatch(/export\s+async\s+function\s+updateEntityField/);
    expect(src).toMatch(/export\s+async\s+function\s+updateEntityRow/);
  });
  it("updateEntityField chặn ghi cột tên (chuyển hướng qua renameEntity)", () => {
    expect(src).toMatch(/Không ghi cột tên qua updateEntityField/);
  });
  it("kind bao phủ đủ danh mục dùng chung (md, nsx, ncc, loai, dv, vt)", () => {
    for (const k of ["md", "nsx", "ncc", "loai", "dv", "vt"]) {
      expect(src).toMatch(new RegExp(`\\b${k}\\s*:\\s*\\{\\s*table\\s*:`));
    }
  });
  it("CatalogTable + trang model dùng updateEntityRow (không supabase.update trực tiếp)", () => {
    const catalog = fs.readFileSync(
      path.resolve(__dirname, "../../../components/mirats/CatalogTable.tsx"),
      "utf8",
    );
    const model = fs.readFileSync(
      path.resolve(__dirname, "../../../routes/_app.danh-muc.model.tsx"),
      "utf8",
    );
    expect(catalog).toMatch(/updateEntityRow\s*\(/);
    expect(model).toMatch(/updateEntityRow\s*\(/);
    // Không còn call trực tiếp `.from(table).update(` cho update-by-id trong CatalogTable
    expect(catalog).not.toMatch(/supabase\.from\(table\)\.update\(payload/);
    expect(model).not.toMatch(/supabase\.from\("dm_model"\)\.update\(payload\)/);
  });
});

