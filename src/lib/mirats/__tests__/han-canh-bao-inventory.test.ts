// ============================================================================
// Task 52 — Guard: mọi nguồn "sắp hết hạn" cùng ngưỡng + cùng view v_sap_het_han.
// - Không còn literal '?? 90' trong bao-cao/*.
// - Không còn '+ 30' cứng cho giay_phep_sap_het_han trong query-helpers.
// - Các module tổng hợp (db-expiring, use-nav-badges) đọc v_sap_het_han.
// - canh-bao-het-han import NGUONG_CANH_BAO từ han-canh-bao.
// ============================================================================
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_NGAY_SAP_HET_HAN, NGUONG_CANH_BAO } from "../han-canh-bao";
import { buildBaoCaoSapHetHan } from "../bao-cao/build";
import { buildDashboardSql } from "@/lib/ai/query-helpers";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Task 52 — nguồn cảnh báo hết hạn duy nhất", () => {
  it("DEFAULT_NGAY_SAP_HET_HAN = 90 và nằm trong NGUONG_CANH_BAO", () => {
    expect(DEFAULT_NGAY_SAP_HET_HAN).toBe(90);
    expect(NGUONG_CANH_BAO).toContain(DEFAULT_NGAY_SAP_HET_HAN);
  });

  it("buildBaoCaoSapHetHan mặc định dùng DEFAULT_NGAY_SAP_HET_HAN", () => {
    const r = buildBaoCaoSapHetHan({});
    expect(r.meta.tieu_de).toContain(`≤ ${DEFAULT_NGAY_SAP_HET_HAN} ngày`);
  });

  it("bao-cao/build.ts không còn literal '?? 90'", () => {
    const src = read("src/lib/mirats/bao-cao/build.ts");
    expect(src).not.toMatch(/\?\?\s*90\b/);
  });

  it("bao-cao.functions.ts không còn literal '?? 90'", () => {
    const src = read("src/lib/mirats/bao-cao/bao-cao.functions.ts");
    expect(src).not.toMatch(/\?\?\s*90\b/);
  });

  it("buildDashboardSql dùng v_sap_het_han + DEFAULT_NGAY_SAP_HET_HAN, không có current_date + 30", () => {
    const sql = buildDashboardSql();
    expect(sql).toContain("v_sap_het_han");
    expect(sql).toContain(`BETWEEN 0 AND ${DEFAULT_NGAY_SAP_HET_HAN}`);
    expect(sql).not.toMatch(/current_date\s*\+\s*30/);
  });

  it("db-expiring.ts đọc v_sap_het_han (không truy vấn thẳng thiet_bi/giay_phep để tính hết hạn)", () => {
    const src = read("src/lib/mirats/db-expiring.ts");
    expect(src).toContain('.from("v_sap_het_han")');
  });

  it("use-nav-badges.ts đọc v_sap_het_han cho cả giấy phép và chứng chỉ KĐ/HC", () => {
    const src = read("src/hooks/use-nav-badges.ts");
    const matches = src.match(/v_sap_het_han/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(src).toContain("DEFAULT_NGAY_SAP_HET_HAN");
  });

  it("canh-bao-het-han.ts import NGUONG_CANH_BAO từ han-canh-bao (không tự khai literal)", () => {
    const src = read("src/lib/mirats/canh-bao-het-han.ts");
    expect(src).toMatch(/from\s+["']\.\/han-canh-bao["']/);
    // Không có mảng literal [30, 60, 90] tự khai lại trong file.
    expect(src).not.toMatch(/\[\s*30\s*,\s*60\s*,\s*90\s*\]/);
  });

  it("không route nào còn import fmtVND/fmtDowntime qua metrics.ts", () => {
    const files = [
      "src/routes/_app.tuoi-tho.tsx",
      "src/routes/_app.su-co.index.tsx",
      "src/routes/_app.su-co.$maSuCo.tsx",
      "src/routes/_app.index.tsx",
      "src/routes/_app.hong-hoc.tsx",
      "src/routes/_app.hong-hoc.$maHongHoc.tsx",
      "src/components/mirats/VatTuTieuHaoView.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      const metricsImport = src.match(/from\s+["']@\/lib\/mirats\/metrics["']/g);
      if (metricsImport) {
        // Chỉ chấp nhận nếu KHÔNG kéo fmtVND / fmtDowntime.
        const line = src.split("\n").find((l) => l.includes("@/lib/mirats/metrics"));
        expect(line, `${f}: ${line}`).not.toMatch(/fmtVND|fmtDowntime/);
      }
    }
  });
});
