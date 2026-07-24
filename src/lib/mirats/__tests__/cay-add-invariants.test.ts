// ============================================================================
// P8 — Chốt bất biến "khai thêm mượt & hiện ngay" trên _app.he-thong.cay.tsx:
//  - Ba mutation add* đều validate tên + invalidate cache "db_taxonomy".
//  - addSystem yêu cầu Đơn vị quản lý và có fallback phân loại từ nhóm cha.
//  - addDevice yêu cầu heThongId (không tạo tài sản mồ côi).
//  - Không còn key sai chính tả "db-taxonomy" trong toàn bộ src/.
// ============================================================================

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), "src", "routes", "_app.he-thong.cay.tsx");
const src = readFileSync(FILE, "utf8");

function block(name: string): string {
  const idx = src.indexOf(`const ${name} = useMutation`);
  expect(idx, `không tìm thấy mutation ${name}`).toBeGreaterThan(-1);
  return src.slice(idx, idx + 4000);
}

describe("addGroup / addSystem / addDevice — validate + invalidate", () => {
  it("addGroup: validate tên rỗng, sinh mã fallback NH_, invalidate db_taxonomy", () => {
    const b = block("addGroup");
    expect(b).toMatch(/không được để trống/i);
    expect(b).toMatch(/NH_\$\{/);
    expect(b).toMatch(/queryKey:\s*\["db_taxonomy"\]/);
  });

  it("addSystem: yêu cầu Đơn vị quản lý + fallback plId từ Nhóm cha", () => {
    const b = block("addSystem");
    expect(b).toMatch(/donViId/);
    expect(b).toMatch(/Đơn vị quản lý/);
    expect(b).toMatch(/plIdEff/);
    expect(b).toMatch(/phan_loai_id/);
    expect(b).toMatch(/queryKey:\s*\["db_taxonomy"\]/);
  });

  it("addDevice: chặn tạo tài sản mồ côi + invalidate db_taxonomy", () => {
    const b = block("addDevice");
    expect(b).toMatch(/heThongId/);
    expect(b).toMatch(/hệ thống đã có trong CSDL/i);
    expect(b).toMatch(/queryKey:\s*\["db_taxonomy"\]/);
  });
});

describe("realSystems — nhánh hệ thống rỗng vẫn hiện lên", () => {
  it("useMemo realSystems: dựng từ dm_he_thong khi CHƯA có tài sản con", () => {
    // Xác nhận nhánh tồn tại — nó là điều kiện đủ để hệ thống mới add hiện ngay.
    expect(src).toMatch(/const realSystems = useMemo\(/);
    // Phải đẩy vào buildTree để 3 view (tree/table/mindmap) đều nhận.
    expect(src).toMatch(/buildTree\([\s\S]*?realSystems/);
  });
});

describe("Không còn queryKey sai chính tả 'db-taxonomy'", () => {
  it("toàn bộ src/ dùng đúng 'db_taxonomy'", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) {
          if (name === "__tests__") continue; // bỏ qua chính bộ test này
          walk(p);
        } else if (/\.(ts|tsx)$/.test(name)) {
          const txt = readFileSync(p, "utf8");
          if (txt.includes('"db-taxonomy"')) hits.push(p);
        }
      }
    };
    walk(join(process.cwd(), "src"));
    expect(hits, `Còn key sai chính tả tại: ${hits.join(", ")}`).toEqual([]);
  });
});
