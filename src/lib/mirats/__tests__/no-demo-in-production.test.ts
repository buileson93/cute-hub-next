import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

// ============================================================================
// Cổng tự động — Nền dữ liệu: mã nguồn PRODUCTION không được import dữ liệu mẫu
// tĩnh. Dữ liệu demo (`@/data/*.json`) và module gom demo
// (`@/lib/mirats/demo-data`, tên cũ `@/lib/mirats/data`) chỉ dành cho
// seed/fixture/test, KHÔNG được nằm trong luồng hiển thị thật.
//
// Cổng quét TOÀN BỘ đồ thị production (mọi file .ts/.tsx dưới src, trừ test và
// chính các file demo/fixture) nên bắt được cả rò rỉ GIÁN TIẾP: route → component
// → demo-data. Nếu bất kỳ file production nào kéo demo vào bundle, test sẽ đỏ.
// ============================================================================

const SRC_DIR = join(process.cwd(), "src");
const ROUTES_DIR = join(SRC_DIR, "routes");

// Các file/thư mục KHÔNG phải mã production (được phép chứa/định nghĩa demo).
function isExcluded(rel: string): boolean {
  const parts = rel.split(sep);
  return (
    parts.includes("__tests__") ||
    /\.(test|spec)\.tsx?$/.test(rel) ||
    /(^|[\\/])demo-data\.ts$/.test(rel) || // chính module demo
    parts.includes("fixtures")
  );
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Bất kỳ import nào tới JSON demo hoặc module gom demo đều bị cấm ở production.
const FORBIDDEN: { rx: RegExp; label: string }[] = [
  { rx: /from\s+["']@\/data\//, label: "@/data/*.json (JSON demo)" },
  { rx: /from\s+["']@\/lib\/mirats\/(demo-)?data["']/, label: "@/lib/mirats/demo-data" },
  { rx: /from\s+["'](\.{1,2}\/)+(mirats\/)?(demo-)?data["']/, label: "demo-data (relative)" },
  { rx: /import\(\s*["']@\/data\//, label: "@/data/*.json (dynamic import)" },
  { rx: /import\(\s*["']@\/lib\/mirats\/(demo-)?data["']/, label: "demo-data (dynamic import)" },
];

function scan(file: string): string[] {
  const src = readFileSync(file, "utf8");
  return FORBIDDEN.filter(({ rx }) => rx.test(src)).map((f) => f.label);
}

describe("cổng dữ liệu: detector hoạt động đúng", () => {
  it("bắt import demo (đúng nguyên nhân) và bỏ qua import lành tính", () => {
    const bad = [
      `import x from "@/data/thiet_bi.json";`,
      `import { thietBi } from "@/lib/mirats/data";`,
      `import { thietBi } from "@/lib/mirats/demo-data";`,
      `import { thietBi } from "../mirats/demo-data";`,
      `const m = await import("@/lib/mirats/demo-data");`,
    ];
    for (const line of bad) {
      expect(
        FORBIDDEN.some(({ rx }) => rx.test(line)),
        line,
      ).toBe(true);
    }
    const ok = [
      `import { fmtVND } from "@/lib/mirats/metrics";`,
      `import { supabase } from "@/integrations/backend/client";`,
      `import data from "@/lib/other/database";`,
    ];
    for (const line of ok) {
      expect(
        FORBIDDEN.some(({ rx }) => rx.test(line)),
        line,
      ).toBe(false);
    }
  });
});

describe("mã production không được import dữ liệu mẫu", () => {
  const files = collectFiles(SRC_DIR).filter((f) => !isExcluded(relative(SRC_DIR, f)));

  it("tìm thấy file production để quét", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("không file production nào import demo/fixture", () => {
    const offenders = files
      .map((f) => ({ rel: relative(process.cwd(), f), hits: scan(f) }))
      .filter((r) => r.hits.length > 0);
    expect(
      offenders,
      `Các file sau kéo dữ liệu mẫu vào bundle:\n` +
        offenders.map((o) => `  - ${o.rel}: ${o.hits.join(", ")}`).join("\n"),
    ).toEqual([]);
  });
});

describe("route production không được import dữ liệu mẫu (kiểm tra riêng)", () => {
  const routeFiles = collectFiles(ROUTES_DIR).filter((f) => !isExcluded(relative(SRC_DIR, f)));
  for (const file of routeFiles) {
    const rel = relative(process.cwd(), file);
    it(`không import demo: ${rel}`, () => {
      expect(scan(file), `${rel} import demo`).toEqual([]);
    });
  }
});
