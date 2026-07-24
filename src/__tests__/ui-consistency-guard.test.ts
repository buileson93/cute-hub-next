import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard đồng bộ UI trang danh sách (docs/ui-consistency-checklist.md).
 * 1) Cấm import "DataTable" bất cứ đâu trong src (đã xoá — TASK 67).
 * 2) Cấm thêm <Table thô mới trong src/routes/_app.*.tsx ngoài allowlist.
 *
 * Khi buộc phải giữ <Table thô, thêm tên file vào RAW_TABLE_ALLOWLIST và
 * ghi lý do vào bảng ngoại lệ trong docs/ui-consistency-checklist.md.
 */

const ROUTES_DIR = join(process.cwd(), "src", "routes");
const SRC_DIR = join(process.cwd(), "src");

const RAW_TABLE_ALLOWLIST = new Set<string>([
  "_app.index.tsx",
  "_app.admin.permissions.tsx",
  "_app.admin.nhap-lieu.tsx",
  "_app.admin.forms.tsx",
  "_app.phan-quyen.tsx",
  "_app.nhap-lieu.tsx",
  "_app.he-thong.cay.tsx",
  "_app.he-thong.thung-rac.tsx",

  "_app.bao-tri.cong-viec.tsx",
  "_app.bao-tri.$maBaoTri.tsx",
  "_app.hong-hoc.$maHongHoc.tsx",
  "_app.ban-giao.tsx",
  "_app.giay-phep.tsx",
  "_app.su-co.index.tsx",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(t|j)sx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe("UI consistency guard", () => {
  it("không còn import DataTable ở bất cứ đâu trong src", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      if (file.includes("__tests__")) continue;
      const src = readFileSync(file, "utf8");
      if (/from\s+["'][^"']*\/DataTable["']/.test(src) ||
          /import\s+.*\bDataTable\b.*from/.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders, `Cấm import DataTable — dùng StandardTable:\n${offenders.join("\n")}`)
      .toEqual([]);
  });

  it("không có <Table thô mới trong src/routes/_app.*.tsx (ngoài allowlist)", () => {
    const offenders: string[] = [];
    for (const entry of readdirSync(ROUTES_DIR)) {
      if (!entry.startsWith("_app.") || !entry.endsWith(".tsx")) continue;
      if (RAW_TABLE_ALLOWLIST.has(entry)) continue;
      const src = readFileSync(join(ROUTES_DIR, entry), "utf8");
      // Bắt <Table và <Table> nhưng không bắt <TableRow/<TableCell/<TableHead/<TableBody/<TableHeader/<TableCaption/<TableFooter
      if (/<Table[\s>]/.test(src)) {
        offenders.push(entry);
      }
    }
    expect(
      offenders,
      `Các route sau đang dùng <Table thô. Chuyển sang StandardTable, hoặc thêm vào RAW_TABLE_ALLOWLIST + docs/ui-consistency-checklist.md kèm lý do:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
