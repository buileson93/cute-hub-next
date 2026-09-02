// ============================================================================
// Hợp đồng SCHEMA cho nhập liệu All-in-One:
// Mọi cột đích mà import-config sẽ ghi (col ?? key, hoặc ref.idCol) PHẢI tồn tại
// trong types sinh tự động từ CSDL (src/integrations/supabase/types.ts).
// Sai một tên cột → PostgREST trả 400 và cả dòng nhập bị mất, nên khoá lại bằng test.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ENTITIES, CATALOG_TABLES, catalogEntity } from "@/lib/mirats/import-config";

/** Trích tập cột của từng bảng public từ khối `Row: {...}` trong types.ts. */
function tableColumns(): Map<string, Set<string>> {
  const src = readFileSync(
    path.resolve(process.cwd(), "src/integrations/supabase/types.ts"),
    "utf8",
  );
  const out = new Map<string, Set<string>>();
  const tableRe = /^ {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/gm;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(src))) {
    const cols = new Set<string>();
    for (const line of m[2]!.split("\n")) {
      const c = line.match(/^ {10}"?([A-Za-z0-9_]+)"?\??:/);
      if (c) cols.add(c[1]!);
    }
    if (cols.size) out.set(m[1]!, cols);
  }
  return out;
}

const columns = tableColumns();

describe("import All-in-One khớp schema CSDL", () => {
  it("đọc được danh sách bảng/cột từ types sinh tự động", () => {
    expect(columns.get("thiet_bi")?.has("ma_thiet_bi")).toBe(true);
    expect(columns.get("thiet_bi")?.has("ty_le_tuoi_tho")).toBe(true);
  });

  const entities = [...ENTITIES, ...CATALOG_TABLES.map((c) => catalogEntity(c.table))];

  it("mọi cột đích của mọi entity đều tồn tại trong CSDL", () => {
    const missing: string[] = [];
    for (const ent of entities) {
      const cols = columns.get(ent.table);
      expect(cols, `Không có bảng ${ent.table} trong types`).toBeTruthy();
      if (!cols) continue;
      if (!cols.has(ent.naturalKey)) missing.push(`${ent.table}.${ent.naturalKey} (naturalKey)`);
      for (const f of ent.fields) {
        if (f.virtual) continue;
        const col = f.kind === "ref" && f.ref ? f.ref.idCol : (f.col ?? f.key);
        if (!cols.has(col)) missing.push(`${ent.table}.${col} (field "${f.key}")`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("mọi bảng tham chiếu và cột tra cứu (ma/ten) đều tồn tại", () => {
    const missing: string[] = [];
    for (const ent of entities) {
      for (const f of ent.fields) {
        if (f.kind !== "ref" || !f.ref) continue;
        const cols = columns.get(f.ref.table);
        if (!cols) {
          missing.push(`bảng ${f.ref.table}`);
          continue;
        }
        for (const c of [f.ref.keyCol ?? "ma", f.ref.nameCol ?? "ten"]) {
          if (!cols.has(c)) missing.push(`${f.ref.table}.${c}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
