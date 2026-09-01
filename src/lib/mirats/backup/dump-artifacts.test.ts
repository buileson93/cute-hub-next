import { describe, expect, it } from "vitest";
import {
  buildLimitationsDoc,
  buildRestoreReadme,
  dumpFolderName,
  restoreOrder,
  type DumpManifestFile,
} from "./dump-artifacts";

const manifest: DumpManifestFile = {
  formatVersion: 1,
  createdAt: "2026-09-01T03:00:00.000Z",
  environment: "mirats",
  generator: "mirats-admin-backup",
  counts: { tables: 2, rows: 3, policies: 4, views: 1, functions: 5 },
  restoreOrder: ["du_an", "du_an_cong_viec"],
  artifacts: [{ path: "data/du_an.json", kind: "data", status: "ok", rows: 2 }],
  limitations: ["Không xuất mật khẩu băm."],
};

describe("dumpFolderName", () => {
  it("đặt tên theo quy ước supbase-dump-YYYYMMDD-HHmmss", () => {
    expect(dumpFolderName(new Date(2026, 8, 1, 4, 5, 6))).toBe("supbase-dump-20260901-040506");
  });
});

describe("restoreOrder", () => {
  it("xếp bảng cha trước bảng con", () => {
    const order = restoreOrder(
      ["du_an_cong_viec", "du_an", "profiles"],
      [
        { from_table: "du_an_cong_viec", to_table: "du_an" },
        { from_table: "du_an", to_table: "profiles" },
      ],
    );
    expect(order.indexOf("profiles")).toBeLessThan(order.indexOf("du_an"));
    expect(order.indexOf("du_an")).toBeLessThan(order.indexOf("du_an_cong_viec"));
  });

  it("bỏ qua tự tham chiếu và giữ đủ số bảng khi có chu trình", () => {
    const order = restoreOrder(
      ["a", "b", "c"],
      [
        { from_table: "a", to_table: "a" },
        { from_table: "b", to_table: "c" },
        { from_table: "c", to_table: "b" },
      ],
    );
    expect(order.sort()).toEqual(["a", "b", "c"]);
  });
});

describe("tài liệu phục hồi", () => {
  it("nêu đúng thứ tự schema → RLS → grants → dữ liệu", () => {
    const md = buildRestoreReadme(manifest);
    expect(md.indexOf("schema.sql")).toBeLessThan(md.indexOf("rls-policies.sql"));
    expect(md.indexOf("rls-policies.sql")).toBeLessThan(md.indexOf("grants.sql"));
    expect(md.indexOf("grants.sql")).toBeLessThan(md.indexOf("restoreOrder"));
  });

  it("liệt kê giới hạn và trạng thái artifact", () => {
    const md = buildLimitationsDoc(manifest);
    expect(md).toContain("Không xuất mật khẩu băm.");
    expect(md).toContain("data/du_an.json");
  });
});
