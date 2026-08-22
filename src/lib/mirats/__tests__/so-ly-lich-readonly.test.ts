// ============================================================================
// P9 — Sổ lý lịch chỉ-đọc & phản chiếu đúng thay đổi từ cây.
//
//  • Field thuộc layer khác → `isReadOnlyOnLayer` = true → sổ chỉ tường thuật,
//    không mở đường sửa.
//  • `mapChangeEventForLayer` gắn tiền tố "[chỉ đọc từ layer khác]" khi có
//    field xuyên layer — để UI Sổ lý lịch không lẫn với ô sửa nghiệp vụ.
//  • Source-scan `LyLichLayerPanel.tsx`:
//      – Nhúng ChangeLogPanel cho cả thành phần & hệ thống → cây edit hiện đủ.
//      – Không import mutation nghiệp vụ ngoài `useSuaNgayLap` (ngày lắp thực tế).
// ============================================================================

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENTITY_TO_LAYER,
  isReadOnlyOnLayer,
  mapChangeEventForLayer,
  KEYS_BY_LAYER,
} from "@/lib/mirats/so-ly-lich";
import type { ChangeEvent } from "@/lib/mirats/change-log";

describe("isReadOnlyOnLayer — biên giới field giữa các layer", () => {
  it("ma_serial thuộc `tb` → chỉ-đọc trên layer `ht`", () => {
    expect(isReadOnlyOnLayer("ht", "ma_serial")).toBe(true);
    expect(isReadOnlyOnLayer("tb", "ma_serial")).toBe(false);
  });

  it("kieu_thiet_bi_gp thuộc `ht` → chỉ-đọc trên layer `tb`", () => {
    expect(isReadOnlyOnLayer("tb", "kieu_thiet_bi_gp")).toBe(true);
    expect(isReadOnlyOnLayer("ht", "kieu_thiet_bi_gp")).toBe(false);
  });

  it("field không thuộc registry nào (vd. `ghi_chu_lien_ket`) → không đánh cross-layer", () => {
    expect(isReadOnlyOnLayer("tb", "ghi_chu_lien_ket")).toBe(false);
    expect(isReadOnlyOnLayer("ht", "ghi_chu_lien_ket")).toBe(false);
    expect(isReadOnlyOnLayer("tp", "ghi_chu_lien_ket")).toBe(false);
  });
});

describe("ENTITY_TO_LAYER — mọi bảng chính đều có layer sở hữu", () => {
  it("map đúng 3 bảng gốc", () => {
    expect(ENTITY_TO_LAYER.thiet_bi).toBe("tb");
    expect(ENTITY_TO_LAYER.dm_he_thong).toBe("ht");
    expect(ENTITY_TO_LAYER.he_thong_thanh_phan).toBe("tp");
  });

  it("layer tb & ht có tập khoá vật lý; tp chưa sở hữu field riêng", () => {
    expect(KEYS_BY_LAYER.tb.size).toBeGreaterThan(0);
    expect(KEYS_BY_LAYER.ht.size).toBeGreaterThan(0);
    expect(KEYS_BY_LAYER.tp.size).toBe(0);
  });
});

describe("mapChangeEventForLayer — gắn nhãn chỉ-đọc cho field xuyên layer", () => {
  const evUpdate: ChangeEvent = {
    id: "e1",
    at: "2026-07-01T10:00:00Z",
    action: "update",
    userName: "Admin",
    changes: [{ key: "ma_serial", label: "Số serial", from: "SN-1", to: "SN-2" }],
  };

  it("khi field thuộc layer đúng → không thêm tiền tố", () => {
    const out = mapChangeEventForLayer(evUpdate, "tb");
    expect(out.action).toBe("update");
    expect(out.changesCount).toBe(1);
    expect(out.changesText).not.toMatch(/chỉ đọc/i);
  });

  it("khi field thuộc layer khác → prefix `[chỉ đọc từ layer khác]`", () => {
    const out = mapChangeEventForLayer(evUpdate, "ht");
    expect(out.changesText).toMatch(/^\[chỉ đọc từ layer khác\]/);
  });

  it("insert/delete: giữ nguyên metadata, đếm 0 thay đổi field", () => {
    const evIns: ChangeEvent = { ...evUpdate, action: "insert", changes: [] };
    const out = mapChangeEventForLayer(evIns, "tb");
    expect(out.action).toBe("insert");
    expect(out.changesCount).toBe(0);
  });
});

describe("LyLichLayerPanel — cây edit hiện đủ + không mở sửa nghiệp vụ trùng", () => {
  const src = readFileSync(
    join(process.cwd(), "src", "components", "mirats", "LyLichLayerPanel.tsx"),
    "utf8",
  );

  it("nhúng ChangeLogPanel cho THÀNH PHẦN (bảng he_thong_thanh_phan)", () => {
    expect(src).toMatch(/ChangeLogPanel\s+entity="he_thong_thanh_phan"/);
  });

  it("nhúng ChangeLogPanel cho HỆ THỐNG (bảng dm_he_thong)", () => {
    expect(src).toMatch(/ChangeLogPanel\s+entity="dm_he_thong"/);
  });

  it("chỉ dùng mutation `useSuaNgayLap` — không kéo saveCell/renameEntity vào sổ", () => {
    // Whitelist duy nhất: sửa ngày lắp thực tế.
    expect(src).toMatch(/useSuaNgayLap/);
    // Không được dùng các mutation chỉnh field nghiệp vụ ngay trong sổ.
    expect(src).not.toMatch(/\brenameEntity\s*\(/);
    expect(src).not.toMatch(/\bsaveCell\s*\(/);
    expect(src).not.toMatch(/\bsaveNode\s*\(/);
  });
});
